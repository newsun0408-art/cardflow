package mqtt

import (
	"strings"
	"time"
)

type Config struct {
	BrokerURL            string        `mapstructure:"broker_url"             validate:"required"`
	ClientID             string        `mapstructure:"client_id"              validate:"required"`
	Username             string        `mapstructure:"username"`
	Password             string        `mapstructure:"password"`
	CleanSession         bool          `mapstructure:"clean_session"`
	QoS                  byte          `mapstructure:"qos"                    validate:"max=2"`
	KeepAlive            time.Duration `mapstructure:"keep_alive"`
	ConnectTimeout       time.Duration `mapstructure:"connect_timeout"`
	MaxReconnectInterval time.Duration `mapstructure:"max_reconnect_interval"`
	TLS                  bool          `mapstructure:"tls"`
	CACert               string        `mapstructure:"ca_cert"`
	ClientCert           string        `mapstructure:"client_cert"`
	ClientKey            string        `mapstructure:"client_key"`
}

// Addr strips the scheme (e.g. "tcp://") from BrokerURL for use in log messages.
func (c Config) Addr() string {
	if i := strings.Index(c.BrokerURL, "://"); i >= 0 {
		return c.BrokerURL[i+3:]
	}
	return c.BrokerURL
}
