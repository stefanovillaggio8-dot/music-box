# Verifica i brani presenti sul PC, senza scaricare, rinominare o cancellare file.
# Esempio: powershell -ExecutionPolicy Bypass -File .\tools\verifica-audio-sul-pc.ps1 -AppRoot "D:\MusicBox\app"
param([string]$AppRoot = "")
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($AppRoot)) {
  $AppRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}
if (-not (Test-Path -LiteralPath (Join-Path $AppRoot "app.js") -PathType Leaf)) {
  throw "Non trovo app.js in $AppRoot. Specifica -AppRoot con la cartella dell'app sul PC."
}

$manifestFile = Join-Path $AppRoot "audio-github-missing.json"
if (Test-Path -LiteralPath $manifestFile) {
  $manifest = Get-Content -LiteralPath $manifestFile -Raw | ConvertFrom-Json
} else {
  $url = "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box/main/audio-github-missing.json"
  $manifest = Invoke-RestMethod -Uri $url -TimeoutSec 30
}
$found = New-Object System.Collections.Generic.List[object]
$missing = New-Object System.Collections.Generic.List[object]
foreach ($item in $manifest.missing) {
  $relative = [string]$item.file
  $local = Join-Path $AppRoot ($relative.Replace("/", [IO.Path]::DirectorySeparatorChar))
  if ((Test-Path -LiteralPath $local -PathType Leaf) -and
      (Get-Item -LiteralPath $local).Length -gt 4096) {
    $found.Add([pscustomobject]@{ profile=$item.profile; file=$relative; localPath=$local })
  } else {
    $missing.Add([pscustomobject]@{ profile=$item.profile; file=$relative; localPath=$local })
  }
}
$summary = [ordered]@{
  checkedAt = (Get-Date).ToString("o")
  root = $AppRoot
  githubMissing = @($manifest.missing).Count
  availableLocally = $found.Count
  missingLocally = $missing.Count
  missingFiles = @($missing.ToArray())
}
$out = Join-Path $AppRoot "audio-local-check.json"
$summary | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $out -Encoding UTF8
Write-Host ("Brani non pubblicati su GitHub: " + $summary.githubMissing)
Write-Host ("Trovati nella cartella Music Box del PC: " + $summary.availableLocally)
Write-Host ("Mancanti anche sul PC (in questa cartella): " + $summary.missingLocally)
Write-Host ("Report salvato in: " + $out)
Write-Host "Nessun file audio e' stato modificato."
