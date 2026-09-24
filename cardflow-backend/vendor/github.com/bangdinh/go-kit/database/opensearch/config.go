package opensearch

import (
	"github.com/bangdinh/go-kit/util"
	"time"
)

type Config struct {
	Addresses       []string      `mapstructure:"addresses" validate:"required,min=1"`
	IndexPattern    string        `mapstructure:"index_pattern" validate:"required"`
	BulkActions     int           `mapstructure:"bulk_actions" validate:"min=1"`
	BulkSizeMB      int           `mapstructure:"bulk_size_mb" validate:"min=1"`
	FlushInterval   time.Duration `mapstructure:"flush_interval" validate:"required"`
	Timeout         time.Duration `mapstructure:"timeout" validate:"required"`
	MaxConnsPerHost int           `mapstructure:"max_conns_per_host" validate:"min=1"`
	Username        string        `mapstructure:"username"`
	Password        string        `mapstructure:"password"`
}

func (c Config) FirstAddr() string {
	return util.FirstAddr(c.Addresses)
}

func (c Config) Addrs() string {
	return util.JoinAddrs(c.Addresses)
}
