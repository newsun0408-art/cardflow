package mysql

import (
	"net"
	"strconv"
	"time"

	drvmysql "github.com/go-sql-driver/mysql"
)

type Config struct {
	Host            string        `mapstructure:"host"               validate:"required"`
	Port            int           `mapstructure:"port"               validate:"required,min=1,max=65535"`
	Database        string        `mapstructure:"database"           validate:"required"`
	User            string        `mapstructure:"user"               validate:"required"`
	Password        string        `mapstructure:"password"           validate:"required"`
	MaxOpenConns    int           `mapstructure:"max_open_conns"`
	MaxIdleConns    int           `mapstructure:"max_idle_conns"`
	ConnMaxLifetime time.Duration `mapstructure:"conn_max_lifetime"`
	ConnMaxIdleTime time.Duration `mapstructure:"conn_max_idle_time"`
	TLS             bool          `mapstructure:"tls"`
	ConnectTimeout  time.Duration `mapstructure:"connect_timeout"`
}

func (c Config) DSN() string {
	mc := drvmysql.Config{
		User:      c.User,
		Passwd:    c.Password,
		Net:       "tcp",
		Addr:      net.JoinHostPort(c.Host, strconv.Itoa(c.Port)),
		DBName:    c.Database,
		ParseTime: true,
		Params:    map[string]string{"loc": "UTC"},
	}
	if c.TLS {
		mc.TLSConfig = "custom"
	}
	if c.ConnectTimeout > 0 {
		mc.Timeout = c.ConnectTimeout
	}
	return mc.FormatDSN()
}

func (c Config) Addr() string {
	return net.JoinHostPort(c.Host, strconv.Itoa(c.Port))
}
