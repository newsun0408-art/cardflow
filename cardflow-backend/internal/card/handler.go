package card

import (
	"net/http"

	"github.com/bangdinh/go-kit/response"
	"github.com/labstack/echo/v4"
)

// Handler exposes HTTP routes for Card operations.
type Handler struct {
	svc *Service
}

// NewHandler creates a new Card HTTP handler.
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// RegisterRoutes mounts card routes on the Echo router following Kong / API standard.
func (h *Handler) RegisterRoutes(e *echo.Echo, mw ...echo.MiddlewareFunc) {
	g := e.Group("/cardflow-backend/v1/card", mw...)

	g.GET("/actions/list", h.List)
	g.GET("/actions/view/:cardId", h.GetByID)
	g.POST("/actions/create", h.Create)
	g.POST("/actions/verify-pin", h.VerifyPin)
	g.POST("/actions/change-pin", h.ChangePin)
	g.POST("/actions/set-limit", h.SetLimit)
	g.POST("/actions/toggle-lock", h.ToggleLock)
}

// List returns all user cards.
func (h *Handler) List(c echo.Context) error {
	cards, err := h.svc.List(c.Request().Context())
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, response.NewData(cards))
}

// GetByID returns card details.
func (h *Handler) GetByID(c echo.Context) error {
	id := c.Param("cardId")
	card, err := h.svc.GetByID(c.Request().Context(), id)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, response.NewData(card))
}

// Create registers a new card.
func (h *Handler) Create(c echo.Context) error {
	var req CreateCardRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid payload"})
	}
	card, err := h.svc.Create(c.Request().Context(), req)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusCreated, response.NewData(card))
}

// VerifyPin handles PIN verification to reveal sensitive CVV & card number.
func (h *Handler) VerifyPin(c echo.Context) error {
	var req VerifyPinRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid payload"})
	}
	res, err := h.svc.VerifyPin(c.Request().Context(), req)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, response.NewData(res))
}

// ChangePin updates card PIN.
func (h *Handler) ChangePin(c echo.Context) error {
	var req ChangePinRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid payload"})
	}
	if err := h.svc.ChangePin(c.Request().Context(), req); err != nil {
		return err
	}
	return c.JSON(http.StatusOK, response.NewData(map[string]bool{"success": true}))
}

// SetLimit adjusts daily transaction limit.
func (h *Handler) SetLimit(c echo.Context) error {
	var req SetLimitRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid payload"})
	}
	if err := h.svc.SetLimit(c.Request().Context(), req); err != nil {
		return err
	}
	return c.JSON(http.StatusOK, response.NewData(map[string]bool{"success": true}))
}

// ToggleLock freezes or unfreezes card.
func (h *Handler) ToggleLock(c echo.Context) error {
	var req ToggleLockRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid payload"})
	}
	isLocked, err := h.svc.ToggleLock(c.Request().Context(), req)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, response.NewData(map[string]interface{}{
		"success":  true,
		"isLocked": isLocked,
	}))
}
