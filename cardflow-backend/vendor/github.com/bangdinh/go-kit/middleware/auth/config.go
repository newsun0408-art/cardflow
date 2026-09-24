package auth

import "time"

// Config holds all configuration for the JWT and PDP middleware.
type Config struct {
	// Platform Keycloak (secondary OIDC issuer).
	KeycloakHost             string   `mapstructure:"keycloak_host"`
	KeycloakInternalHost     string   `mapstructure:"keycloak_internal_host"` // optional internal host rewrite for cluster-internal access
	KeycloakAudience         []string `mapstructure:"keycloak_audience"`
	KeycloakAudienceAllowAll bool     `mapstructure:"keycloak_audience_allow_all"`
	// AllowedRealms restricts token acceptance to realms whose name appears in
	// this list. When empty all realms under KeycloakHost are accepted.
	AllowedRealms []string `mapstructure:"allowed_realms"`

	SecondaryIssuer   string   `mapstructure:"secondary_issuer"`
	SecondaryAudience []string `mapstructure:"secondary_audience"`

	BlacklistFailOpen bool `mapstructure:"blacklist_fail_open"`

	PlatformAdminRoles []string `mapstructure:"platform_admin_roles"`
	PrivilegedClientID string   `mapstructure:"privileged_client_id"`
	PrivilegedRoles    []string `mapstructure:"privileged_roles"`

	PDPBaseURL string `mapstructure:"pdp_base_url"`
	PDPAPIPath string `mapstructure:"pdp_api_path"`

	VerifyTenantIDInToken bool `mapstructure:"verify_tenant_id_in_token"`

	AuthTimeout      time.Duration `mapstructure:"auth_timeout"`
	JWKSFetchTimeout time.Duration `mapstructure:"jwks_fetch_timeout"`
}

func (c *Config) pdpPath() string {
	if c.PDPAPIPath == "" {
		return "/pdp/api/v1/authorize"
	}
	return c.PDPAPIPath
}

func (c *Config) authTimeout() time.Duration {
	if c.AuthTimeout == 0 {
		return 3 * time.Second
	}
	return c.AuthTimeout
}

func (c *Config) jwksFetchTimeout() time.Duration {
	if c.JWKSFetchTimeout == 0 {
		return 10 * time.Second
	}
	return c.JWKSFetchTimeout
}
