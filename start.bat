@echo off
chcp 65001 > nul
title EZDQ Web - Discord Quest Automation

echo ================================================================
echo               EZDQ Web - Discord Quest Automation
echo          Chạy trên máy tính cá nhân (Localhost - IP Sạch)
echo ================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [LỖI] Chưa tìm thấy Node.js trên máy tính!
    echo Vui lòng cài đặt Node.js từ https://nodejs.org/ rồi thử lại.
    pause
    exit /b
)

if not exist "node_modules" (
    echo [*] Đang cài đặt thư viện cần thiết (npm install)...
    call npm install
)

if not exist "dist\public\index.html" (
    echo [*] Đang build giao diện web và server...
    call npm run build
)

echo [*] Đang khởi động EZDQ Web Server trên cổng 3000...
start "" http://localhost:3000
npm start
