param (
    [string]$Command = "help"
)

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Show-Help {
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host "                 💳 CARDFLOW FULLSTACK RUNNER (Windows)               " -ForegroundColor Yellow
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host "  .\run.ps1 dev          - Khoi chay toan bo (DB + Go Backend + Web App)" -ForegroundColor Green
    Write-Host "  .\run.ps1 infra        - Khoi dong PostgreSQL (5432) & Redis (6379)"
    Write-Host "  .\run.ps1 backend      - Khoi chay Go Backend HTTP Server (:8080)"
    Write-Host "  .\run.ps1 app          - Khoi chay Next.js Web Frontend (:3000)"
    Write-Host "  .\run.ps1 mobile       - Khoi chay Expo Mobile App"
    Write-Host "  .\run.ps1 build        - Build production Backend va Web App"
    Write-Host "  .\run.ps1 check        - Kiem tra type-check va lint toan bo"
    Write-Host "  .\run.ps1 stop         - Dung database Docker"
    Write-Host "======================================================================" -ForegroundColor Cyan
}

switch ($Command.ToLower()) {
    "infra" {
        Write-Host "🐳 Dang khoi dong Database (PostgreSQL 16 & Redis 7)..." -ForegroundColor Yellow
        docker compose -f "$rootDir\cardflow-backend\docker-compose.yml" up -d postgres redis
        Write-Host "✅ Database da san sang tai port 5432 (Postgres) va 6379 (Redis)!" -ForegroundColor Green
    }
    "backend" {
        Write-Host "⚙️ Dang khoi chay Go Backend Server..." -ForegroundColor Yellow
        Set-Location "$rootDir\cardflow-backend"
        go run -mod=mod ./cmd/api
    }
    "app" {
        Write-Host "🌐 Dang khoi chay Next.js Web Frontend..." -ForegroundColor Yellow
        Set-Location "$rootDir\cardflow-app"
        pnpm --filter @cardflow-app/web dev
    }
    "mobile" {
        Write-Host "📱 Dang khoi chay Expo React Native App..." -ForegroundColor Yellow
        Set-Location "$rootDir\cardflow-app"
        pnpm --filter @cardflow-app/mobile dev
    }
    "dev" {
        Write-Host "🚀 DANG KHOI CHAY TOAN BO HE THONG CARDFLOW..." -ForegroundColor Cyan
        
        # 1. Start infra
        Write-Host "`n[1/3] Khoi dong Database (PostgreSQL & Redis)..." -ForegroundColor Yellow
        docker compose -f "$rootDir\cardflow-backend\docker-compose.yml" up -d postgres redis
        
        Write-Host "`n[2/3] Bat Go Backend tren cua so moi (Port 8080)..." -ForegroundColor Yellow
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\cardflow-backend'; Write-Host '--- ⚙️ CARDFLOW GO BACKEND (:8080) ---' -ForegroundColor Green; go run -mod=mod ./cmd/api"

        Write-Host "`n[3/3] Bat Next.js Web Frontend tren cua so moi (Port 3000)..." -ForegroundColor Yellow
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\cardflow-app'; Write-Host '--- 🌐 CARDFLOW WEB FRONTEND (:3000) ---' -ForegroundColor Cyan; pnpm --filter @cardflow-app/web dev"

        Write-Host "`n======================================================================" -ForegroundColor Green
        Write-Host "✨ CARDFLOW FULLSTACK DA KHOI CHAY THANH CONG!" -ForegroundColor Green
        Write-Host "   🌐 Web Application : http://localhost:3000" -ForegroundColor White
        Write-Host "   ⚙️ Backend API     : http://localhost:8080 (Health: /healthz)" -ForegroundColor White
        Write-Host "   🐘 PostgreSQL      : localhost:5432" -ForegroundColor White
        Write-Host "   🔴 Redis           : localhost:6379" -ForegroundColor White
        Write-Host "   🧠 Memory Hub      : http://localhost:8125" -ForegroundColor White
        Write-Host "======================================================================" -ForegroundColor Green
    }
    "build" {
        Write-Host "🔨 Dang build Backend (Go)..." -ForegroundColor Yellow
        Set-Location "$rootDir\cardflow-backend"
        go build -o bin/server.exe ./cmd/server

        Write-Host "🔨 Dang build Web App (Next.js)..." -ForegroundColor Yellow
        Set-Location "$rootDir\cardflow-app"
        pnpm --filter @cardflow-app/web build
        Write-Host "✅ Build thanh cong ca Backend va Web App!" -ForegroundColor Green
    }
    "check" {
        Write-Host "🔍 Dang kiem tra Type-check & Lint..." -ForegroundColor Yellow
        Set-Location "$rootDir\cardflow-app"
        pnpm type-check
        pnpm lint
        Set-Location "$rootDir\cardflow-backend"
        go test ./...
        Write-Host "✅ Moi kiem tra deu vuot qua!" -ForegroundColor Green
    }
    "stop" {
        Write-Host "🛑 Dang dung Database Docker..." -ForegroundColor Yellow
        docker compose -f "$rootDir\cardflow-backend\docker-compose.yml" stop
        Write-Host "✅ Da dung xong!" -ForegroundColor Green
    }
    default {
        Show-Help
    }
}
