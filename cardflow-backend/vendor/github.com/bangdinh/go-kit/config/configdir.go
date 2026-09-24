package config

import "os"

// DefaultConfigDirEnv is the environment variable the deploy platform uses to
// relocate the runtime config directory without rebuilding the image.
const DefaultConfigDirEnv = "APPLICATION_CONFIG_DIR"

// DefaultConfigDir resolves the runtime config directory per the platform
// convention: the APPLICATION_CONFIG_DIR env var wins; otherwise the standard
// "application-config" (relative to the working directory — /opt/app in
// containers, where Kubernetes mounts the production config repo over it).
//
// Entrypoints should pass this to Load instead of hardcoding the path:
//
//	cfg, err := config.Load(config.LoadOptions{ConfigDir: config.DefaultConfigDir()})
func DefaultConfigDir() string {
	if dir := os.Getenv(DefaultConfigDirEnv); dir != "" {
		return dir
	}
	return "application-config"
}
