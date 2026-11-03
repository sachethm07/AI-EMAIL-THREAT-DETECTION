@echo off
title SentinMail - AI Email Threat Detection & Forensic Platform
echo =====================================================================
echo   SentinMail - Email Threat Detection & Forensic Intelligence
echo =====================================================================
echo.
echo Starting backend server with embedded React frontend on port 8000...
echo.

cd /d "%~dp0backend"

if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Python virtual environment not found in backend\.venv
    echo Please ensure the project was initialized properly.
    pause
    exit /b 1
)

echo Launching browser at http://localhost:8000 ...
timeout /t 2 /nobreak >nul
start "" http://localhost:8000

.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
pause
