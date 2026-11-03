@echo off
title SentinMail Dev Launcher
echo =====================================================================
echo   SentinMail - Full Development Mode (Hot-Reloading)
echo =====================================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Backend Server (port 8000)...
start "SentinMail Backend" cmd /k "cd backend && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting Frontend Vite Server (port 5173)...
timeout /t 2 /nobreak >nul
start "SentinMail Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul
start "" http://localhost:5173

echo Both servers launched in separate windows!
echo - Frontend: http://localhost:5173
echo - Backend:  http://localhost:8000
echo.
pause
