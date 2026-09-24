package config

import (
	"time"

	authware "github.com/bangdinh/go-kit/middleware/auth"
	gatewayware "github.com/bangdinh/go-kit/middleware/gateway"

	dbmongo "github.com/bangdinh/go-kit/database/mongo"
	dbmysql "github.com/bangdinh/go-kit/database/mysql"
	dbopensearch "github.com/bangdinh/go-kit/database/opensearch"
	dbpostgres "github.com/bangdinh/go-kit/database/postgres"
	dbredis "github.com/bangdinh/go-kit/database/redis"
	dbscylla "github.com/bangdinh/go-kit/database/scylladb"
	msgkafka "github.com/bangdinh/go-kit/messaging/kafka"
	msgmqtt "github.com/bangdinh/go-kit/messaging/mqtt"
	storageminio "github.com/bangdinh/go-kit/storage/minio"
)

type Config struct {
	App         AppConfig                      `mapstructure:"app" validate:"required"`
	API         APIConfig                      `mapstructure:"api" validate:"required"`
	Tracing     TracingConfig                  `mapstructure:"tracing"`
	Postgres    *dbpostgres.Config             `mapstructure:"postgres"`
	MySQL       *dbmysql.Config                `mapstructure:"mysql"`
	Scylla      *dbscylla.Config               `mapstructure:"scylla"`
	OpenSearch  *dbopensearch.Config           `mapstructure:"opensearch"`
	Redis       *dbredis.Config                `mapstructure:"redis"`
	Mongo       *dbmongo.Config                `mapstructure:"mongo"`
	MQTT        *msgmqtt.Config                `mapstructure:"mqtt"`
	Kafka       *msgkafka.Config               `mapstructure:"kafka"`
	Minio       *storageminio.Config           `mapstructure:"minio"`
	Auth        *authware.Config               `mapstructure:"auth"`
	// Gateway: service dung sau Kong (`brm-authz`), noi Authorization bi xoa va
	// danh tinh den bang header. De nil cho service tu verify JWT — hai cai la
	// LUA CHON THAY THE nhau, khong phai hai lop. Xem docs/gateway-contract.md.
	Gateway     *gatewayware.Config            `mapstructure:"gateway"`
	GRPCClients map[string]GRPCClientConfig    `mapstructure:"grpc_clients"`
	HTTPClients map[string]HTTPClientConfig    `mapstructure:"http_clients"`
}

type TracingConfig struct {
	Enabled      bool    `mapstructure:"enabled"`
	ServiceName  string  `mapstructure:"service_name"`
	OTLPEndpoint string  `mapstructure:"otlp_endpoint"`
	SampleRatio  float64 `mapstructure:"sample_ratio"`
}

type AppConfig struct {
	// Tên môi trường. Danh sách bám theo tên thư mục môi trường mà hạ tầng đang
	// dùng thật (enviroments/fcam-b2b-production/{uat,production}) — "uat" và
	// "production" là tên chính thức. "staging"/"prod" giữ lại cho service cũ
	// đã cấu hình theo tên đó. Chỉ log format và nhãn env/deployment.environment
	// của trace phụ thuộc giá trị này; không có logic nghiệp vụ nào rẽ theo nó.
	Env      string `mapstructure:"env" validate:"required,oneof=local dev uat staging prod production"`
	LogLevel string `mapstructure:"log_level" validate:"required,oneof=debug info warn error"`
	LogColor bool   `mapstructure:"log_color"`
}

type APIConfig struct {
	HTTPAddr                 string        `mapstructure:"http_addr" validate:"required"`
	GRPCAddr                 string        `mapstructure:"grpc_addr" validate:"required"`
	GRPCReflectionEnabled    bool          `mapstructure:"grpc_reflection_enabled"`
	HTTPTLS                  TLSConfig     `mapstructure:"http_tls"`
	GRPCTLS                  TLSConfig     `mapstructure:"grpc_tls"`
	Timeout                  time.Duration `mapstructure:"timeout" validate:"required"`
	IdleTimeout              time.Duration `mapstructure:"idle_timeout"`
	MetricsAddr              string        `mapstructure:"metrics_addr"`
	GRPCMaxConcurrentStreams int           `mapstructure:"grpc_max_concurrent_streams" validate:"min=1"`
	Swagger                  SwaggerConfig `mapstructure:"swagger"`
}

