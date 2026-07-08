# Backup PostgreSQL do ClubOS (formato custom pg_dump -Fc).
# Uso: .\scripts\backup-db.ps1 [-OutDir backups]

param(
  [string]$OutDir = "backups"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$OutPath = Join-Path $Root $OutDir
New-Item -ItemType Directory -Force -Path $OutPath | Out-Null

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$OutFile = Join-Path $OutPath "clubos-$Timestamp.dump"
$ContainerDump = "/tmp/clubos-backup-$Timestamp.dump"

$container = docker ps --filter "name=clubos-postgres" --format "{{.Names}}" 2>$null
if ($container -eq "clubos-postgres") {
  Write-Host "Backup via Docker (clubos-postgres) -> $OutFile"
  docker exec clubos-postgres pg_dump -U clubos -Fc --no-owner --no-acl -f $ContainerDump clubos
  docker cp "clubos-postgres:${ContainerDump}" $OutFile
  docker exec clubos-postgres rm -f $ContainerDump
}
elseif ($env:DATABASE_URL -and (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  Write-Host "Backup via pg_dump (DATABASE_URL) -> $OutFile"
  & pg_dump $env:DATABASE_URL -Fc --no-owner --no-acl -f $OutFile
}
else {
  Write-Error "Arranca o Postgres (pnpm docker:up) ou define DATABASE_URL com pg_dump no PATH."
}

$Size = (Get-Item $OutFile).Length
Write-Host "Backup concluido ($([math]::Round($Size / 1MB, 2)) MB): $OutFile"
Write-Host "Restore: pnpm db:restore -- $OutFile"
