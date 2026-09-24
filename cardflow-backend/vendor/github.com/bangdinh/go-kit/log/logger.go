package log

import (
	"fmt"
	"io"
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type Config struct {
	Level       string          `mapstructure:"level"`
	Environment string          `mapstructure:"environment"`
	ServiceName string          `mapstructure:"service_name"`
	// Format selects the output encoding: "" (default) or "text" for a single
	// human-readable line per entry (timestamp, goroutine, level, calling function,
	// message, and every field merged inline — never a separate trailing JSON blob,
	// and without the service/env fields JSON mode attaches to every entry, since
	// they'd otherwise repeat unchanged on every line); "json" for structured JSON.
	Format   string          `mapstructure:"format"`
	Telegram *TelegramConfig `mapstructure:"telegram"`
}

// NewLogger creates a logger that writes to stdout in the format selected by cfg.Format
// (default: single-line human-readable text; set Format: "json" for structured JSON).
func NewLogger(cfg Config) (*zap.Logger, error) {
	return NewLoggerWithWriter(cfg, os.Stdout)
}

// NewLoggerWithWriter creates a logger that writes to w. Useful for testing. The
// environment affects timestamps (ISO8601 for local/dev, epoch for others), stack
// traces, and zap.Development mode. The output encoding is controlled solely by
// cfg.Format ("json" → structured JSON, anything else including unset → single-line
// human-readable text) — environment never overrides it.
func NewLoggerWithWriter(cfg Config, w io.Writer) (*zap.Logger, error) {
	var level zapcore.Level
	if err := level.UnmarshalText([]byte(cfg.Level)); err != nil {
		return nil, fmt.Errorf("parsing log level: %w", err)
	}

	isTextFormat := cfg.Format != "json"

	var encoder zapcore.Encoder
	if isTextFormat {
		encoder = newTextEncoder()
	} else {
		encoderConfig := zap.NewProductionEncoderConfig()
		if cfg.Environment == "local" || cfg.Environment == "dev" {
			encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
		}
		encoder = zapcore.NewJSONEncoder(encoderConfig)
	}

	consoleCore := zapcore.NewCore(
		encoder,
		zapcore.AddSync(w),
		level,
	)

	var core zapcore.Core = consoleCore
	if cfg.Telegram != nil && cfg.Telegram.Enabled {
		tgCore := newTelegramCore(*cfg.Telegram)
		core = zapcore.NewTee(consoleCore, tgCore)
	}

	opts := []zap.Option{
		zap.AddCaller(),
		zap.AddStacktrace(zapcore.ErrorLevel),
	}

	if cfg.Environment == "local" || cfg.Environment == "dev" {
		opts = append(opts, zap.Development())
	}

	logger := zap.New(core, opts...)
	if !isTextFormat {
		logger = logger.With(
			zap.String("service", cfg.ServiceName),
			zap.String("env", cfg.Environment),
		)
	}

	return logger, nil
}
