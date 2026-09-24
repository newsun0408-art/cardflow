package echo

import (
	"strconv"
	"time"
)

type Config struct {
	Host         string        `mapstructure:"host" validate:"required"`
	Port         int           `mapstructure:"port" validate:"required,min=1,max=65535"`
	ReadTimeout  time.Duration `mapstructure:"read_timeout"`
	WriteTimeout time.Duration `mapstructure:"write_timeout"`
	IdleTimeout  time.Duration `mapstructure:"idle_timeout"`
	TLS          TLSConfig     `mapstructure:"tls"`
	CORS         CORSConfig    `mapstructure:"cors"`
	Swagger      SwaggerConfig `mapstructure:"swagger"`
	// MetricsAddr is the dedicated listen address for the Prometheus
	// /metrics endpoint (platform standard :10254). When set, /metrics is
	// served by a separate HTTP server on this address and NOT mounted on
	// the app server. Empty = legacy behavior (metrics on the app server).
	MetricsAddr string `mapstructure:"metrics_addr"`
}

type SwaggerConfig struct {
	Enabled  bool   `mapstructure:"enabled"`
	BasePath string `mapstructure:"base_path"`
	Title    string `mapstructure:"title"`
}

type TLSConfig struct {
	Enabled  bool   `mapstructure:"enabled"`
	CertFile string `mapstructure:"cert_file"`
	KeyFile  string `mapstructure:"key_file"`
}

type CORSConfig struct {
	AllowOrigins     []string `mapstructure:"allow_origins"`
	AllowMethods     []string `mapstructure:"allow_methods"`
	AllowHeaders     []string `mapstructure:"allow_headers"`
	AllowCredentials bool     `mapstructure:"allow_credentials"`
	MaxAge           int      `mapstructure:"max_age"`
}

func (c Config) Addr() string {
	return c.Host + ":" + strconv.Itoa(c.Port)
}
