@echo off
title SiteGenie - Runner
echo ===================================================
echo           Starting SiteGenie Locally
echo ===================================================
echo [INFO] Checking node_modules...
if not exist node_modules (
    echo [INFO] node_modules not found. Installing dependencies...
    call npm install
)
echo [INFO] Launching development server on http://localhost:5000...
call npm run dev
pause
