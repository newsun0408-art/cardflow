// Package main — Entrypoint cho Administrative CLI Tool.
//
// Quy chuẩn kiến trúc: Standard Go Project Layout (golang-standards/project-layout)
//   - Vai trò: Công cụ dòng lệnh dành cho Admin/DevOps thực hiện các tác vụ quản trị, kiểm tra sức khỏe
//     hoặc bảo trì hệ thống trực tiếp từ terminal.
//   - Cách dùng:
//     go run ./cmd/cli status
package main

import (
	"flag"
	"fmt"
	"os"

	"go.uber.org/zap"

	"github.com/bangdinh/go-kit/config"
	"github.com/bangdinh/go-kit/log"
)

func main() {
	configDir := flag.String("config", config.DefaultConfigDir(), "directory containing runtime config.json (env: APPLICATION_CONFIG_DIR)")
	flag.Parse()

	cmd := flag.Arg(0)

	cfg, err := config.Load(config.LoadOptions{ConfigDir: *configDir})
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to load config: %v\n", err)
		os.Exit(1)
	}

	logger, err := log.NewLogger(log.Config{
		Level:       cfg.App.LogLevel,
		Format:      "json",
		Environment: cfg.App.Env,
		ServiceName: "cardflow-backend-cli",
	})
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to init logger: %v\n", err)
		os.Exit(1)
	}

	switch cmd {
	case "status":
		logger.Info("CLI: checking service status", zap.String("env", cfg.App.Env))
		fmt.Printf("Service: %s\nStatus: OK\nEnv: %s\n", "cardflow-backend", cfg.App.Env)
	default:
		fmt.Println("Available commands:\n  status  - Check service configuration status")
	}
}
