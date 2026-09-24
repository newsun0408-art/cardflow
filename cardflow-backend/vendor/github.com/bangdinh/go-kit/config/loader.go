package config

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"time"

	"github.com/go-viper/mapstructure/v2"
	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)

type LoadOptions struct {
	ConfigDir string
	EnvPrefix string
}

func Load(opts LoadOptions) (*Config, error) {
	v := viper.New()

	v.SetDefault("app.env", "local")
	v.SetDefault("app.log_level", "info")
	v.SetDefault("app.log_color", false)
	v.SetDefault("api.http_addr", ":8080")
	v.SetDefault("api.grpc_addr", ":9090")
	v.SetDefault("api.grpc_reflection_enabled", false)
	v.SetDefault("api.timeout", "30s")
	v.SetDefault("api.metrics_addr", ":10254")
	v.SetDefault("api.grpc_max_concurrent_streams", 1024)
	v.SetDefault("api.grpc_tls.enabled", false)
	v.SetDefault("api.grpc_tls.require_client_cert", false)
	v.SetDefault("api.idle_timeout", "120s")
	v.SetDefault("api.http_tls.enabled", false)
	// Database defaults — use SetDefault so config file and env vars take precedence.
	// v.Set() (override priority) blocks env vars from overriding these fields; SetDefault
	// (lowest priority) ensures POSTGRES_HOST / POSTGRES_PORT / etc. all work as expected.
	v.SetDefault("postgres.host", "")
	v.SetDefault("postgres.port", 5432)
	v.SetDefault("postgres.database", "")
	v.SetDefault("postgres.user", "")
	v.SetDefault("postgres.password", "")
	v.SetDefault("postgres.ssl_mode", "disable")
	v.SetDefault("postgres.max_open_conns", 25)
	v.SetDefault("postgres.max_idle_conns", 5)
	v.SetDefault("postgres.conn_max_lifetime", "5m")
	v.SetDefault("mysql.host", "")
	v.SetDefault("mysql.port", 3306)
	v.SetDefault("mysql.database", "")
	v.SetDefault("mysql.user", "")
	v.SetDefault("mysql.password", "")
	v.SetDefault("mysql.max_open_conns", 25)
	v.SetDefault("mysql.max_idle_conns", 5)
	v.SetDefault("mysql.conn_max_lifetime", "5m")
	v.SetDefault("mysql.conn_max_idle_time", "")
	v.SetDefault("mysql.tls", false)
	v.SetDefault("mysql.connect_timeout", "")
	v.SetDefault("scylla.hosts", []string{})
	v.SetDefault("scylla.keyspace", "")
	v.SetDefault("scylla.username", "")
	v.SetDefault("scylla.password", "")
	v.SetDefault("scylla.consistency", "LOCAL_QUORUM")
	v.SetDefault("scylla.timeout", "2s")
	v.SetDefault("scylla.num_conns", 8)
	v.SetDefault("scylla.tls", false)
	v.SetDefault("scylla.tls_host_verification", true)
	v.SetDefault("opensearch.addresses", []string{})
	v.SetDefault("opensearch.index_pattern", "")
	v.SetDefault("opensearch.username", "")
	v.SetDefault("opensearch.password", "")
	v.SetDefault("opensearch.bulk_actions", 5000)
	v.SetDefault("opensearch.bulk_size_mb", 10)
	v.SetDefault("opensearch.flush_interval", "1s")
	v.SetDefault("opensearch.timeout", "5s")
	v.SetDefault("opensearch.max_conns_per_host", 100)
	v.SetDefault("mongo.host", "")
	v.SetDefault("mongo.port", 27017)
	v.SetDefault("mongo.database", "")
	v.SetDefault("mongo.user", "")
	v.SetDefault("mongo.password", "")
	v.SetDefault("mongo.auth_source", "")
	v.SetDefault("mongo.replica_set", "")
	v.SetDefault("mongo.tls", false)
	v.SetDefault("mongo.connect_timeout", "10s")
	v.SetDefault("mongo.max_pool_size", 100)
	v.SetDefault("mongo.min_pool_size", 5)
	v.SetDefault("redis.addrs", []string{})
	v.SetDefault("redis.password", "")
	v.SetDefault("redis.db", 0)
	v.SetDefault("redis.master_name", "")
	v.SetDefault("redis.pool_size", 10)
	v.SetDefault("redis.min_idle_conns", 0)
	v.SetDefault("redis.dial_timeout", "5s")
	v.SetDefault("redis.read_timeout", "3s")
	v.SetDefault("redis.write_timeout", "3s")
	v.SetDefault("redis.tls", false)
	v.SetDefault("mqtt.broker_url", "")
	v.SetDefault("mqtt.client_id", "")
	v.SetDefault("mqtt.username", "")
	v.SetDefault("mqtt.password", "")
	v.SetDefault("mqtt.qos", 0)
	v.SetDefault("mqtt.tls", false)
	v.SetDefault("mqtt.ca_cert", "")
	v.SetDefault("mqtt.client_cert", "")
	v.SetDefault("mqtt.client_key", "")
	v.SetDefault("mqtt.connect_timeout", "10s")
	v.SetDefault("mqtt.max_reconnect_interval", "2m")
	v.SetDefault("mqtt.keep_alive", "60s")
	v.SetDefault("mqtt.clean_session", true)
	v.SetDefault("postgres.connect_timeout", "10s")
	v.SetDefault("tracing.enabled", false)
	v.SetDefault("tracing.service_name", "")
	v.SetDefault("tracing.otlp_endpoint", "")
	v.SetDefault("tracing.sample_ratio", 1.0)
	v.SetDefault("kafka.brokers", []string{})
	v.SetDefault("kafka.tls", false)
	v.SetDefault("kafka.sasl.enabled", false)
	v.SetDefault("kafka.sasl.mechanism", "")
	v.SetDefault("kafka.sasl.username", "")
	v.SetDefault("kafka.sasl.password", "")
	v.SetDefault("kafka.producer.acks", "")
	v.SetDefault("kafka.producer.max_retries", 0)
	v.SetDefault("kafka.producer.retry_backoff", "")
	v.SetDefault("kafka.producer.compression", "")
	v.SetDefault("kafka.producer.timeout", "")
	v.SetDefault("kafka.consumer.group_id", "")
	v.SetDefault("kafka.consumer.topics", []string{})
	v.SetDefault("kafka.consumer.initial_offset", "")
	v.SetDefault("kafka.consumer.session_timeout", "")
	v.SetDefault("kafka.consumer.heartbeat_interval", "")
	v.SetDefault("kafka.consumer.ack_mode", "auto")
	v.SetDefault("kafka.consumer.retry_backoff", "")
	v.SetDefault("kafka.consumer.max_retry_backoff", "")
	v.SetDefault("kafka.consumer.max_retries", 0)
	v.SetDefault("kafka.consumer.dead_letter_topic", "")
	v.SetDefault("minio.endpoint", "")
	v.SetDefault("minio.access_key", "")
	v.SetDefault("minio.secret_key", "")
	v.SetDefault("minio.region", "")
	v.SetDefault("minio.use_ssl", false)
	v.SetDefault("auth.keycloak_host", "")
	v.SetDefault("auth.keycloak_internal_host", "")
	v.SetDefault("auth.keycloak_audience", []string{})
	v.SetDefault("auth.keycloak_audience_allow_all", false)
	v.SetDefault("auth.allowed_realms", []string{})
	v.SetDefault("auth.secondary_issuer", "")
	v.SetDefault("auth.secondary_audience", []string{})
	v.SetDefault("auth.blacklist_fail_open", false)
	v.SetDefault("auth.platform_admin_roles", []string{})
	v.SetDefault("auth.privileged_client_id", "")
	v.SetDefault("auth.privileged_roles", []string{})
	v.SetDefault("auth.pdp_base_url", "")
	v.SetDefault("auth.pdp_api_path", "")
	v.SetDefault("auth.verify_tenant_id_in_token", false)
	v.SetDefault("auth.auth_timeout", "")
	v.SetDefault("auth.jwks_fetch_timeout", "")

	v.SetConfigName("config")
	v.SetConfigType("json")
	v.AddConfigPath(opts.ConfigDir)

	if err := v.ReadInConfig(); err != nil {
		var configFileNotFoundError viper.ConfigFileNotFoundError
		if !errors.As(err, &configFileNotFoundError) {
			return nil, fmt.Errorf("reading config.json: %w", err)
		}
	}

	// Load .env into os.Setenv so AutomaticEnv picks them up at env priority
	// (higher than config file). godotenv.Load never overwrites vars already
	// set in the real environment, so os.environ always wins over .env.
	dotEnvPath := filepath.Join(opts.ConfigDir, ".env")
	if err := godotenv.Load(dotEnvPath); err != nil && !os.IsNotExist(err) {
		return nil, fmt.Errorf("reading .env: %w", err)
	}

	v.AutomaticEnv()
	if opts.EnvPrefix != "" {
		v.SetEnvPrefix(opts.EnvPrefix)
	}
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_", "-", "_"))

	var cfg Config
	hook := mapstructure.ComposeDecodeHookFunc(
		stringTrimHook,
		mapstructure.StringToSliceHookFunc(","),
		durationHook,
	)
	if err := v.Unmarshal(&cfg, viper.DecodeHook(hook)); err != nil {
		return nil, fmt.Errorf("unmarshaling config: %w", err)
	}

	// Viper sets defaults for database sub-keys (port, ssl_mode, etc.) which causes
	// mapstructure to decode non-nil pointers even when no actual host was configured.
	// Nil out any database whose essential discriminator field is absent so that
	// go-playground/validator only validates databases the caller has actually configured.
	nilifyUnconfiguredDatabases(&cfg)

	if err := Validate(&cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}

// nilifyUnconfiguredDatabases sets database config pointers back to nil when no
// essential connection field was provided — only the framework-set defaults exist.
func nilifyUnconfiguredDatabases(cfg *Config) {
	if cfg.Postgres != nil && cfg.Postgres.Host == "" {
		cfg.Postgres = nil
	}
	if cfg.MySQL != nil && cfg.MySQL.Host == "" {
		cfg.MySQL = nil
	}
	if cfg.Scylla != nil && len(cfg.Scylla.Hosts) == 0 {
		cfg.Scylla = nil
	}
	if cfg.OpenSearch != nil && len(cfg.OpenSearch.Addresses) == 0 {
		cfg.OpenSearch = nil
	}
	if cfg.Redis != nil && len(cfg.Redis.Addrs) == 0 {
		cfg.Redis = nil
	}
	if cfg.Mongo != nil && cfg.Mongo.Host == "" {
		cfg.Mongo = nil
	}
	if cfg.MQTT != nil && cfg.MQTT.BrokerURL == "" {
		cfg.MQTT = nil
	}
	if cfg.Kafka != nil && len(cfg.Kafka.Brokers) == 0 {
		cfg.Kafka = nil
	}
	if cfg.Minio != nil && cfg.Minio.Endpoint == "" {
		cfg.Minio = nil
	}
}

// stringTrimHook strips leading/trailing whitespace (including \r from CRLF .env files)
// from string values before any type coercion hook runs.
func stringTrimHook(from reflect.Type, _ reflect.Type, data interface{}) (interface{}, error) {
	if from.Kind() != reflect.String {
		return data, nil
	}
	return strings.TrimSpace(data.(string)), nil
}

func durationHook(from reflect.Type, to reflect.Type, data interface{}) (interface{}, error) {
	if to != reflect.TypeOf(time.Duration(0)) {
		return data, nil
	}
	switch v := data.(type) {
	case string:
		if v == "" {
			return time.Duration(0), nil
		}
		d, err := time.ParseDuration(v)
		if err != nil {
			return nil, err
		}
		return d, nil
	case time.Duration:
		return v, nil
	default:
		return data, nil
	}
}
