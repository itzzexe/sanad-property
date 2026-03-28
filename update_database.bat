@echo off
title RentFlow Database Updater
echo [1/2] Entering backend directory...
cd /d "%~dp0backend"
echo [2/2] Updating database schema to support logos...
call npx prisma generate
call npx prisma db push
echo.
echo [OK] Database updated successfully!
echo You can now upload your logo.
pause
