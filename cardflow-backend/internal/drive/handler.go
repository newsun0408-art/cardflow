package drive

import (
	"fmt"
	"net/http"
	"strings"

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
	g.GET("/actions/status", h.Status)
	g.GET("/actions/files", h.ListFiles)
	g.POST("/actions/upload", h.Upload)
	g.GET("/actions/sync", h.Sync)
	g.POST("/actions/sync", h.Sync)
	g.GET("/actions/imported", h.GetImported)
	g.POST("/actions/delete", h.DeleteFile)
}

// Status checks if Google Drive is connected.
func (h *Handler) Status(c echo.Context) error {
	tok, state, ok := h.svc.repo.GetLatestToken(c.Request().Context())
	if !ok || tok == nil {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"data": map[string]interface{}{
				"connected": false,
			},
		})
	}
	folderID, _ := h.svc.repo.GetFolderID(c.Request().Context(), state)
	return c.JSON(http.StatusOK, map[string]interface{}{
		"data": map[string]interface{}{
			"connected":  true,
			"state":      state,
			"folderId":   folderID,
			"folderName": CardFlowFolderName,
		},
	})
}

// Connect returns a Google OAuth URL for the user to authorize Drive access.
func (h *Handler) Connect(c echo.Context) error {
	res, err := h.svc.Connect(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"error": err.Error()})
	}
	if c.QueryParam("redirect") == "true" || (strings.Contains(c.Request().Header.Get("Accept"), "text/html") && !strings.Contains(c.Request().Header.Get("Accept"), "application/json")) {
		return c.Redirect(http.StatusTemporaryRedirect, res.AuthURL)
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"data":    res,
		"state":   res.State,
		"authUrl": res.AuthURL,
	})
}

// Callback exchanges the Google consent code for an OAuth token.
func (h *Handler) Callback(c echo.Context) error {
	code := c.QueryParam("code")
	state := c.QueryParam("state")
	res, err := h.svc.Callback(c.Request().Context(), code, state)
	if err != nil {
		if strings.Contains(c.Request().Header.Get("Accept"), "text/html") {
			return c.HTML(http.StatusBadRequest, fmt.Sprintf(`<html><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>Lỗi xác thực Google: %s</h2><p><a href="http://localhost:3000/dashboard">Quay lại Dashboard</a></p></body></html>`, err.Error()))
		}
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	if strings.Contains(c.Request().Header.Get("Accept"), "text/html") || c.QueryParam("redirect") == "true" {
		html := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Kết Nối Google Thành Công</title></head>
<body style="background:#090d16;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="background:#1e293b;padding:32px;border-radius:16px;text-align:center;max-width:440px;border:1px solid #38bdf8;box-shadow:0 10px 40px rgba(0,0,0,0.5);">
    <div style="font-size:48px;margin-bottom:12px;">✅</div>
    <h2 style="margin:0 0 10px;color:#38bdf8;">Đã Kết Nối Google Drive & Sheets!</h2>
    <p style="color:#94a3b8;font-size:14px;line-height:1.5;">Thư mục <strong>CardFlow</strong> đã sẵn sàng để lưu trữ thông tin thẻ của bạn.</p>
    <script>
      try {
        localStorage.setItem('cardflow_google_state', %q);
        if (window.opener) {
          window.opener.postMessage({ type: 'GOOGLE_DRIVE_CONNECTED', state: %q }, '*');
          setTimeout(() => window.close(), 1200);
        } else {
          setTimeout(() => { window.location.href = 'http://localhost:3000/dashboard?drive_connected=true'; }, 1000);
        }
      } catch (e) {
        window.location.href = 'http://localhost:3000/dashboard?drive_connected=true';
      }
    </script>
    <a href="http://localhost:3000/dashboard?drive_connected=true" style="display:inline-block;margin-top:16px;background:#0284c7;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;">Về Bảng Điều Khiển</a>
  </div>
</body>
</html>`, state, state)
		return c.HTML(http.StatusOK, html)
	}

	return c.JSON(http.StatusOK, res)
}

// ListFiles lists the files available in the connected Drive account.
func (h *Handler) ListFiles(c echo.Context) error {
	state := c.QueryParam("state")
	if state == "" {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"error": "state is required"})
	}
	files, err := h.svc.ListFiles(c.Request().Context(), state)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"data": files,
	})
}

// Upload uploads a file directly into the "CardFlow" folder on Google Drive.
func (h *Handler) Upload(c echo.Context) error {
	var req UploadRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"error": err.Error()})
	}
	if req.State == "" {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"error": "state is required"})
	}

	file, err := h.svc.UploadFile(c.Request().Context(), req)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"data": file,
	})
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
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"error": "state is required"})
	}

	res, err := h.svc.SyncCardFlowFiles(c.Request().Context(), state)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"data": res,
	})
}

// GetImported returns all Excel and Sheet files imported from the "CardFlow" folder for the state.
func (h *Handler) GetImported(c echo.Context) error {
	state := c.QueryParam("state")
	if state == "" {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"error": "state is required"})
	}

	files, err := h.svc.GetImportedFiles(c.Request().Context(), state)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"data": files,
	})
}

// DeleteFile deletes a file or spreadsheet from Google Drive.
func (h *Handler) DeleteFile(c echo.Context) error {
	var req struct {
		State  string `json:"state"`
		FileID string `json:"fileId"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"error": err.Error()})
	}
	if req.State == "" || req.FileID == "" {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"error": "state and fileId are required"})
	}

	if err := h.svc.DeleteFile(c.Request().Context(), req.State, req.FileID); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"data": map[string]interface{}{
			"success": true,
			"fileId":  req.FileID,
		},
	})
}

