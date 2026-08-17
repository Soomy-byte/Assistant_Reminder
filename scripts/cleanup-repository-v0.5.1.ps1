$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$packagePath = Join-Path $projectRoot "package.json"

if (-not (Test-Path -LiteralPath $packagePath)) {
  throw "package.json tidak ditemukan. Jalankan script dari repository Assistant Reminder."
}

$package = Get-Content -LiteralPath $packagePath -Raw | ConvertFrom-Json

if ($package.name -ne "assistant-reminder") {
  throw "Pembersihan dibatalkan karena repository bukan assistant-reminder."
}

$obsoletePaths = @(
  "appdeploy-version",
  "build",
  "db",
  "drizzle",
  "examples",
  ".runtime-tmp",
  ".sites-runtime",
  ".next",
  "playwright-report",
  "test-results",
  "tsconfig.tsbuildinfo",
  "public/window.svg",
  "SETUP_WINDOWS_VSCODE.md",
  "PRD_Assistant_Reminder_v2.0.md",
  "PETUNJUK_ASSISTANT_REMINDER_v0.4.0.txt",
  "PETUNJUK_ASSISTANT_REMINDER_v0.5.0.txt"
)

foreach ($relativePath in $obsoletePaths) {
  $targetPath = Join-Path $projectRoot $relativePath

  if (Test-Path -LiteralPath $targetPath) {
    Remove-Item -LiteralPath $targetPath -Force -Recurse
    Write-Host "Dihapus: $relativePath"
  }
}

Write-Host "Repository v0.5.1 sudah bersih. .git, .env, node_modules, dan data Docker tidak diubah."
