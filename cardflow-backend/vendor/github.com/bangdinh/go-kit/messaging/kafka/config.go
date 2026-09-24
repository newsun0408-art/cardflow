package kafka

import "time"

type Config struct {
	Brokers  []string       `mapstructure:"brokers"  validate:"required,min=1"`
	TLS      bool           `mapstructure:"tls"`
	SASL     SASLConfig     `mapstructure:"sasl"`
	Producer ProducerConfig `mapstructure:"producer"`
	Consumer ConsumerConfig `mapstructure:"consumer"`
}

type ProducerConfig struct {
	Acks         string        `mapstructure:"acks"`
	MaxRetries   int           `mapstructure:"max_retries"`
	RetryBackoff time.Duration `mapstructure:"retry_backoff"`
	Compression  string        `mapstructure:"compression"`
	Timeout      time.Duration `mapstructure:"timeout"`
}

type ConsumerConfig struct {
	GroupID           string        `mapstructure:"group_id"`
	Topics            []string      `mapstructure:"topics"`
	InitialOffset     string        `mapstructure:"initial_offset"`
	SessionTimeout    time.Duration `mapstructure:"session_timeout"`
	HeartbeatInterval time.Duration `mapstructure:"heartbeat_interval"`

	// AckMode selects offset-commit semantics.
	//   "auto"   (default) — commit after every handler call, even on error (legacy).
	//   "manual"           — commit only when the handler returns nil or the message
	//                        was dead-lettered; errors are retried with backoff.
	AckMode string `mapstructure:"ack_mode"`
	// RetryBackoff is the initial delay between handler retries in manual mode (default 500ms).
	RetryBackoff time.Duration `mapstructure:"retry_backoff"`
	// MaxRetryBackoff caps the exponential backoff (default 30s).
	MaxRetryBackoff time.Duration `mapstructure:"max_retry_backoff"`
	// MaxRetries is the number of handler attempts before dead-lettering in manual mode (default 5).
	// When MaxRetries is 0 or omitted, the default of 5 is used; there is no unbounded-retries
	// setting via this field. To retry indefinitely without dead-lettering, leave dead_letter_topic empty.
	// Has no effect in auto mode.
	MaxRetries int `mapstructure:"max_retries"`
	// DeadLetterTopic receives DeadLetter envelopes. Empty = never dead-letter (keep retrying).
	DeadLetterTopic string `mapstructure:"dead_letter_topic"`
}

func (c ConsumerConfig) manual() bool { return c.AckMode == "manual" }

func (c ConsumerConfig) retryBackoff() time.Duration {
	if c.RetryBackoff > 0 {
		return c.RetryBackoff
	}
	return 500 * time.Millisecond
}

func (c ConsumerConfig) maxRetryBackoff() time.Duration {
	if c.MaxRetryBackoff > 0 {
		return c.MaxRetryBackoff
	}
	return 30 * time.Second
}

func (c ConsumerConfig) maxRetries() int {
	if c.MaxRetries > 0 || c.AckMode != "manual" {
		return c.MaxRetries
	}
	return 5
}

type SASLConfig struct {
	Enabled   bool   `mapstructure:"enabled"`
	Mechanism string `mapstructure:"mechanism"`
	Username  string `mapstructure:"username"`
	Password  string `mapstructure:"password"`
}

func (c *Config) Addr() string {
	if len(c.Brokers) == 0 {
		return ""
	}
	return c.Brokers[0]
}
