package mongo

import (
	"net"
	"net/url"
	"strconv"
	"time"
)

type Config struct {
	Host           string        `mapstructure:"host"            validate:"required"`
	Port           int           `mapstructure:"port"            validate:"required,min=1,max=65535"`
	User           string        `mapstructure:"user"            validate:"required"`
	Password       string        `mapstructure:"password"        validate:"required"`
	Database       string        `mapstructure:"database"        validate:"required"`
	AuthSource     string        `mapstructure:"auth_source"`
	ReplicaSet     string        `mapstructure:"replica_set"`
	TLS            bool          `mapstructure:"tls"`
	ConnectTimeout time.Duration `mapstructure:"connect_timeout"`
	MaxPoolSize    uint64        `mapstructure:"max_pool_size"`
	MinPoolSize    uint64        `mapstructure:"min_pool_size"`
}

func (c Config) URI() string {
	u := &url.URL{
		Scheme: "mongodb",
		User:   url.UserPassword(c.User, c.Password),
		Host:   net.JoinHostPort(c.Host, strconv.Itoa(c.Port)),
		Path:   "/" + c.Database,
	}
	q := url.Values{}
	if c.AuthSource != "" {
		q.Set("authSource", c.AuthSource)
	}
	if c.ReplicaSet != "" {
		q.Set("replicaSet", c.ReplicaSet)
	}
	if c.TLS {
		q.Set("tls", "true")
	}
	if len(q) > 0 {
		u.RawQuery = q.Encode()
	}
	return u.String()
}

func (c Config) Addr() string {
	return net.JoinHostPort(c.Host, strconv.Itoa(c.Port))
}
