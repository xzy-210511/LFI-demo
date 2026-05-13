$ErrorActionPreference = "Stop"

Write-Host "Stopping LFI Dashboard development environment..." -ForegroundColor Cyan
docker compose down
