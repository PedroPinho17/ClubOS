# Regenera PNGs UML a partir dos ficheiros PlantUML (via Kroki).
# Uso: pwsh docs/analise/render-diagrams.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$plantumlDir = Join-Path $root "plantuml"
$outDir = Join-Path $root "diagrams"

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Get-ChildItem $plantumlDir -Filter *.puml | ForEach-Object {
  $out = Join-Path $outDir ($_.BaseName + ".png")
  Write-Host "Rendering $($_.Name) -> diagrams/$($_.BaseName).png"
  Invoke-RestMethod `
    -Uri "https://kroki.io/plantuml/png" `
    -Method Post `
    -ContentType "text/plain; charset=utf-8" `
    -InFile $_.FullName `
    -OutFile $out
}

Write-Host "Done. PNGs in $outDir"
