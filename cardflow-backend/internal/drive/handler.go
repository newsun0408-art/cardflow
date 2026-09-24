package drive

import (
	"net/http"

	"github.com/bangdinh/go-kit/response"
	"github.com/labstack/echo/v4"
)

// Handler exposes the Google Drive integration endpoints.
type Handler struct {
	svc *Service
}

// NewHandler creates a new drive HTTP handler.
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// RegisterRoutes mounts drive routes on the Echo router.
func (h *Handler) RegisterRoutes(e *echo.Echo, mw ...echo.MiddlewareFunc) {
	g := e.Group("/cardflow-backend/v1/drive", mw...)
	g.GET("/actions/connect", h.Connect)
	g.GET("/actions/callback", h.Callback)
	g.GET("/actions/files", h.ListFiles)
	g.POST("/actions/upload", h.Upload)
	g.GET("/actions/sync", h.Sync)
	g.POST("/actions/sync", h.Sync)
	g.GET("/actions/imported", h.GetImported)
}

// Connect returns a Google OAuth URL for the user to authorize Drive access.
func (h *Handler) Connect(c echo.Context) error {
	res, err := h.svc.Connect(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, response.NewData(res))
}

// Callback exchanges the Google consent code for an OAuth token.
func (h *Handler) Callback(c echo.Context) error {
	code := c.QueryParam("code")
	state := c.QueryParam("state")
	res, err := h.svc.Callback(c.Request().Context(), code, state)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, response.NewData(res))
}

// ListFiles lists the files available in the connected Drive account.
func (h *Handler) ListFiles(c echo.Context) error {
	state := c.QueryParam("state")
	if state == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "state is required"})
	}
	files, err := h.svc.ListFiles(c.Request().Context(), state)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, response.NewData(files))
}

// Upload uploads a file directly into the "CardFlow" folder on Google Drive.
func (h *Handler) Upload(c echo.Context) error {
	var req UploadRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	if req.State == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "state is required"})
	}

	file, err := h.svc.UploadFile(c.Request().Context(), req)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, response.NewData(file))
}

// Sync scans the "CardFlow" folder and imports/updates the list of Excel and Sheet files.
func (h *Handler) Sync(c echo.Context) error {
	state := c.QueryParam("state")
	if state == "" {
		var body struct {
			State string `json:"state"`
		}
		if err := c.Bind(&body); err == nil && body.State != "" {
			state = body.State
		}
	}
	if state == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "state is required"})
	}

	res, err := h.svc.SyncCardFlowFiles(c.Request().Context(), state)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, response.NewData(res))
}

// GetImported returns all Excel and Sheet files imported from the "CardFlow" folder for the state.
func (h *Handler) GetImported(c echo.Context) error {
	state := c.QueryParam("state")
	if state == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "state is required"})
	}

	files, err := h.svc.GetImportedFiles(c.Request().Context(), state)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, response.NewData(files))
}

