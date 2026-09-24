package kafka

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"time"

	kafkago "github.com/segmentio/kafka-go"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

// Message represents a Kafka message received by a consumer group.
type Message struct {
	Topic     string
	Partition int32
	Offset    int64
	Key       []byte
	Value     []byte
	Headers   map[string][]byte
	Timestamp time.Time
}

// MessageHandler processes a received Kafka message.
// In ack_mode "auto" (default), a non-nil return logs the error and marks the
// offset as processed anyway. In ack_mode "manual", a non-nil return instead
// triggers backoff-retry and, on ErrDeadLetter or exhausted retries, dead-lettering.
// See the ack-mode table in messaging/kafka/README.md for the full behavior.
type MessageHandler func(ctx context.Context, msg Message) error

// ErrRetry tells a manual-ack consumer to redeliver the same message after backoff.
// Any non-nil error has the same effect; ErrRetry exists so handlers can be explicit.
var ErrRetry = errors.New("kafka: retry message")

// ErrDeadLetter tells a manual-ack consumer the message can never succeed
// (schema violation, tenant mismatch, …). It is published to DeadLetterTopic
// and then committed. Wrap it: errors.Join(kafka.ErrDeadLetter, cause).
var ErrDeadLetter = errors.New("kafka: dead-letter message")

// DeadLetter is the JSON envelope written to DeadLetterTopic.
type DeadLetter struct {
	Topic     string            `json:"topic"`
	Partition int32             `json:"partition"`
	Offset    int64             `json:"offset"`
	Key       []byte            `json:"key,omitempty"`
	Headers   map[string][]byte `json:"headers,omitempty"`
	Value     []byte            `json:"value"`
	Error     string            `json:"error"`
	Attempts  int               `json:"attempts"`
	FailedAt  time.Time         `json:"failedAt"`
}

// ConsumerParams are the fx-injected dependencies of NewConsumer.
// DeadLetter is optional: required only when consumer.dead_letter_topic is set.
type ConsumerParams struct {
	fx.In
	Lifecycle  fx.Lifecycle
	Config     *Config
	Logger     *zap.Logger
	DeadLetter Producer `optional:"true"`
}

// Consumer subscribes to Kafka topics via a consumer group.
type Consumer interface {
	// Subscribe blocks and calls handler for each message until ctx is cancelled or Close is called.
	Subscribe(ctx context.Context, handler MessageHandler) error
	Close() error
}

// kafkaReader is the subset of *kafka-go.Reader this package depends on,
// narrowed to an interface so tests can inject a fake without a live broker.
type kafkaReader interface {
	FetchMessage(ctx context.Context) (kafkago.Message, error)
	CommitMessages(ctx context.Context, msgs ...kafkago.Message) error
	Close() error
}

type kafkaConsumer struct {
	reader     kafkaReader
	logger     *zap.Logger
	cfg        ConsumerConfig
	deadLetter Producer
}

var newKafkaReader = func(cfg *Config) kafkaReader {
	readerConfig := kafkago.ReaderConfig{
		Brokers:     cfg.Brokers,
		GroupID:     cfg.Consumer.GroupID,
		GroupTopics: cfg.Consumer.Topics,
		StartOffset: startOffsetFromConfig(cfg.Consumer.InitialOffset),
		Dialer:      buildDialer(cfg),
	}
	if cfg.Consumer.SessionTimeout > 0 {
		readerConfig.SessionTimeout = cfg.Consumer.SessionTimeout
	}
	if cfg.Consumer.HeartbeatInterval > 0 {
		readerConfig.HeartbeatInterval = cfg.Consumer.HeartbeatInterval
	}
	return kafkago.NewReader(readerConfig)
}

func NewConsumer(p ConsumerParams) (Consumer, error) {
	cfg, logger := p.Config, p.Logger
	if cfg.Consumer.GroupID == "" {
		return nil, fmt.Errorf("kafka: consumer.group_id is required")
	}
	if len(cfg.Consumer.Topics) == 0 {
		return nil, fmt.Errorf("kafka: consumer.topics must not be empty")
	}
	if cfg.Consumer.AckMode != "" && cfg.Consumer.AckMode != "auto" && cfg.Consumer.AckMode != "manual" {
		return nil, fmt.Errorf("kafka: consumer.ack_mode must be auto or manual, got %q", cfg.Consumer.AckMode)
	}
	if cfg.Consumer.DeadLetterTopic != "" && p.DeadLetter == nil {
		return nil, fmt.Errorf("kafka: consumer.dead_letter_topic requires a Producer in the fx graph")
	}

	dialCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := dialKafka(dialCtx, cfg); err != nil {
		return nil, fmt.Errorf("kafka: create consumer group: %w", err)
	}

	logger.Info("kafka consumer group created",
		zap.Strings("brokers", cfg.Brokers),
		zap.String("group_id", cfg.Consumer.GroupID),
		zap.Strings("topics", cfg.Consumer.Topics),
		zap.String("ack_mode", cfg.Consumer.AckMode),
	)

	consumer := &kafkaConsumer{reader: newKafkaReader(cfg), logger: logger, cfg: cfg.Consumer, deadLetter: p.DeadLetter}

	p.Lifecycle.Append(fx.Hook{
		OnStop: func(_ context.Context) error {
			logger.Info("closing kafka consumer group")
			return consumer.Close()
		},
	})

	return consumer, nil
}

