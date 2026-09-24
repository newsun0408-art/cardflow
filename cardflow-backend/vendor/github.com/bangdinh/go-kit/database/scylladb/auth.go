package scylladb

import "github.com/gocql/gocql"

// buildAuthenticator returns a gocql.PasswordAuthenticator when cfg.Username is set,
// or nil when the cluster does not require authentication (the default).
func buildAuthenticator(cfg *Config) gocql.Authenticator {
	if cfg.Username == "" {
		return nil
	}
	return gocql.PasswordAuthenticator{
		Username: cfg.Username,
		Password: cfg.Password,
	}
}
