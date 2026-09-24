package sample

import (
	"github.com/labstack/echo/v4"

	"github.com/bangdinh/go-kit/middleware/validation"
	"github.com/bangdinh/go-kit/server/httpx"
)

// Handler wires sample endpoints qua server/httpx.
//
// Flow chuẩn — bind + validate (JSON Schema) -> map Request Model -> Command ->
// gọi service -> render envelope (2xx) hoặc ProblemDetail (lỗi) — do httpx lo.
// Handler CHỈ khai 3 mảnh đặc thù: schema (cfg), hàm map Request->Command, service method.
// Thiếu mảnh nào -> KHÔNG build được (không thể miss bước).
//
// Endpoint đặc thù (upload/stream/webhook) cứ viết echo.HandlerFunc tường minh —
// không bắt buộc qua httpx.
type Handler struct{ svc *Service }

// NewHandler creates a new Sample HTTP handler.
func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

// Schema compile MỘT lần lúc init (cache theo sha256, không compile mỗi request).
var (
	createSampleCfg = validation.MustConfig[CreateRequest]()
	getSampleCfg    = validation.MustConfig[GetRequest]()
)

// RegisterRoutes mounts sample endpoints on the Echo router.
//
// mw (optional) applies to every route of this feature — that is how the gateway
// middleware gets wired: h.RegisterRoutes(e, gatewayMW). Middleware is taken as a
// parameter rather than mounted by the caller on a parent group because echo v4 has
// no interface shared by *echo.Echo and *echo.Group, so passing e.Group("", mw) here
// would not compile.
//
// PATH SHAPE — Kong convention, not a free choice
// (kong-plugin/docs/kong-convention.md, skill `api-standard`):
//
//	/{service}/v{major}/{urn…}/actions/{scope}[/{suffix}…]
//
//   - "cardflow-backend" is the Kong Gateway Service name and MUST stay on the path:
//     the route is declared with strip_path=false, so the service receives what
//     the client called, prefix included.
//   - "/actions/{scope}" is required on EVERY endpoint, GET included. Kong derives
//     the permission from the URL; the HTTP method plays no part.
//   - The id sits AFTER /actions/{scope} because anything past the scope is free
//     suffix that Kong ignores. It is not /type/{t}/id/{i}: that form is only for
//     resource types BRM knows (currently just "device" and "group_place"), and it
//     asks a per-resource question. Everything else is checked enterprise-wide.
//
// A path off-convention does NOT 404 — Kong's catch-all matches it and the plugin
// answers 500 ROUTE_MISCONFIGURED at request time. It ships green and breaks in
// the environment, so get it right here.
//
// TODO(you): register the urn "sample" with the BRM team before this reaches
// an environment. An unregistered urn is not a merge-time error — it surfaces as
// 403 FEATURE_DENIED on the first real request, which reads exactly like a missing
// permission.
func (h *Handler) RegisterRoutes(e *echo.Echo, mw ...echo.MiddlewareFunc) {
	g := e.Group("/cardflow-backend/v1/sample", mw...)

	// POST create -> 201 + Location + {"data": {...}}
	g.POST("/actions/create", httpx.HandleCreated(createSampleCfg,
		func(r *CreateRequest) CreateInput {
			return CreateInput{Name: r.Body.Name}
		},
		h.svc.Create,
		func(d Response) string {
			return "/cardflow-backend/v1/sample/actions/view/" + d.ID
		},
	))

	// GET by id -> 200 + {"data": {...}}
	g.GET("/actions/view/:sampleId", httpx.Handle(getSampleCfg,
		func(r *GetRequest) string { return r.Params.ID },
		h.svc.GetByID,
	))
}
