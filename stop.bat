@echo off
title SiteGenie - Stop Server
echo ===================================================
echo           Stopping SiteGenie Local Server
echo ===================================================
echo [INFO] Finding process listening on port 5000...
set "pid="
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    set "pid=%%a"
)

if defined pid (
    echo [INFO] Found process PID: %pid% listening on port 5000.
    echo [INFO] Terminating server process...
    taskkill /f /pid %pid%
    echo [INFO] Server stopped successfully.
) else (
    echo [INFO] No running server found on port 5000.
)
echo.
pause
