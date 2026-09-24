.PHONY: help dev dev-infra dev-backend dev-app dev-mobile build build-all type-check lint test stop clean

help:
	@echo "======================================================================"
	@echo "                 ?? CARDFLOW FULLSTACK ORCHESTRATOR                   "
	@echo "======================================================================"
	@echo "  make dev          - Khoi chay toan bo (DB + Go Backend + Web App)"
	@echo "  make dev-infra    - Khoi dong PostgreSQL (5432) & Redis (6379)"
	@echo "  make dev-backend  - Khoi chay Go Backend HTTP Server (:8080)"
	@echo "  make dev-app      - Khoi chay Next.js Web Frontend (:3000)"
	@echo "  make dev-mobile   - Khoi chay Expo React Native Mobile App"
	@echo "  make build        - Build production Backend va Next.js Web"
	@echo "  make type-check   - Kiem tra type TypeScript toan bo app"
	@echo "  make lint         - Kiem tra lint toan bo du an"
	@echo "  make test         - Chay automated tests ca Backend va Web"
	@echo "  make stop         - Dung tat ca container Docker"
	@echo "======================================================================"

dev-infra:
	docker compose -f cardflow-backend/docker-compose.yml up -d postgres redis

dev-backend:
	cd cardflow-backend && go run ./cmd/server

dev-app:
	cd cardflow-app && pnpm --filter @cardflow-app/web dev

dev-mobile:
	cd cardflow-app && pnpm --filter @cardflow-app/mobile dev

dev: dev-infra
	powershell -ExecutionPolicy Bypass -File ./run.ps1 dev

build:
	cd cardflow-backend && go build -o bin/server.exe ./cmd/server
	cd cardflow-app && pnpm --filter @cardflow-app/web build

build-all:
	cd cardflow-backend && go build -o bin/server.exe ./cmd/server
	cd cardflow-app && pnpm build

type-check:
	cd cardflow-app && pnpm type-check

lint:
	cd cardflow-app && pnpm lint

test:
	cd cardflow-backend && go test ./...

stop:
	docker compose -f cardflow-backend/docker-compose.yml stop

clean:
	rm -rf cardflow-app/apps/web/.next
	rm -rf cardflow-backend/bin