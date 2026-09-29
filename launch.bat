@echo off
title TravelMate Launcher
echo ===================================================
echo           Starting TravelMate Web App...
echo ===================================================
echo.
echo Opening TravelMate in your default web browser...
powershell -ExecutionPolicy Bypass -Command "Start-Process 'http://localhost:8000/index.html'" 2>nul
if %errorlevel% neq 0 (
    start index.html
)
echo.
echo Running local web server on port 8000...
powershell -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
pause
