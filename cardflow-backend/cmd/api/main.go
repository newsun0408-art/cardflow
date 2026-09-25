package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"go.uber.org/zap"

	"github.com/bangdinh/cardflow-backend/internal/auth"
	"github.com/bangdinh/cardflow-backend/internal/card"
	"github.com/bangdinh/cardflow-backend/internal/drive"
	"github.com/bangdinh/cardflow-backend/internal/sheet"
	"github.com/bangdinh/cardflow-backend/internal/transaction"
)

func loadEnvFile(path string) {
	data, err := os.ReadFile(path)
	if err != nil {
		return
	}
	lines := strings.Split(string(data), "\n")
	for _, l := range lines {
		l = strings.TrimSpace(l)
		if l == "" || strings.HasPrefix(l, "#") {
			continue
		}
		parts := strings.SplitN(l, "=", 2)
		if len(parts) == 2 {
			k := strings.TrimSpace(parts[0])
			v := strings.TrimSpace(parts[1])
			if os.Getenv(k) == "" {
				os.Setenv(k, v)
			}
		}
	}
}

func main() {
	loadEnvFile("application-config/.env")
	loadEnvFile("../application-config/.env")

	logger, _ := zap.NewDevelopment()
	defer logger.Sync()

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:password@127.0.0.1:5433/sample_db?sslmode=disable"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		logger.Fatal("failed to connect to database", zap.Error(err))
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		logger.Fatal("failed to ping database", zap.Error(err))
	}
	logger.Info("connected to PostgreSQL successfully", zap.String("dsn", dsn))

	e := echo.New()
	e.HideBanner = true
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:3000", "http://127.0.0.1:3000", "*"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete, http.MethodOptions},
		AllowHeaders: []string{"Origin", "Content-Type", "Accept", "Authorization", "X-User-Id", "X-Request-Id", "x-request-id", "X-Tenant-Id", "*"},
	}))

	// Health check
	e.GET("/healthz", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok", "service": "cardflow-backend"})
	})

	// Mount Auth, Card & Transaction routes
	authStore := auth.NewStore(pool, logger)
	authSvc := auth.NewService(authStore)
	authHandler := auth.NewHandler(authSvc)
	authHandler.RegisterRoutes(e)

	cardStore := card.NewStore(pool, logger)
	cardSvc := card.NewService(cardStore)
	cardHandler := card.NewHandler(cardSvc)
	cardHandler.RegisterRoutes(e)

	txStore := transaction.NewStore(pool, logger)
	txSvc := transaction.NewService(txStore)
	txHandler := transaction.NewHandler(txSvc)
	txHandler.RegisterRoutes(e)

	// Mount Google Drive & Google Sheets integration routes
	driveStore := drive.NewStore()
	driveSvc := drive.NewService(driveStore)
	driveHandler := drive.NewHandler(driveSvc)
	driveHandler.RegisterRoutes(e)

	sheetSvc := sheet.NewService(driveStore)
	sheetHandler := sheet.NewHandler(sheetSvc)
	sheetHandler.RegisterRoutes(e)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	logger.Info(fmt.Sprintf("Cardflow API Server running on port :%s", port))
	if err := e.Start(":" + port); err != nil {
		logger.Fatal("server shut down", zap.Error(err))
	}
}
