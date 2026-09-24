package auth

import (
	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

// Context key constants — match the Java SDK RoutingContext key names for compatibility.
const (
	ContextKeyIssuer       = "auth.issuer"
	ContextKeyRealm        = "auth.realm"
	ContextKeyClaims       = "auth.claims"
	ContextKeyTenantAccess = "auth.tenant.access"
)

type Claims struct {
	jwt.RegisteredClaims
	AZP            string                    `json:"azp"`
	SID            string                    `json:"sid"`
	RealmAccess    RealmAccess               `json:"realm_access"`
	ResourceAccess map[string]ResourceAccess `json:"resource_access"`
	TenantAccess   *TenantAccess             `json:"tenant_access"`
	ExternalDevice bool                      `json:"external_device_check"`
	Permissions    []string                  `json:"permissions"`
}

type RealmAccess struct {
	Roles []string `json:"roles"`
}

type ResourceAccess struct {
	Roles []string `json:"roles"`
}

// TenantAccess is the parsed tenant_access JWT claim.
// Field names match the actual Keycloak token payload (snake_case).
// Real example: {"tenant_id":"1fc6f6cb-...","tenant_name":"ral","subjects":{"ROLE":{}}}
type TenantAccess struct {
	TenantID   string                 `json:"tenant_id"`
	TenantName string                 `json:"tenant_name"`
	Subjects   map[string]interface{} `json:"subjects"`
}

func GetClaims(c echo.Context) *Claims {
	v := c.Get(ContextKeyClaims)
	if v == nil {
		return nil
	}
	claims, _ := v.(*Claims)
	return claims
}

func GetIssuer(c echo.Context) string {
	v := c.Get(ContextKeyIssuer)
	if v == nil {
		return ""
	}
	s, _ := v.(string)
	return s
}

func GetRealm(c echo.Context) string {
	v := c.Get(ContextKeyRealm)
	if v == nil {
		return ""
	}
	s, _ := v.(string)
	return s
}

func GetTenantAccess(c echo.Context) *TenantAccess {
	v := c.Get(ContextKeyTenantAccess)
	if v == nil {
		return nil
	}
	ta, _ := v.(*TenantAccess)
	return ta
}
