package kafka

import (
	"context"
	"crypto/tls"
	"time"

	kafkago "github.com/segmentio/kafka-go"
	"github.com/segmentio/kafka-go/sasl/plain"
)

// dialKafka verifies broker reachability at startup, mirroring the fail-fast
// connect behavior of the other infra modules (postgres, redis, mysql, …).
// kafka-go's Writer/Reader dial lazily on first use, so without this check
// NewProducer/NewConsumer would report success even against unreachable brokers.
var dialKafka = func(ctx context.Context, cfg *Config) error {
	dialer := buildDialer(cfg)
	var lastErr error
	for _, broker := range cfg.Brokers {
		conn, err := dialer.DialContext(ctx, "tcp", broker)
		if err == nil {
			conn.Close()
			return nil
		}
		lastErr = err
	}
	return lastErr
}

func buildDialer(cfg *Config) *kafkago.Dialer {
	dialer := &kafkago.Dialer{
		Timeout:   10 * time.Second,
		DualStack: true,
	}
	if cfg.TLS {
		dialer.TLS = &tls.Config{}
	}
	if cfg.SASL.Enabled {
		dialer.SASLMechanism = plain.Mechanism{Username: cfg.SASL.Username, Password: cfg.SASL.Password}
	}
	return dialer
}

func buildTransport(cfg *Config) *kafkago.Transport {
	if !cfg.TLS && !cfg.SASL.Enabled {
		return nil
	}
	transport := &kafkago.Transport{}
	if cfg.TLS {
		transport.TLS = &tls.Config{}
	}
	if cfg.SASL.Enabled {
		transport.SASL = plain.Mechanism{Username: cfg.SASL.Username, Password: cfg.SASL.Password}
	}
	return transport
}
