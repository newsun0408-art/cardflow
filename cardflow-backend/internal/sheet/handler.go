package sheet

import (
	"net/http"

	"github.com/bangdinh/go-kit/response"
	"github.com/labstack/echo/v4"
)

// Handler exposes the Google Sheets integration endpoints.
type Handler struct {
	svc *Service
}

// NewHandler creates a new Sheets HTTP handler.
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// RegisterRoutes mounts Google Sheets routes on the Echo router.
func (h *Handler) RegisterRoutes(e *echo.Echo, mw ...echo.MiddlewareFunc) {
	g := e.Group("/cardflow-backend/v1/sheet", mw...)
	g.POST("/actions/create", h.CreateSpreadsheet)
	g.GET("/actions/read", h.ReadRows)
	g.POST("/actions/append", h.AppendRows)
	g.PUT("/actions/update", h.UpdateRows)
	g.POST("/actions/import", h.ImportSheet)
	g.GET("/actions/import", h.ImportSheet)
}

// CreateSpreadsheet handles creating a new Google Sheet.
func (h *Handler) CreateSpreadsheet(c echo.Context) error {
	var req CreateSpreadsheetRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	res, err := h.svc.CreateSpreadsheet(c.Request().Context(), req.State, req.Title)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, response.NewData(res))
}

// ReadRows handles reading data from a spreadsheet range.
func (h *Handler) ReadRows(c echo.Context) error {
	state := c.QueryParam("state")
	spreadsheetID := c.QueryParam("spreadsheetId")
	readRange := c.QueryParam("range")

	res, err := h.svc.ReadRows(c.Request().Context(), state, spreadsheetID, readRange)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, response.NewData(res))
}

// AppendRows handles appending rows of data into a spreadsheet.
func (h *Handler) AppendRows(c echo.Context) error {
	var req AppendRowsRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	res, err := h.svc.AppendRows(c.Request().Context(), req.State, req.SpreadsheetID, req.Range, req.Values)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, response.NewData(res))
}

// UpdateRows handles overwriting a specific range of cells in a spreadsheet.
func (h *Handler) UpdateRows(c echo.Context) error {
	var req UpdateRowsRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	res, err := h.svc.UpdateRows(c.Request().Context(), req.State, req.SpreadsheetID, req.Range, req.Values)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, response.NewData(res))
}

// ImportSheet handles reading and parsing transactions from a Google Sheet.
func (h *Handler) ImportSheet(c echo.Context) error {
	var req ImportSheetRequest
	if c.Request().Method == http.MethodPost {
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
	}
	if req.State == "" {
		req.State = c.QueryParam("state")
	}
	if req.SpreadsheetID == "" {
		req.SpreadsheetID = c.QueryParam("spreadsheetId")
	}
	if req.Range == "" {
		req.Range = c.QueryParam("range")
	}

	res, err := h.svc.ImportSheet(c.Request().Context(), req)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, response.NewData(res))
}
