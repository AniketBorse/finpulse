# FinPulse Enterprise B2B SaaS Orchestration Launcher
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Starting FinPulse Enterprise Stack" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$baseDir = "C:\Users\User\Documents\AntiGravity\FinPulse"

# 1. Start MySQL 8.0 on Port 3308
$mysqlConn = Test-NetConnection -ComputerName 127.0.0.1 -Port 3308 -WarningAction SilentlyContinue
if (-not $mysqlConn.TcpTestSucceeded) {
    Write-Host "[1/3] Starting Isolated MySQL 8.0 Daemon on Port 3308..." -ForegroundColor Yellow
    Start-Process -FilePath "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" `
        -ArgumentList "--datadir=`"$baseDir\mysql_data`" --port=3308 --console" `
        -WindowStyle Hidden
    Start-Sleep -Seconds 3
} else {
    Write-Host "[1/3] MySQL 8.0 is already running on Port 3308." -ForegroundColor Green
}

# 2. Start Express Server on Port 5000
$serverConn = Test-NetConnection -ComputerName 127.0.0.1 -Port 5000 -WarningAction SilentlyContinue
if (-not $serverConn.TcpTestSucceeded) {
    Write-Host "[2/3] Starting Backend API on Port 5000..." -ForegroundColor Yellow
    Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c cd /d `"$baseDir\server`" && npx tsx watch src/index.ts" `
        -WindowStyle Hidden
    Start-Sleep -Seconds 3
} else {
    Write-Host "[2/3] Backend API is already running on Port 5000." -ForegroundColor Green
}

# 3. Start Angular Client on Port 4200
$clientConn = Test-NetConnection -ComputerName 127.0.0.1 -Port 4200 -WarningAction SilentlyContinue
if (-not $clientConn.TcpTestSucceeded) {
    Write-Host "[3/3] Starting Angular Web Application on Port 4200..." -ForegroundColor Yellow
    Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c cd /d `"$baseDir\client`" && npm start -- --port 4200 --host 0.0.0.0" `
        -WindowStyle Hidden
    Start-Sleep -Seconds 5
} else {
    Write-Host "[3/3] Angular Web Application is already running on Port 4200." -ForegroundColor Green
}

Write-Host "==================================================" -ForegroundColor Green
Write-Host " FinPulse Full Stack is LIVE!" -ForegroundColor Green
Write-Host " Web Application:  http://localhost:4200" -ForegroundColor Cyan
Write-Host " REST API Server:  http://localhost:5000/api/v1" -ForegroundColor Cyan
Write-Host " Health Check:     http://localhost:5000/api/health" -ForegroundColor Cyan
Write-Host " Default Currency: Indian Rupee (INR - ₹)" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Green
