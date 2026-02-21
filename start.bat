@echo off
echo ========================================
echo  GPT Chat Library - Starting Services
echo ========================================
echo.

echo Starting MongoDB Backend Server...
start "Backend Server" cmd /k "cd server && npm start"
timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Development Server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ========================================
echo  Services Starting...
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Press any key to stop all servers...
pause >nul

echo.
echo Stopping servers...
taskkill /FI "WindowTitle eq Backend Server*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq Frontend Server*" /T /F >nul 2>&1
echo Done!
