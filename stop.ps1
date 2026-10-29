# FinPulse Enterprise Stack Stopper
Write-Host "Stopping FinPulse services..." -ForegroundColor Yellow

# Terminate node processes running from FinPulse directory
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*node*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

# Terminate isolated mysqld on port 3308
Get-NetTCPConnection -LocalPort 3308 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

# Terminate port 5000 and 4200 listeners
Get-NetTCPConnection -LocalPort 5000, 4200 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

Write-Host "All FinPulse services stopped successfully." -ForegroundColor Green
