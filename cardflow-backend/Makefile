# Makefile của service.  Gõ `make` (hoặc `make help`) để xem danh sách lệnh.
#
# Vòng lặp thường ngày:   make run   ·   make test   ·   make lint   ·   make build
# Cập nhật core gokit:    make sync-gokit VERSION=vX.Y.Z     (thư viện + asset dùng chung)
# Cắt release service:    make release   VERSION=vX.Y.Z     (CHANGELOG + commit + tag, không push)
#
# LƯU Ý: file này là ASSET DÙNG CHUNG — `make sync-gokit` sẽ GHI ĐÈ nó theo core.
# Target riêng của service để trong Makefile.local (được include dưới đây, sync KHÔNG đụng).

.DEFAULT_GOAL := help
.PHONY: help test test-cover lint build run migrate-up migrate-down docker-build release sync-gokit

GOKIT_MOD ?= github.com/bangdinh/go-kit
APP_NAME  ?= $(notdir $(CURDIR))
BIN_DIR   ?= bin

-include Makefile.local   # target riêng của service (không bị sync ghi đè); bỏ qua nếu không có

hooks: ## Bật git hook của repo (chạy 1 lần mỗi clone)
	@git config core.hooksPath .githooks && echo "✓ core.hooksPath = .githooks"
	@chmod +x .githooks/commit-msg 2>/dev/null || true

help: ## Hiện danh sách lệnh (mặc định khi gõ `make`)
	@echo "$(APP_NAME) — lệnh thường dùng:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ── Kiểm thử & chất lượng ─────────────────────────────────────────────────────
test: ## Chạy toàn bộ unit test (kèm -race)
	go test -v -race ./...

test-cover: ## Test + báo cáo coverage (mở coverage.html)
	go test -v -race -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

lint: ## Chạy golangci-lint
	golangci-lint run ./...

# ── Build & chạy ──────────────────────────────────────────────────────────────
build: ## Build 4 binary vào bin/ (server/migrate/worker/cli)
	@mkdir -p $(BIN_DIR)
	go build -o $(BIN_DIR)/server  ./cmd/server
	go build -o $(BIN_DIR)/migrate ./cmd/migrate
	go build -o $(BIN_DIR)/worker  ./cmd/worker
	go build -o $(BIN_DIR)/cli     ./cmd/cli
	@echo "Build xong trong $(BIN_DIR)/"

run: ## Chạy HTTP server local (:8080)
	go run ./cmd/server

migrate-up: ## Chạy migration DB (up)
	go run ./cmd/migrate up

migrate-down: ## Rollback migration gần nhất (down)
	go run ./cmd/migrate down

docker-build: ## Build Docker image
	docker build -t $(APP_NAME):latest -f deploy/Dockerfile .

# ── Release & đồng bộ core ─────────────────────────────────────────────────────
# make release VERSION=vX.Y.Z DRY=1    # xem trước changelog (không ghi gì)
# make release VERSION=vX.Y.Z          # ghi CHANGELOG + commit + tag
# git push origin master --tags        # rồi tự đẩy lên
release: ## Cắt release: CHANGELOG + commit + tag (VERSION=vX.Y.Z; DRY=1 xem trước; KHÔNG push)
	@[ -n "$(VERSION)" ] || { echo 'Dùng: make release VERSION=v1.0.0 [DRY=1]'; exit 1; }
	@bash scripts/release.sh "$(VERSION)" $(if $(DRY),--dry)

# Cập nhật go-kit theo tag — MỘT lệnh, cả 2 phần về cùng VERSION:
#   (A) THƯ VIỆN: go get + go mod tidy → bump go.mod/go.sum
#   (B) ASSET dùng chung (skill/docs/CONTRIBUTING/release.sh) → ghi đè, KHÔNG đụng internal/cmd/config/README/CLAUDE.md
# make sync-gokit VERSION=v1.1.0    # cập nhật thư viện + asset
# git diff                          # review (gồm cả go.mod/go.sum)
# git add -p && commit              # tự quyết nhận gì
sync-gokit: ## Cập nhật go-kit theo tag: bump thư viện + kéo asset dùng chung (VERSION=vX.Y.Z; xem git diff rồi commit)
	@[ -n "$(VERSION)" ] || { echo 'Dùng: make sync-gokit VERSION=v1.1.0'; exit 1; }
	@echo "→ (A) bump thư viện $(GOKIT_MOD)@$(VERSION)"
	@GOPRIVATE=github.com/bangdinh GOWORK=off go get $(GOKIT_MOD)@$(VERSION)
	@GOPRIVATE=github.com/bangdinh GOWORK=off go mod tidy
	@echo "→ (B) kéo asset dùng chung @$(VERSION)"
	@GOPRIVATE=github.com/bangdinh GOWORK=off go run $(GOKIT_MOD)/cmd/scaffold@$(VERSION) sync .
