package kafka

import (
	"context"
	"fmt"
	"time"

	kafkago "github.com/segmentio/kafka-go"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

// Producer sends messages to Kafka topics.
type Producer interface {
	Publish(ctx context.Context, topic string, key, value []byte) error
	Close() error
}

// kafkaWriter is the subset of *kafka-go.Writer this package depends on,
// narrowed to an interface so tests can inject a fake without a live broker.
type kafkaWriter interface {
	WriteMessages(ctx context.Context, msgs ...kafkago.Message) error
	Close() error
}

type kafkaProducer struct {
	writer kafkaWriter
}

var newKafkaWriter = func(cfg *Config) kafkaWriter {
	writer := &kafkago.Writer{
		Addr:         kafkago.TCP(cfg.Brokers...),
		Balancer:     &kafkago.Hash{}, // key hashes to a partition, matching the prior sarama default
		RequiredAcks: acksFromConfig(cfg.Producer.Acks),
		Compression:  compressionFromConfig(cfg.Producer.Compression),
	}
	if cfg.Producer.MaxRetries > 0 {
		writer.MaxAttempts = cfg.Producer.MaxRetries
	}
	if cfg.Producer.RetryBackoff > 0 {
		writer.WriteBackoffMin = cfg.Producer.RetryBackoff
	}
	if cfg.Producer.Timeout > 0 {
		writer.WriteTimeout = cfg.Producer.Timeout
	}
	if transport := buildTransport(cfg); transport != nil {
		writer.Transport = transport
	}
	return writer
}

func NewProducer(lc fx.Lifecycle, cfg *Config, logger *zap.Logger) (Producer, error) {
	dialCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := dialKafka(dialCtx, cfg); err != nil {
		return nil, fmt.Errorf("kafka: create producer: %w", err)
	}

	logger.Info("kafka producer connected", zap.Strings("brokers", cfg.Brokers))

	producer := &kafkaProducer{writer: newKafkaWriter(cfg)}

	lc.Append(fx.Hook{
		OnStop: func(_ context.Context) error {
			logger.Info("closing kafka producer")
			return producer.Close()
		},
	})

	return producer, nil
}

func (producer *kafkaProducer) Publish(ctx context.Context, topic string, key, value []byte) error {
	msg := kafkago.Message{Topic: topic, Value: value}
	if len(key) > 0 {
		msg.Key = key
	}
	return producer.writer.WriteMessages(ctx, msg)
}

func (producer *kafkaProducer) Close() error {
	return producer.writer.Close()
}

func acksFromConfig(acks string) kafkago.RequiredAcks {
	switch acks {
	case "none":
		return kafkago.RequireNone
	case "leader":
		return kafkago.RequireOne
	default:
		return kafkago.RequireAll
	}
}

func compressionFromConfig(compression string) kafkago.Compression {
	switch compression {
	case "gzip":
		return kafkago.Gzip
	case "snappy":
		return kafkago.Snappy
	case "lz4":
		return kafkago.Lz4
	case "zstd":
		return kafkago.Zstd
	default:
		return 0 // compress.None — no compression
	}
}
