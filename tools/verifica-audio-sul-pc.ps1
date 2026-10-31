# Verifica i brani presenti sul PC, senza scaricare, rinominare o cancellare file.
# Esempio: powershell -ExecutionPolicy Bypass -File .\tools\verifica-audio-sul-pc.ps1 -AppRoot "D:\MusicBox\app"
param([string]$AppRoot = "")
$ErrorActionPreference = "Stop"

# Se la console e' stata aperta da C:\ o lo script e' in Temp, trova
# automaticamente la copia dell'app che contiene piu' MP3.
if ([string]::IsNullOrWhiteSpace($AppRoot) -or
    -not (Test-Path -LiteralPath (Join-Path $AppRoot "app.js") -PathType Leaf)) {
  Write-Host "Cerco automaticamente la cartella Music Box sul PC..."
  $queue = New-Object 'System.Collections.Generic.Queue[string]'
  $seen = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
  $roots = @(
    (Join-Path $env:USERPROFILE "Desktop"),
    (Join-Path $env:USERPROFILE "Documents"),
    (Join-Path $env:USERPROFILE "Downloads"),
    (Join-Path $env:USERPROFILE "OneDrive"),
    $env:USERPROFILE,
    "D:\",
    "C:\music-box",
    "C:\MusicBox",
    "C:\Music Box"
  )
  foreach ($root in $roots) {
    if (Test-Path -LiteralPath $root -PathType Container) { $queue.Enqueue($root) }
  }
  $bestPath = ""
  $bestScore = -1
  $scanned = 0
  $skipped = '^(AppData|node_modules|\.git|\.venv|venv|__pycache__|\.next|\.cache|Temp|Caches|Cache|\$RECYCLE\.BIN|System Volume Information)$'
  while ($queue.Count -gt 0 -and $scanned -lt 16000) {
    $dir = $queue.Dequeue()
    if (-not $seen.Add($dir)) { continue }
    $scanned++
    $app = Join-Path $dir "app.js"
    if (Test-Path -LiteralPath $app -PathType Leaf) {
      $songsPath = Join-Path $dir "songs"
      $nAudio = 0
      if (Test-Path -LiteralPath $songsPath -PathType Container) {
        $nAudio = @(Get-ChildItem -LiteralPath $songsPath -File -Filter "*.mp3" -ErrorAction SilentlyContinue).Count
      }
      $score = $nAudio
      if (Test-Path -LiteralPath (Join-Path $dir "index.html") -PathType Leaf) { $score += 10 }
      if ($dir -match '(?i)music.?box') { $score += 20 }
      if ($score -gt $bestScore) { $bestScore=$score; $bestPath=$dir }
      if ($nAudio -ge 500) { break }
    }
    try {
      $children = @(Get-ChildItem -LiteralPath $dir -Directory -Force -ErrorAction SilentlyContinue)
      foreach ($child in $children) {
        if ($child.Name -notmatch $skipped) { $queue.Enqueue($child.FullName) }
      }
    } catch { }
  }
  if (-not $bestPath) {
    throw "Non ho trovato la cartella dell'app. Apri Esplora file, cerca app.js e copia qui il percorso completo."
  }
  $AppRoot=$bestPath
  Write-Host ("Cartella Music Box individuata: " + $AppRoot)
  Write-Host ("Cartelle controllate: " + $scanned)
}
if (-not (Test-Path -LiteralPath (Join-Path $AppRoot "app.js") -PathType Leaf)) {
  throw "Non trovo app.js in $AppRoot."
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
