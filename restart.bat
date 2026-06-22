@echo off
title SiteGenie - Restart Server
echo ===================================================
echo           Restarting SiteGenie Local Server
echo ===================================================
echo [INFO] Stopping running server if active...
set "pid="
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    set "pid=%%a"
)

if defined pid (
    echo [INFO] Found process PID: %pid%. Terminating...
    taskkill /f /pid %pid%
)

echo [INFO] Launching server in a new window...
start run.bat
echo [INFO] Restart triggered. You can close this window.
timeout /t 3
