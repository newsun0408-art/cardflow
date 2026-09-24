package gateway

import "github.com/labstack/echo/v4"

// contextKeyIdentity is unexported: Identity may only be written by this
// package's middleware, after the gateway token checked out. An exported key
// would let any code fabricate one.
const contextKeyIdentity = "gateway.identity"

// Identity is who Kong says the caller is. Present only on requests that passed
// the gateway token check.
type Identity struct {
	// UserID is the caller's Keycloak `sub` — an opaque per-realm id, usually a
	// UUID but never validated as one (the plugin only checks it is a string,
	// handler.lua:293; its own fixtures use "u1").
	//
	// It is NOT a username, an email, or BRM's own user id. Use it for the audit
	// trail. Do NOT branch business logic on it: Kong already made the
	// permission decision, and a second check here is an authorization layer
	// nobody reviews.
	UserID string

	// TenantID is the caller's `company_code` (e.g. "fli") — the IAM realm name,
	// NOT a UUID. It is the only enterprise identifier a service receives, and
	// it is enough: company_code is unique on BRM's Company, so realm and
	// company are 1:1.
	//
	// Beware when moving a service off JWT: auth.TenantAccess.TenantID is a
	// UUID (middleware/auth/claims.go:37). Rows written under one scheme and
	// then the other end up under two key spaces with no error anywhere — every
	// unique index leading with tenant simply stops catching duplicates.
	TenantID string
}

// GetIdentity returns the verified identity. ok is false on any route where the
// middleware did not run.
func GetIdentity(c echo.Context) (Identity, bool) {
	id, ok := c.Get(contextKeyIdentity).(Identity)
	return id, ok
}

// UserID returns the caller's Keycloak id, or "" if the middleware did not run.
//
// Signature matches audit.UserIDExtractor, so it wires straight in:
//
//	audit.New(audit.WithUserIDExtractor(gateway.UserID))
func UserID(c echo.Context) string {
	id, _ := GetIdentity(c)
	return id.UserID
}

// TenantID returns the caller's company_code, or "" if the middleware did not run.
func TenantID(c echo.Context) string {
	id, _ := GetIdentity(c)
	return id.TenantID
}

// Scope is the caller-scope for idempotency keys:
//
//	idempotency.Config{ScopeFn: gateway.Scope}
//
// Binding the key to user+tenant is what stops one caller replaying another's
// cached response by reusing a key. Returning "" for
// a request that never passed the gate is correct — there is no caller to bind
// to, and such a request should not have reached a handler anyway.
func Scope(c echo.Context) string {
	id, ok := GetIdentity(c)
	if !ok {
		return ""
	}
	return id.TenantID + "|" + id.UserID
}
