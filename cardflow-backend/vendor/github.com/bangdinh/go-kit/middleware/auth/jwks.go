package auth

import (
	"context"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/sync/singleflight"
)

var errKeyNotFound = errors.New("key not found in JWKS")

type jwksCache struct {
	mu         sync.RWMutex
	entries    map[string]*jwksEntry // issuer → entry
	cfg        Config
	httpClient *http.Client
	sf         singleflight.Group
}

type jwksEntry struct {
	keys      map[string]*rsa.PublicKey // kid → public key
	fetchedAt time.Time
}

type oidcDiscovery struct {
	JWKSURI string `json:"jwks_uri"`
}

type jwkSet struct {
	Keys []jwkKey `json:"keys"`
}

type jwkKey struct {
	Kid string `json:"kid"`
	Kty string `json:"kty"`
	Use string `json:"use"`
	N   string `json:"n"`
	E   string `json:"e"`
}

func newJWKSCache(cfg Config, httpClient *http.Client) *jwksCache {
	return &jwksCache{
		entries:    make(map[string]*jwksEntry),
		cfg:        cfg,
		httpClient: httpClient,
	}
}

// GetKey returns the cached RSA public key for (issuer, kid).
// Returns errKeyNotFound if the issuer or kid is not in the cache.
func (c *jwksCache) GetKey(issuer, kid string) (*rsa.PublicKey, error) {
	c.mu.RLock()
	entry, ok := c.entries[issuer]
	c.mu.RUnlock()
	if !ok {
		return nil, errKeyNotFound
	}
	key, ok := entry.keys[kid]
	if !ok {
		return nil, errKeyNotFound
	}
	return key, nil
}

// Refresh fetches OIDC discovery for issuer, then fetches and caches the JWKS.
// Concurrent calls for the same issuer are deduplicated via singleflight to
// prevent thundering-herd storms on cache miss.
func (c *jwksCache) Refresh(ctx context.Context, issuer string) error {
	_, err, _ := c.sf.Do(issuer, func() (interface{}, error) {
		jwksURI, err := c.discoverJWKSURI(ctx, issuer)
		if err != nil {
			return nil, fmt.Errorf("OIDC discovery for %s: %w", issuer, err)
		}
		keys, err := c.fetchJWKS(ctx, jwksURI)
		if err != nil {
			return nil, fmt.Errorf("fetching JWKS from %s: %w", jwksURI, err)
		}
		c.mu.Lock()
		c.entries[issuer] = &jwksEntry{keys: keys, fetchedAt: time.Now()}
		c.mu.Unlock()
		return nil, nil
	})
	return err
}

func (c *jwksCache) discoverJWKSURI(ctx context.Context, issuer string) (string, error) {
	url := c.rewriteHost(issuer + "/.well-known/openid-configuration")
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", err
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("discovery returned HTTP %d", resp.StatusCode)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	var cfg oidcDiscovery
	if err := json.Unmarshal(body, &cfg); err != nil {
		return "", err
	}
	if cfg.JWKSURI == "" {
		return "", fmt.Errorf("jwks_uri missing from discovery response")
	}
	return c.rewriteHost(cfg.JWKSURI), nil
}

// rewriteHost replaces the external Keycloak host with the configured internal
// host for cluster-internal OIDC discovery and JWKS fetching.
func (c *jwksCache) rewriteHost(url string) string {
	if c.cfg.KeycloakInternalHost != "" && c.cfg.KeycloakHost != "" &&
		strings.Contains(url, c.cfg.KeycloakHost) {
		return strings.Replace(url, c.cfg.KeycloakHost, c.cfg.KeycloakInternalHost, 1)
	}
	return url
}

func (c *jwksCache) fetchJWKS(ctx context.Context, uri string) (map[string]*rsa.PublicKey, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, uri, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("JWKS endpoint returned HTTP %d", resp.StatusCode)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var ks jwkSet
	if err := json.Unmarshal(body, &ks); err != nil {
		return nil, err
	}
	keys := make(map[string]*rsa.PublicKey, len(ks.Keys))
	for _, k := range ks.Keys {
		if k.Use != "sig" || k.Kty != "RSA" {
			continue
		}
		pub, err := rsaPublicKeyFromJWK(k)
		if err != nil {
			continue // skip malformed keys
		}
		keys[k.Kid] = pub
	}
	return keys, nil
}

func rsaPublicKeyFromJWK(k jwkKey) (*rsa.PublicKey, error) {
	nBytes, err := base64.RawURLEncoding.DecodeString(k.N)
	if err != nil {
		return nil, fmt.Errorf("decoding RSA modulus: %w", err)
	}
	eBytes, err := base64.RawURLEncoding.DecodeString(k.E)
	if err != nil {
		return nil, fmt.Errorf("decoding RSA exponent: %w", err)
	}
	return &rsa.PublicKey{
		N: new(big.Int).SetBytes(nBytes),
		E: int(new(big.Int).SetBytes(eBytes).Int64()),
	}, nil
}
