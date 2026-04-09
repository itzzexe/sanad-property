@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title RentFlow Management System - Professional Launcher
color 0B

:: --- Header ---
echo.
echo   =================================================================
echo   =                                                               =
echo   =   [START] RENTFLOW SYSTEM - Advanced Property Management      =
echo   =                                                               =
echo   =================================================================
echo.

:: --- Step 0: Cleanup ---
echo [0/4] [CLEANUP] Ensuring ports are free...
taskkill /F /IM node.exe /T >nul 2>&1
echo [OK] Old Node processes cleared.

:: --- Step 1: Check Docker Status ---
echo.
echo [1/4] [INFRA] Checking Infrastructure (PostgreSQL / MinIO)...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Docker Desktop is not running or not in PATH!
    echo [!] Action: Please start Docker Desktop and run this file again.
    echo.
    pause
    exit /b
)

:: Start only the essential infrastructure services operations
docker start rentflow-minio >nul 2>&1
if %errorlevel% neq 0 (
    docker-compose up -d minio
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to start Docker services.
        pause
        exit /b
    )
)
echo [OK] Base infrastructure is online.

:: --- Step 2: Database Preparation ---
echo.
echo [2/4] [DB] Preparing Database (Schema Push)...
cd /d "%~dp0backend"
if not exist "node_modules\" (
    echo [BACKEND] Installing dependencies...
    call npm install
)
echo [BACKEND] Generating Prisma Client...
call npx prisma generate
echo [BACKEND] Pushing schema to DB...
call npx prisma db push --skip-generate
echo [OK] Database is ready and synced.

:: --- Step 3: Start Backend ---
echo.
echo [3/4] [API] Launching Backend Server (NestJS - Port 4000)...
start "RentFlow API" cmd /k "cd /d "%~dp0backend" && echo [BACKEND] Starting... && npm run start:dev"
echo [OK] Backend terminal window opened.

:: --- Step 4: Start Frontend ---
echo.
echo [4/4] [UI] Launching Frontend Dashboard (Next.js - Port 3000)...
if not exist "%~dp0frontend\node_modules\" (
    echo.
    echo [FRONTEND] node_modules not found, installing...
    cd /d "%~dp0frontend"
    call npm install
)
start "RentFlow UI" cmd /k "cd /d "%~dp0frontend" && echo [FRONTEND] Starting... && npm run dev"
echo [OK] Frontend terminal window opened.

:: --- Summary & Links ---
echo.
echo -----------------------------------------------------------------
echo [SUCCESS] RentFlow ecosystem is initializing...
echo -----------------------------------------------------------------
echo [DASHBOARD]  http://localhost:3000
echo [API SERVER] http://localhost:4000
echo [API DOCS]   http://localhost:4000/docs
echo [STORAGE]    http://localhost:9001 (MinIO Console)
echo -----------------------------------------------------------------
echo [!] Keep the terminal windows open while working.
echo -----------------------------------------------------------------
echo.
echo [INFO] Press any key to finish (the app will continue running).
pause >nul
