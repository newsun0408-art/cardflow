package config

import (
	authware "github.com/bangdinh/go-kit/middleware/auth"
	gatewayware "github.com/bangdinh/go-kit/middleware/gateway"
	"github.com/bangdinh/go-kit/observability"

	dbmongo "github.com/bangdinh/go-kit/database/mongo"
	dbmysql "github.com/bangdinh/go-kit/database/mysql"
	dbopensearch "github.com/bangdinh/go-kit/database/opensearch"
	dbpostgres "github.com/bangdinh/go-kit/database/postgres"
	dbredis "github.com/bangdinh/go-kit/database/redis"
	dbscylla "github.com/bangdinh/go-kit/database/scylladb"
	msgkafka "github.com/bangdinh/go-kit/messaging/kafka"
	msgmqtt "github.com/bangdinh/go-kit/messaging/mqtt"
	storageminio "github.com/bangdinh/go-kit/storage/minio"

	"go.uber.org/fx"
)

func ExtractProviders() fx.Option {
	return fx.Provide(
		extractPostgresConfig,
		extractMySQLConfig,
		extractScyllaConfig,
		extractOpenSearchConfig,
		extractRedisConfig,
		extractMongoConfig,
		extractMQTTConfig,
		extractKafkaConfig,
		extractMinioConfig,
		extractAuthConfig,
		extractGatewayConfig,
		extractMetricsServerConfig,
	)
}

// extractMetricsServerConfig maps the API config onto the dedicated metrics
// server (observability.MetricsServerModule): api.metrics_addr for the listen
// address, the app server's timeouts, and api.http_tls so HTTPS-scraped
// environments keep working on the dedicated port.
func extractMetricsServerConfig(cfg *Config) *observability.MetricsServerConfig {
	api := cfg.API
	return &observability.MetricsServerConfig{
		Addr:         api.MetricsAddr,
		ReadTimeout:  api.Timeout,
		WriteTimeout: api.Timeout,
		IdleTimeout:  api.IdleTimeout,
		TLSEnabled:   api.HTTPTLS.Enabled,
		TLSCertFile:  api.HTTPTLS.CertFile,
		TLSKeyFile:   api.HTTPTLS.KeyFile,
	}
}

func extractPostgresConfig(cfg *Config) *dbpostgres.Config {
	if cfg.Postgres == nil {
		return &dbpostgres.Config{}
	}
	return cfg.Postgres
}

func extractScyllaConfig(cfg *Config) *dbscylla.Config {
	if cfg.Scylla == nil {
		return &dbscylla.Config{}
	}
	return cfg.Scylla
}

func extractOpenSearchConfig(cfg *Config) *dbopensearch.Config {
	if cfg.OpenSearch == nil {
		return &dbopensearch.Config{}
	}
	return cfg.OpenSearch
}

func extractMySQLConfig(cfg *Config) *dbmysql.Config {
	if cfg.MySQL == nil {
		return &dbmysql.Config{}
	}
	return cfg.MySQL
}

func extractRedisConfig(cfg *Config) *dbredis.Config {
	if cfg.Redis == nil {
		return &dbredis.Config{}
	}
	return cfg.Redis
}

func extractMongoConfig(cfg *Config) *dbmongo.Config {
	if cfg.Mongo == nil {
		return &dbmongo.Config{}
	}
	return cfg.Mongo
}

func extractMQTTConfig(cfg *Config) *msgmqtt.Config {
	if cfg.MQTT == nil {
		return &msgmqtt.Config{}
	}
	return cfg.MQTT
}

func extractKafkaConfig(cfg *Config) *msgkafka.Config {
	if cfg.Kafka == nil {
		return &msgkafka.Config{}
	}
	return cfg.Kafka
}

func extractMinioConfig(cfg *Config) *storageminio.Config {
	if cfg.Minio == nil {
		return &storageminio.Config{}
	}
	return cfg.Minio
}

func extractAuthConfig(cfg *Config) *authware.Config {
	if cfg.Auth == nil {
		return &authware.Config{}
	}
	return cfg.Auth
}

// extractGatewayConfig returns the `gateway` block for services behind Kong.
//
// An absent block yields a zero Config, and gateway.New rejects that — a
// service that mounts the middleware without configuring a token fails at
// startup rather than serving with the gate open. Services that do not sit
// behind Kong simply never call gateway.New.
func extractGatewayConfig(cfg *Config) *gatewayware.Config {
	if cfg.Gateway == nil {
		return &gatewayware.Config{}
	}
	return cfg.Gateway
}
