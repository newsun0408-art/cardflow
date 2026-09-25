package transaction

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(e *echo.Echo) {
	g := e.Group("/api/v1/transactions")

	g.GET("", h.listTransactions)
	g.POST("", h.createTransaction)
	g.GET("/summary", h.getSummary)
}

func (h *Handler) listTransactions(c echo.Context) error {
	userID := c.Request().Header.Get("X-User-Id")
	if userID == "" {
		userID = "usr-001"
	}
	category := c.QueryParam("category")
	status := c.QueryParam("status")

	txs, err := h.svc.List(c.Request().Context(), userID, category, status)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, map[string]any{
		"data": txs,
	})
}

func (h *Handler) createTransaction(c echo.Context) error {
	userID := c.Request().Header.Get("X-User-Id")
	if userID == "" {
		userID = "usr-001"
	}
	var req CreateTransactionRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	created, err := h.svc.Create(c.Request().Context(), userID, req)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusCreated, map[string]any{
		"data": created,
	})
}

func (h *Handler) getSummary(c echo.Context) error {
	userID := c.Request().Header.Get("X-User-Id")
	if userID == "" {
		userID = "usr-001"
	}
	summary, err := h.svc.GetSummary(c.Request().Context(), userID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, map[string]any{
		"data": summary,
	})
}
