param(
    [string]$Action = "start"
)

$LibreChatPath = "D:\projects\LibreChat"
Set-Location $LibreChatPath

$env:UID=1000
$env:GID=1000
$env:PORT=3080

switch ($Action.ToLower()) {
    "start" {
        Write-Host "Starting LibreChat..." -ForegroundColor Green
        docker compose up -d
        Start-Sleep -Seconds 5
        Start-Process "http://localhost:3080"
    }
    "stop" {
        Write-Host "Stopping LibreChat..." -ForegroundColor Yellow
        docker compose down
    }
    "restart" {
        Write-Host "Restarting LibreChat..." -ForegroundColor Blue
        docker compose down
        docker compose up -d
        Start-Sleep -Seconds 5
        Start-Process "http://localhost:3080"
    }
    "status" {
        docker compose ps
    }
    "logs" {
        docker compose logs -f api
    }
    default {
        Write-Host "Usage: .\librechat-manager.ps1 -Action [start|stop|restart|status|logs]"
    }
}