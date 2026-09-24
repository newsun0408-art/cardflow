package header

import (
	"context"

	"github.com/labstack/echo/v4"
	"google.golang.org/grpc/metadata"
)

// Standard header name constants for distributed tracing & multi-tenancy.
const (
	HeaderRequestID     = "X-Request-Id"
	HeaderCorrelationID = "X-Correlation-Id"
	HeaderTenantID      = "X-Tenant-Id"
	HeaderUserID        = "X-User-Id"
	HeaderUserRoles     = "X-User-Roles"
)

type metadataKey struct{}

// ContextMetadata holds distributed metadata propagated across microservices.
type ContextMetadata struct {
	RequestID     string
	CorrelationID string
	TenantID      string
	UserID        string
	UserRoles     string
}

// WithMetadata injects ContextMetadata into a context.Context.
func WithMetadata(ctx context.Context, md ContextMetadata) context.Context {
	return context.WithValue(ctx, metadataKey{}, md)
}

// FromContext extracts ContextMetadata from a context.Context.
func FromContext(ctx context.Context) (ContextMetadata, bool) {
	md, ok := ctx.Value(metadataKey{}).(ContextMetadata)
	return md, ok
}

// GetTenantID extracts TenantID from context.
func GetTenantID(ctx context.Context) string {
	if md, ok := FromContext(ctx); ok {
		return md.TenantID
	}
	return ""
}

// GetUserID extracts UserID from context.
func GetUserID(ctx context.Context) string {
	if md, ok := FromContext(ctx); ok {
		return md.UserID
	}
	return ""
}

// GetCorrelationID extracts CorrelationID or RequestID from context.
func GetCorrelationID(ctx context.Context) string {
	if md, ok := FromContext(ctx); ok {
		if md.CorrelationID != "" {
			return md.CorrelationID
		}
		return md.RequestID
	}
	return ""
}

// Config tunes MetadataMiddleware.
type Config struct {
	// TrustInboundIdentity controls whether the client-supplied identity headers
	// X-Tenant-Id / X-User-Id / X-User-Roles are read into context.
	//
	// Default false — these headers are IGNORED. A client can set any value
	// (e.g. X-User-Roles: admin), so trusting them at the edge is identity/role
	// spoofing. Populate identity from VERIFIED JWT claims via SetIdentity instead.
	//
	// Enable ONLY when this service sits behind a trusted gateway/mesh that
	// authenticates the caller, sets these headers itself, and strips any
	// client-supplied copies before forwarding.
	TrustInboundIdentity bool
}

// Option configures MetadataMiddleware.
type Option func(*Config)

// WithTrustInboundIdentity enables reading identity headers from the inbound
// request. Only safe behind a trusted, header-sanitising gateway (see Config).
func WithTrustInboundIdentity(v bool) Option {
	return func(c *Config) { c.TrustInboundIdentity = v }
}

// SetIdentity returns a context whose propagated metadata carries the given
// VERIFIED identity. Call it from auth middleware using crypto-verified claims;
// it overrides anything an untrusted client may have sent.
func SetIdentity(ctx context.Context, tenantID, userID, userRoles string) context.Context {
	md, _ := FromContext(ctx)
	md.TenantID = tenantID
	md.UserID = userID
	md.UserRoles = userRoles
	return WithMetadata(ctx, md)
}

// MetadataMiddleware extracts standard distributed headers into Go's context.Context.
//
// RequestID/CorrelationID (non-sensitive tracing) are always read. Identity
// headers (tenant/user/roles) are read ONLY when WithTrustInboundIdentity(true)
// is passed — by default they are dropped to prevent client-side spoofing.
func MetadataMiddleware(opts ...Option) echo.MiddlewareFunc {
	var cfg Config
	for _, o := range opts {
		o(&cfg)
	}
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			req := c.Request()
			reqID := req.Header.Get(HeaderRequestID)
			if reqID == "" {
				reqID = c.Response().Header().Get(echo.HeaderXRequestID)
			}

			corrID := req.Header.Get(HeaderCorrelationID)
			if corrID == "" {
				corrID = reqID
			}

			md := ContextMetadata{
				RequestID:     reqID,
				CorrelationID: corrID,
			}
			if cfg.TrustInboundIdentity {
				md.TenantID = req.Header.Get(HeaderTenantID)
				md.UserID = req.Header.Get(HeaderUserID)
				md.UserRoles = req.Header.Get(HeaderUserRoles)
			}

			ctx := WithMetadata(req.Context(), md)
			c.SetRequest(req.WithContext(ctx))

			return next(c)
		}
	}
}

// InjectOutgoingGRPCMetadata adds ContextMetadata into outgoing gRPC metadata.
func InjectOutgoingGRPCMetadata(ctx context.Context) context.Context {
	md, ok := FromContext(ctx)
	if !ok {
		return ctx
	}

	pairs := make([]string, 0, 10)
	if md.RequestID != "" {
		pairs = append(pairs, "x-request-id", md.RequestID)
	}
	if md.CorrelationID != "" {
		pairs = append(pairs, "x-correlation-id", md.CorrelationID)
	}
	if md.TenantID != "" {
		pairs = append(pairs, "x-tenant-id", md.TenantID)
	}
	if md.UserID != "" {
		pairs = append(pairs, "x-user-id", md.UserID)
	}
	if md.UserRoles != "" {
		pairs = append(pairs, "x-user-roles", md.UserRoles)
	}

	if len(pairs) == 0 {
		return ctx
	}

	return metadata.AppendToOutgoingContext(ctx, pairs...)
}