func (consumer *kafkaConsumer) Subscribe(ctx context.Context, handler MessageHandler) error {
	for {
		msg, err := consumer.reader.FetchMessage(ctx)
		if err != nil {
			if ctx.Err() != nil || errors.Is(err, context.Canceled) || errors.Is(err, io.EOF) {
				return nil
			}
			return fmt.Errorf("kafka: consume: %w", err)
		}

		if consumer.cfg.manual() {
			if err := consumer.processManual(ctx, msg, handler); err != nil {
				if ctx.Err() != nil {
					return nil
				}
				return err
			}
			continue
		}

		consumer.processAuto(ctx, msg, handler)
	}
}

// processAuto is the legacy path: log handler errors, always commit.
func (consumer *kafkaConsumer) processAuto(ctx context.Context, msg kafkago.Message, handler MessageHandler) {
	message := toMessage(msg)
	if handlerErr := handler(ctx, message); handlerErr != nil {
		consumer.logger.Error("kafka: message handler error",
			zap.String("topic", message.Topic),
			zap.Int32("partition", message.Partition),
			zap.Int64("offset", message.Offset),
			zap.Error(handlerErr),
		)
	}
	consumer.commit(ctx, msg, message)
}

// processManual retries the handler with exponential backoff and commits only
// after success or a successful dead-letter publish. It returns only when the
// message is committed or ctx is done — a message is never silently dropped.
func (consumer *kafkaConsumer) processManual(ctx context.Context, msg kafkago.Message, handler MessageHandler) error {
	message := toMessage(msg)
	backoff := consumer.cfg.retryBackoff()
	maxBackoff := consumer.cfg.maxRetryBackoff()
	maxRetries := consumer.cfg.maxRetries()

	for attempt := 1; ; attempt++ {
		handlerErr := handler(ctx, message)
		if handlerErr == nil {
			consumer.commit(ctx, msg, message)
			return nil
		}
		if ctx.Err() != nil {
			return ctx.Err()
		}

		exhausted := maxRetries > 0 && attempt >= maxRetries
		if errors.Is(handlerErr, ErrDeadLetter) || exhausted {
			if dlqErr := consumer.publishDeadLetter(ctx, message, handlerErr, attempt); dlqErr == nil {
				consumer.commit(ctx, msg, message)
				return nil
			} else {
				consumer.logger.Error("kafka: dead-letter publish failed; will retry message",
					zap.String("topic", message.Topic), zap.Int64("offset", message.Offset), zap.Error(dlqErr))
			}
		}

		consumer.logger.Warn("kafka: handler failed, retrying",
			zap.String("topic", message.Topic),
			zap.Int32("partition", message.Partition),
			zap.Int64("offset", message.Offset),
			zap.Int("attempt", attempt),
			zap.Duration("backoff", backoff),
			zap.Error(handlerErr),
		)

		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(backoff):
		}
		if backoff *= 2; backoff > maxBackoff {
			backoff = maxBackoff
		}
	}
}

func (consumer *kafkaConsumer) publishDeadLetter(ctx context.Context, message Message, cause error, attempts int) error {
	if consumer.cfg.DeadLetterTopic == "" || consumer.deadLetter == nil {
		return errors.New("kafka: no dead_letter_topic configured")
	}
	payload, err := json.Marshal(DeadLetter{
		Topic:     message.Topic,
		Partition: message.Partition,
		Offset:    message.Offset,
		Key:       message.Key,
		Headers:   message.Headers,
		Value:     message.Value,
		Error:     cause.Error(),
		Attempts:  attempts,
		FailedAt:  time.Now().UTC(),
	})
	if err != nil {
		return fmt.Errorf("kafka: marshal dead letter: %w", err)
	}
	if err := consumer.deadLetter.Publish(ctx, consumer.cfg.DeadLetterTopic, message.Key, payload); err != nil {
		return fmt.Errorf("kafka: publish dead letter: %w", err)
	}
	consumer.logger.Warn("kafka: message dead-lettered",
		zap.String("topic", message.Topic), zap.Int64("offset", message.Offset),
		zap.String("dlq", consumer.cfg.DeadLetterTopic), zap.Int("attempts", attempts))
	return nil
}

func (consumer *kafkaConsumer) commit(ctx context.Context, msg kafkago.Message, message Message) {
	if commitErr := consumer.reader.CommitMessages(ctx, msg); commitErr != nil {
		consumer.logger.Error("kafka: commit offset error",
			zap.String("topic", message.Topic),
			zap.Int32("partition", message.Partition),
			zap.Int64("offset", message.Offset),
			zap.Error(commitErr),
		)
	}
}

func (consumer *kafkaConsumer) Close() error {
	return consumer.reader.Close()
}

func toMessage(msg kafkago.Message) Message {
	headers := make(map[string][]byte, len(msg.Headers))
	for _, header := range msg.Headers {
		headers[header.Key] = header.Value
	}
	return Message{
		Topic:     msg.Topic,
		Partition: int32(msg.Partition),
		Offset:    msg.Offset,
		Key:       msg.Key,
		Value:     msg.Value,
		Headers:   headers,
		Timestamp: msg.Time,
	}
}

func startOffsetFromConfig(initialOffset string) int64 {
	if initialOffset == "oldest" {
		return kafkago.FirstOffset
	}
	return kafkago.LastOffset
}