type SwaggerConfig struct {
	Enabled  bool   `mapstructure:"enabled"`
	BasePath string `mapstructure:"base_path"`
	Title    string `mapstructure:"title"`
}

type TLSConfig struct {
	Enabled            bool   `mapstructure:"enabled"`
	CertFile           string `mapstructure:"cert_file"`
	KeyFile            string `mapstructure:"key_file"`
	ClientCAFile       string `mapstructure:"client_ca_file"`
	RequireClientCert  bool   `mapstructure:"require_client_cert"`
	ServerName         string `mapstructure:"server_name"`
	InsecureSkipVerify bool   `mapstructure:"insecure_skip_verify"`
}

type GRPCClientConfig struct {
	Addresses            []string              `mapstructure:"addresses"`
	PoolSize             int                   `mapstructure:"pool_size"`
	MaxConcurrentStreams int                   `mapstructure:"max_concurrent_streams"`
	MaxInFlight          int                   `mapstructure:"max_in_flight"`
	ConnectTimeout       time.Duration         `mapstructure:"connect_timeout"`
	RequestTimeout       time.Duration         `mapstructure:"request_timeout"`
	TLS                  TLSConfig             `mapstructure:"tls"`
	Retry                GRPCRetryConfig       `mapstructure:"retry"`
	CircuitBreaker       CircuitBreakerConfig  `mapstructure:"circuit_breaker"`
	LoadBalancing        string                `mapstructure:"load_balancing"`
}

type GRPCRetryConfig struct {
	MaxAttempts int           `mapstructure:"max_attempts"`
	Backoff     time.Duration `mapstructure:"backoff"`
	MaxBackoff  time.Duration `mapstructure:"max_backoff"`
	Jitter      float64       `mapstructure:"jitter"`
}

type CircuitBreakerConfig struct {
	Enabled          bool          `mapstructure:"enabled"`
	FailureThreshold int           `mapstructure:"failure_threshold"`
	SuccessThreshold int           `mapstructure:"success_threshold"`
	OpenTimeout      time.Duration `mapstructure:"open_timeout"`
	HalfOpenMaxReqs  int           `mapstructure:"half_open_max_reqs"`
}

type HTTPClientConfig struct {
	// BaseURL is the scheme+host (and optional path prefix) for the downstream service
	// (e.g. "http://user-service:8080"). Callers append the path suffix when building URLs.
	BaseURL             string        `mapstructure:"base_url"`
	MaxIdleConns        int           `mapstructure:"max_idle_conns"`
	MaxIdleConnsPerHost int           `mapstructure:"max_idle_conns_per_host"`
	MaxConnsPerHost     int           `mapstructure:"max_conns_per_host"`
	IdleConnTimeout     time.Duration `mapstructure:"idle_conn_timeout"`
	RequestTimeout      time.Duration `mapstructure:"request_timeout"`
	TLSHandshakeTimeout time.Duration `mapstructure:"tls_handshake_timeout"`
	TLS                 TLSConfig            `mapstructure:"tls"`
	Retry               HTTPRetryConfig      `mapstructure:"retry"`
	CircuitBreaker      CircuitBreakerConfig `mapstructure:"circuit_breaker"`
}

type HTTPRetryConfig struct {
	MaxAttempts int           `mapstructure:"max_attempts"`
	Backoff     time.Duration `mapstructure:"backoff"`
	MaxBackoff  time.Duration `mapstructure:"max_backoff"`
	Jitter      float64       `mapstructure:"jitter"`
}
