package mysql

import (
	"context"
	"crypto/tls"
	"fmt"
	"time"

	drvmysql "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

// sqlxOpen is a variable so tests can inject a mock without a real MySQL server.
var sqlxOpen = sqlx.Open

var Module = fx.Module("mysql",
	fx.Provide(NewHandler),
)

func NewHandler(lc fx.Lifecycle, cfg *Config, logger *zap.Logger) (MySQLHandler, error) {
	if cfg.TLS {
		_ = drvmysql.RegisterTLSConfig("custom", &tls.Config{})
	}

	db, err := sqlxOpen("mysql", cfg.DSN())
	if err != nil {
		return nil, fmt.Errorf("mysql: open failed: %w", err)
	}

	if cfg.MaxOpenConns > 0 {
		db.SetMaxOpenConns(cfg.MaxOpenConns)
	}
	if cfg.MaxIdleConns > 0 {
		db.SetMaxIdleConns(cfg.MaxIdleConns)
	}
	if cfg.ConnMaxLifetime > 0 {
		db.SetConnMaxLifetime(cfg.ConnMaxLifetime)
	}
	if cfg.ConnMaxIdleTime > 0 {
		db.SetConnMaxIdleTime(cfg.ConnMaxIdleTime)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, fmt.Errorf("mysql: ping failed: %w", err)
	}

	logger.Info("mysql connected",
		zap.String("addr", cfg.Addr()),
		zap.Int("max_open_conns", cfg.MaxOpenConns),
		zap.Int("max_idle_conns", cfg.MaxIdleConns),
		zap.Duration("conn_max_lifetime", cfg.ConnMaxLifetime),
	)

	lc.Append(fx.Hook{
		OnStop: func(ctx context.Context) error {
			logger.Info("closing mysql connection")
			return db.Close()
		},
	})

	return &mysqlHandler{db: db}, nil
}
