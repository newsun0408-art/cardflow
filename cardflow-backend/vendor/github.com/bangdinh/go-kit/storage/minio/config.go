package minio

// Config holds connection parameters for an S3-compatible endpoint.
// Endpoint must be a bare host or host:port — no http:// or https:// prefix.
// UseSSL controls whether HTTPS is used (derived from the service's protocol field).
type Config struct {
	Endpoint  string `mapstructure:"endpoint"   validate:"required"`
	AccessKey string `mapstructure:"access_key" validate:"required"`
	SecretKey string `mapstructure:"secret_key" validate:"required"`
	Region    string `mapstructure:"region"`
	UseSSL    bool   `mapstructure:"use_ssl"`
}
