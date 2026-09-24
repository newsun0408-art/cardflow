# database/mysql

Connection pool MySQL cho các service github.com/bangdinh/go-kit, xây trên [`sqlx`](https://github.com/jmoiron/sqlx) và [`go-sql-driver/mysql`](https://github.com/go-sql-driver/mysql) với quản lý lifecycle bằng Uber fx.

## Public API

| Symbol | Mô tả |
|--------|-------------|
| `Config` | Cấu hình kết nối và pool (helper `DSN()` / `Addr()`) |
| `Module` | fx module — cung cấp `MySQLHandler` |
| `NewHandler(lc, cfg, logger)` | Constructor mà `Module` dùng |
| `MySQLHandler` | `DB() *sqlx.DB` + `Check(ctx) error` (cài `observability.HealthChecker`) |
| `MigrateUp(dsn, migrations, dir)` | Chạy tất cả migration up còn treo |
| `MigrateDown(dsn, migrations, dir)` | Rollback tất cả migration đã áp |

## Các field của Config

| Field | Type | Bắt buộc | Mô tả |
|-------|------|----------|-------------|
| `host` | string | có | Host MySQL |
| `port` | int | có | Port MySQL (1–65535) |
| `database` | string | có | Tên database |
| `user` | string | có | Username |
| `password` | string | có | Password |
| `max_open_conns` | int | không | Số kết nối mở tối đa |
| `max_idle_conns` | int | không | Số kết nối idle tối đa |
| `conn_max_lifetime` | duration | không | Thời gian sống tối đa của 1 kết nối |
| `conn_max_idle_time` | duration | không | Thời gian idle tối đa của 1 kết nối |
| `tls` | bool | không | Bật TLS (mặc định: false) |
| `connect_timeout` | duration | không | Timeout khi kết nối |

## Dùng với fx

Trong wiring production, `*mysql.Config` đến từ config toàn cục qua `config.ExtractProviders()` (không bao giờ `fx.Supply` một literal — xem CLAUDE.md rule 4):

```go
import (
    "github.com/bangdinh/go-kit/app"
    "github.com/bangdinh/go-kit/config"
    "github.com/bangdinh/go-kit/database/mysql"
)

app.New(
    app.WithConfig(cfg), // cfg.MySQL nạp từ application-config/config.json (key "mysql")
    app.WithFxOption(config.ExtractProviders()),
    app.WithFxModule(mysql.Module),
    app.WithInvokers(func(h mysql.MySQLHandler) {
        db := h.DB() // *sqlx.DB, sẵn sàng dùng
        _ = db
    }),
)
```

(`fx.Supply(&mysql.Config{...})` chỉ dành cho unit test.)

## Migration

```go
//go:embed migrations
var migrations embed.FS

err := mysql.MigrateUp(cfg.DSN(), migrations, "migrations")
```

File migration theo quy ước đặt tên của `golang-migrate`: `000001_create_users.up.sql`, `000001_create_users.down.sql`.

## Biến môi trường (qua Viper/mapstructure)

```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=myservice
MYSQL_USER=app
MYSQL_PASSWORD=secret
MYSQL_MAX_OPEN_CONNS=10
MYSQL_TLS=false
```
