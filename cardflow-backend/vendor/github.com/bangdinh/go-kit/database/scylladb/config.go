package scylladb

import (
	"github.com/bangdinh/go-kit/util"
	"strconv"
	"time"
)

type Config struct {
	Hosts               []string      `mapstructure:"hosts" validate:"required,min=1"`
	Keyspace            string        `mapstructure:"keyspace" validate:"required"`
	Username            string        `mapstructure:"username"`
	Password            string        `mapstructure:"password"`
	Consistency         string        `mapstructure:"consistency" validate:"required,oneof=ANY ONE TWO THREE QUORUM ALL LOCAL_QUORUM EACH_QUORUM SERIAL LOCAL_SERIAL LOCAL_ONE"`
	Timeout             time.Duration `mapstructure:"timeout" validate:"required"`
	NumConns            int           `mapstructure:"num_conns" validate:"min=1"`
	TLS                 bool          `mapstructure:"tls"`
	TLSHostVerification bool          `mapstructure:"tls_host_verification"`
}

func (c Config) FirstAddr() string {
	return util.FirstAddr(c.Hosts)
}

func (c Config) Addrs() string {
	return util.JoinAddrs(c.Hosts)
}

func (c Config) Port() int {
	if len(c.Hosts) == 0 {
		return 0
	}
	host := c.Hosts[0]
	for i := len(host) - 1; i >= 0; i-- {
		if host[i] == ':' {
			port, _ := strconv.Atoi(host[i+1:])
			return port
		}
	}
	return 9042
}
