@echo off
echo Starting Cobits Study Application...

echo Starting Backend Server...
start cmd /k "cd backend && npm start"

echo Starting Frontend Server...
REM Check if http-server is installed globally
where http-server >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    start cmd /k "http-server . -p 5500 -c-1"
) else (
    echo http-server not found. Installing...
    start cmd /k "npm install -g http-server && http-server . -p 5500 -c-1"
)

echo Cobits Study is starting up!
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5500
echo.
echo Press any key to open the application in your browser...
pause >nul
start http://localhost:5500
