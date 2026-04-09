@echo off
title RentFlow Database Synchronizer
echo   =================================================================
echo   =   [DATABASE] SYNCING SCHEMA WITH PRISMA                         =
echo   =================================================================
echo.

echo [1/3] Entering backend directory...
cd /d "%~dp0backend"

echo [2/3] Generating Prisma Client...
call npx prisma generate

echo [3/3] Pushing schema changes to the database...
call npx prisma db push

echo.
echo [SUCCESS] Database is now fully synchronized with the latest schema!
echo.
pause
