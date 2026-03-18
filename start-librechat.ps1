# start-librechat.ps1
Set-Location "D:\projects\LibreChat"

# 设置环境变量（解决 UID/GID 警告）
$env:UID=1000
$env:GID=1000
$env:PORT=3080

# 启动服务
Write-Host "Starting LibreChat..." -ForegroundColor Green
docker compose up -d

# 等待服务启动
Start-Sleep -Seconds 5

# 检查服务状态
$status = docker compose ps --services --filter "status=running"
if ($status -contains "api") {
    Write-Host "LibreChat is running!" -ForegroundColor Green
    Write-Host "Opening browser..." -ForegroundColor Yellow
    Start-Process "http://localhost:3080"
} else {
    Write-Host "Failed to start LibreChat" -ForegroundColor Red
    docker compose logs api --tail=10
}