package postgres

import (
	"net"
	"net/url"
	"strconv"
	"time"
)

type Config struct {
	Host            string        `mapstructure:"host" validate:"required"`
	Port            int           `mapstructure:"port" validate:"required,min=1,max=65535"`
	Database        string        `mapstructure:"database" validate:"required"`
	User            string        `mapstructure:"user" validate:"required"`
	Password        string        `mapstructure:"password" validate:"required"`
	MaxOpenConns    int           `mapstructure:"max_open_conns" validate:"min=1"`
	MaxIdleConns    int           `mapstructure:"max_idle_conns"`
	ConnMaxLifetime time.Duration `mapstructure:"conn_max_lifetime"`
	SSLMode         string        `mapstructure:"ssl_mode" validate:"oneof=disable require verify-ca verify-full"`
	ConnectTimeout  time.Duration `mapstructure:"connect_timeout"`
}

func (c Config) DSN() string {
	u := &url.URL{
		Scheme:   "postgres",
		User:     url.UserPassword(c.User, c.Password),
		Host:     net.JoinHostPort(c.Host, strconv.Itoa(c.Port)),
		Path:     c.Database,
		RawQuery: "sslmode=" + c.SSLMode,
	}
	return u.String()
}

func (c Config) Addr() string {
	return c.Host + ":" + strconv.Itoa(c.Port)
}
