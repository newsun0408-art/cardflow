package card

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
	g := e.Group("/api/v1/cards")

	g.GET("", h.listCards)
	g.POST("", h.createCard)
	g.PATCH("/:id/status", h.updateCardStatus)
}

func (h *Handler) listCards(c echo.Context) error {
	userID := c.Request().Header.Get("X-User-Id")
	if userID == "" {
		userID = "usr-001"
	}
	cards, err := h.svc.List(c.Request().Context(), userID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, map[string]any{
		"data": cards,
	})
}

func (h *Handler) createCard(c echo.Context) error {
	userID := c.Request().Header.Get("X-User-Id")
	if userID == "" {
		userID = "usr-001"
	}
	var req CreateCardRequest
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

func (h *Handler) updateCardStatus(c echo.Context) error {
	id := c.Param("id")
	var req UpdateStatusRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if err := h.svc.UpdateStatus(c.Request().Context(), id, req.Status); err != nil {
		return err
	}
	return c.JSON(http.StatusOK, map[string]any{
		"data": map[string]string{"id": id, "status": req.Status},
	})
}
