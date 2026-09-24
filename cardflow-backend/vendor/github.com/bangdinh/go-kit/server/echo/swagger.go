package echo

import (
	"net/http"

	"github.com/labstack/echo/v4"
	echoSwagger "github.com/swaggo/echo-swagger"
)

func registerSwagger(e *echo.Echo, cfg SwaggerConfig) {
	if !cfg.Enabled {
		return
	}

	e.GET("/swagger", func(c echo.Context) error {
		return c.Redirect(http.StatusMovedPermanently, "/swagger/index.html")
	})

	e.GET("/swagger/*", echoSwagger.WrapHandler)
}
