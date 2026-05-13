$ErrorActionPreference = "Stop"

Write-Host "Starting LFI Dashboard development environment..." -ForegroundColor Cyan

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker was not found on this computer." -ForegroundColor Red
    Write-Host "Install Docker Desktop, then run this script again." -ForegroundColor Yellow
    Write-Host "Download: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

docker compose up --build
