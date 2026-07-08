# Restaura backup PostgreSQL do ClubOS.
# Uso: .\scripts\restore-db.ps1 -DumpFile backups\clubos-YYYYMMDD-HHMMSS.dump
# ATENCAO: substitui dados da base clubos.

param(
  [Parameter(Mandatory = $true)]
  [string]$DumpFile
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $DumpFile)) {
  Write-Error "Ficheiro em falta: $DumpFile"
}

$ResolvedDump = (Resolve-Path $DumpFile).Path
$ContainerDump = "/tmp/clubos-restore.dump"

$container = docker ps --filter "name=clubos-postgres" --format "{{.Names}}" 2>$null
if ($container -eq "clubos-postgres") {
  Write-Host "A restaurar via Docker (clubos-postgres)..."
  docker cp $ResolvedDump "clubos-postgres:${ContainerDump}"
  docker exec clubos-postgres pg_restore -U clubos -d clubos --clean --if-exists --no-owner --no-acl $ContainerDump
  docker exec clubos-postgres rm -f $ContainerDump
}
elseif ($env:DATABASE_URL -and (Get-Command pg_restore -ErrorAction SilentlyContinue)) {
  Write-Host "A restaurar via pg_restore (DATABASE_URL)..."
  & pg_restore -d $env:DATABASE_URL --clean --if-exists --no-owner --no-acl $ResolvedDump
}
else {
  Write-Error "Arranca o Postgres (pnpm docker:up) ou define DATABASE_URL com pg_restore no PATH."
}

Write-Host "Restore concluido."
