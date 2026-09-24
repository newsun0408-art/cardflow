// Package main — Entrypoint cho tiến trình Database Migration (golang-migrate).
//
// Quy chuẩn kiến trúc: Standard Go Project Layout (golang-standards/project-layout)
//   - Vai trò: Tiến trình độc lập chuyên chạy/roll back các file SQL Migration trong thư mục migrations/.
//   - Cách dùng:
//     go run ./cmd/migrate up    - Chạy tất cả các file migration SQL chưa áp dụng
//     go run ./cmd/migrate down  - Rollback toàn bộ các migration
package main

import (
	"errors"
	"flag"
	"fmt"
	"os"

	"github.com/bangdinh/go-kit/config"
	"github.com/bangdinh/go-kit/log"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"go.uber.org/zap"
)

func main() {
	dir := flag.String("dir", "migrations", "directory containing SQL migration files")
	configDir := flag.String("config", config.DefaultConfigDir(), "directory containing runtime config.json (env: APPLICATION_CONFIG_DIR)")
	flag.Parse()

	cmd := flag.Arg(0)
	if cmd == "" {
		cmd = "up"
	}

	cfg, err := config.Load(config.LoadOptions{ConfigDir: *configDir})
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to load config: %v\n", err)
		os.Exit(1)
	}

	logger, err := log.NewLogger(log.Config{
		Level:       cfg.App.LogLevel,
		Format:      "json",
		Environment: cfg.App.Env,
		ServiceName: "cardflow-backend-migrate",
	})
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to init logger: %v\n", err)
		os.Exit(1)
	}

	if cfg.Postgres == nil || cfg.Postgres.Host == "" {
		logger.Fatal("postgres configuration is missing or invalid")
	}

	// Dùng DSN() của core, KHÔNG ghép chuỗi tay. Ghép tay không escape password:
	// mật khẩu chứa @ : / ? # — bình thường ở môi trường thật — làm URL vỡ. Với
	// "p@ss:w0rd/x?y#z" thì url.Parse trả `invalid port ":w0rd" after host`, còn
	// DSN() round-trip đúng nguyên văn. Lỗi chỉ lộ lúc deploy môi trường thật,
	// kèm thông báo không liên quan gì tới password.
	//
	// Cũng giữ MỘT nguồn chân lý cho chuỗi kết nối: server dùng postgres.Module
	// (qua DSN()), migrate phải dùng đúng chuỗi đó.
	dsn := cfg.Postgres.DSN()

	sourceURL := fmt.Sprintf("file://%s", *dir)
	m, err := migrate.New(sourceURL, dsn)
	if err != nil {
		logger.Fatal("failed to create migrate instance", zap.Error(err), zap.String("source", sourceURL))
	}
	defer m.Close()

	switch cmd {
	case "up":
		if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
			logger.Fatal("migration up failed", zap.Error(err))
		}
		logger.Info("migrations applied successfully (up)")
	case "down":
		if err := m.Down(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
			logger.Fatal("migration down failed", zap.Error(err))
		}
		logger.Info("migrations rolled back successfully (down)")
	default:
		logger.Fatal("unknown migration command", zap.String("command", cmd))
	}
}
