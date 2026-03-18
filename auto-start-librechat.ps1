# 检查 Docker Desktop 是否运行
$dockerProcess = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
if (-not $dockerProcess) {
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    Start-Sleep -Seconds 30  # 等待 Docker 启动
}

# 启动 LibreChat
Set-Location "D:\projects\LibreChat"
$env:UID=1000; $env:GID=1000; $env:PORT=3080
docker compose up -d