package log

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"go.uber.org/zap/zapcore"
)

// TelegramConfig configures the Telegram log appender.
type TelegramConfig struct {
	Enabled  bool   `mapstructure:"enabled"`
	Token    string `mapstructure:"token"`
	ChatID   string `mapstructure:"chat_id"`
	MinLevel string `mapstructure:"min_level"` // "debug", "info", "warn", "error" — default "warn"
	Async    bool   `mapstructure:"async"`     // send in background (non-blocking); Go zero value is false (synchronous) — no default is applied
	BufSize  int    `mapstructure:"buf_size"`  // async channel buffer; default 64

	// apiBaseURL overrides the Telegram API base for testing.
	apiBaseURL string
}

func (c *TelegramConfig) minLevel() zapcore.Level {
	var lvl zapcore.Level
	if err := lvl.UnmarshalText([]byte(c.MinLevel)); err != nil {
		return zapcore.WarnLevel
	}
	return lvl
}

func (c *TelegramConfig) resolvedBaseURL() string {
	if c.apiBaseURL != "" {
		return c.apiBaseURL
	}
	return fmt.Sprintf("https://api.telegram.org/bot%s", c.Token)
}

// telegramCore is a zap core that forwards log entries to a Telegram chat.
type telegramCore struct {
	minLvl  zapcore.Level
	enc     zapcore.Encoder
	chatID  string
	baseURL string
	async   bool
	queue   chan string
	done    chan struct{}
	client  *http.Client
}

func newTelegramCore(cfg TelegramConfig) *telegramCore {
	bufSize := cfg.BufSize
	if bufSize <= 0 {
		bufSize = 64
	}

	enc := zapcore.NewConsoleEncoder(zapcore.EncoderConfig{
		TimeKey:        "",
		LevelKey:       "L",
		NameKey:        "N",
		CallerKey:      "",
		MessageKey:     "M",
		StacktraceKey:  "",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.CapitalLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.StringDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	})

	core := &telegramCore{
		minLvl:  cfg.minLevel(),
		enc:     enc,
		chatID:  cfg.ChatID,
		baseURL: cfg.resolvedBaseURL(),
		async:   cfg.Async,
		queue:   make(chan string, bufSize),
		done:    make(chan struct{}),
		client:  &http.Client{Timeout: 10 * time.Second},
	}

	if cfg.Async {
		go core.drain()
	}

	return core
}

func (c *telegramCore) Enabled(lvl zapcore.Level) bool {
	return lvl >= c.minLvl
}

func (c *telegramCore) With(fields []zapcore.Field) zapcore.Core {
	clone := c.clone()
	for _, f := range fields {
		f.AddTo(clone.enc)
	}
	return clone
}

func (c *telegramCore) Check(entry zapcore.Entry, ce *zapcore.CheckedEntry) *zapcore.CheckedEntry {
	if c.Enabled(entry.Level) {
		return ce.AddCore(entry, c)
	}
	return ce
}

func (c *telegramCore) Write(entry zapcore.Entry, fields []zapcore.Field) error {
	if !c.Enabled(entry.Level) {
		return nil
	}

	buf, err := c.enc.EncodeEntry(entry, fields)
	if err != nil {
		return err
	}
	text := formatTelegramMessage(entry, buf.String())

	if c.async {
		select {
		case c.queue <- text:
		default:
			// buffer full — drop rather than block
		}
		return nil
	}

	return c.send(text)
}

func (c *telegramCore) Sync() error {
	if !c.async {
		return nil
	}
	deadline := time.NewTimer(5 * time.Second)
	defer deadline.Stop()
	for {
		select {
		case text := <-c.queue:
			_ = c.send(text)
		case <-deadline.C:
			return nil
		default:
			return nil
		}
	}
}

func (c *telegramCore) clone() *telegramCore {
	return &telegramCore{
		minLvl:  c.minLvl,
		enc:     c.enc.Clone(),
		chatID:  c.chatID,
		baseURL: c.baseURL,
		async:   c.async,
		queue:   c.queue,
		done:    c.done,
		client:  c.client,
	}
}

func (c *telegramCore) drain() {
	for {
		select {
		case text := <-c.queue:
			_ = c.send(text)
		case <-c.done:
			return
		}
	}
}

func (c *telegramCore) send(text string) error {
	payload, err := json.Marshal(map[string]string{
		"chat_id": c.chatID,
		"text":    text,
	})
	if err != nil {
		return err
	}

	resp, err := c.client.Post(
		c.baseURL+"/sendMessage",
		"application/json",
		bytes.NewReader(payload),
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}

var levelEmoji = map[zapcore.Level]string{
	zapcore.DebugLevel:  "🔵",
	zapcore.InfoLevel:   "🟢",
	zapcore.WarnLevel:   "🟡",
	zapcore.ErrorLevel:  "🔴",
	zapcore.DPanicLevel: "💀",
	zapcore.PanicLevel:  "💀",
	zapcore.FatalLevel:  "💀",
}

func formatTelegramMessage(entry zapcore.Entry, encoded string) string {
	emoji := levelEmoji[entry.Level]
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("%s [%s] %s\n", emoji, entry.Level.CapitalString(), entry.Time.Format("2006-01-02 15:04:05")))
	sb.WriteString(entry.Message)

	// encoded contains level+message+fields from console encoder; extract the fields tail
	if idx := strings.Index(encoded, entry.Message); idx >= 0 {
		tail := strings.TrimSpace(encoded[idx+len(entry.Message):])
		if tail != "" {
			sb.WriteString("\n")
			sb.WriteString(tail)
		}
	}

	return sb.String()
}
