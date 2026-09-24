package log

import (
	"fmt"
	"runtime"
	"sort"
	"strings"

	"go.uber.org/zap/buffer"
	"go.uber.org/zap/zapcore"
)

// newTextEncoder builds an Encoder that renders each entry as a single human-readable
// line — timestamp, goroutine, level, calling function, message, and every structured
// field merged inline as key=value pairs — instead of JSON. Unlike zapcore's stock
// console encoder, structured fields are never left as a separate trailing JSON blob;
// they're part of the same line as the message.
func newTextEncoder() zapcore.Encoder {
	return &textEncoder{
		MapObjectEncoder: zapcore.NewMapObjectEncoder(),
		pool:             buffer.NewPool(),
	}
}

type textEncoder struct {
	*zapcore.MapObjectEncoder
	pool buffer.Pool
}

func (enc *textEncoder) Clone() zapcore.Encoder {
	clone := &textEncoder{
		MapObjectEncoder: zapcore.NewMapObjectEncoder(),
		pool:             enc.pool,
	}
	for key, value := range enc.Fields {
		clone.Fields[key] = value
	}
	return clone
}

func (enc *textEncoder) EncodeEntry(entry zapcore.Entry, fields []zapcore.Field) (*buffer.Buffer, error) {
	line := enc.pool.Get()

	line.AppendString(entry.Time.Format("2006-01-02 15:04:05.000"))
	line.AppendString(" [")
	line.AppendString(currentGoroutineLabel())
	line.AppendString("] ")
	line.AppendString(fmt.Sprintf("%-5s", entry.Level.CapitalString()))
	line.AppendString(" ")
	line.AppendString(callerFunctionName(entry.Caller))
	line.AppendString(" - ")
	line.AppendString(entry.Message)

	mergedFields := zapcore.NewMapObjectEncoder()
	for key, value := range enc.Fields {
		mergedFields.Fields[key] = value
	}
	for _, field := range fields {
		field.AddTo(mergedFields)
	}
	appendFieldsInline(line, mergedFields.Fields)

	if entry.Stack != "" {
		line.AppendString("\n")
		line.AppendString(entry.Stack)
	}
	line.AppendString("\n")

	return line, nil
}

func appendFieldsInline(line *buffer.Buffer, fields map[string]any) {
	if len(fields) == 0 {
		return
	}
	keys := make([]string, 0, len(fields))
	for key := range fields {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	for _, key := range keys {
		line.AppendString(" ")
		line.AppendString(key)
		line.AppendString("=")
		line.AppendString(fmt.Sprint(fields[key]))
	}
}

// callerFunctionName resolves the short function name (package.Func, no full import
// path) that made the logging call, falling back to the file:line if the runtime can't
// resolve a function for the caller's program counter.
func callerFunctionName(caller zapcore.EntryCaller) string {
	if !caller.Defined {
		return "unknown"
	}
	fn := runtime.FuncForPC(caller.PC)
	if fn == nil {
		return caller.TrimmedPath()
	}
	name := fn.Name()
	if idx := strings.LastIndex(name, "/"); idx >= 0 {
		name = name[idx+1:]
	}
	return name
}

// currentGoroutineLabel extracts "goroutine-<id>" from the current goroutine's stack
// trace header. Go has no first-class named-thread concept or public goroutine-ID API;
// parsing runtime.Stack's leading "goroutine N [...]:" line is the standard technique
// for surfacing an identifier for log correlation purposes only — never rely on it for
// program logic.
func currentGoroutineLabel() string {
	var stackHeader [64]byte
	n := runtime.Stack(stackHeader[:], false)
	fields := strings.Fields(strings.TrimPrefix(string(stackHeader[:n]), "goroutine "))
	if len(fields) == 0 {
		return "goroutine-?"
	}
	return "goroutine-" + fields[0]
}
