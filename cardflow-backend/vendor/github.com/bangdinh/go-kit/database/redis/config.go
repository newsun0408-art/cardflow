package redis

import "time"

type Config struct {
	Addrs        []string      `mapstructure:"addrs" validate:"required,min=1"`
	Password     string        `mapstructure:"password"`
	DB           int           `mapstructure:"db"`
	MasterName   string        `mapstructure:"master_name"`
	PoolSize     int           `mapstructure:"pool_size"`
	MinIdleConns int           `mapstructure:"min_idle_conns"`
	DialTimeout  time.Duration `mapstructure:"dial_timeout"`
	ReadTimeout  time.Duration `mapstructure:"read_timeout"`
	WriteTimeout time.Duration `mapstructure:"write_timeout"`
	TLS          bool          `mapstructure:"tls"`
}

func (c Config) Addr() string {
	if len(c.Addrs) == 0 {
		return ""
	}
	return c.Addrs[0]
}
