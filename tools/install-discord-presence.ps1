# Music Box / Discord Rich Presence
# One-time per-user installer: hidden background bridge at Windows login.
param([switch]$Remove)
$ErrorActionPreference = "Stop"
$base = Join-Path $env:LOCALAPPDATA "MusicBox\Discord"
$scriptPath = Join-Path $base "discord-presence-bridge.cjs"
$startupFolder = [Environment]::GetFolderPath([Environment+SpecialFolder]::Startup)
$startupFile = Join-Path $startupFolder "MusicBox Discord Presence.vbs"
$sourceUrl = "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box/main/tools/discord-presence-bridge.cjs"

function Stop-MusicBoxBridges {
  # Restrict termination to node.exe processes running our specific bridge.
  try {
    Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction Stop |
      Where-Object { $_.CommandLine -and $_.CommandLine -match 'discord-presence-bridge[.]cjs' } |
      ForEach-Object {
        try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop }
        catch { Write-Host "Non posso chiudere il vecchio ponte $($_.ProcessId)." }
      }
  } catch { Write-Host "Controllo vecchi ponti non disponibile." }
}

if ($Remove) {
  if (Test-Path $startupFile) { Remove-Item $startupFile -Force }
  Stop-MusicBoxBridges
  Write-Host "Avvio automatico Discord Music Box rimosso."
  exit 0
}

if (-not $startupFolder -or -not (Test-Path $startupFolder)) {
  throw "Cartella Esecuzione automatica di Windows non trovata."
}
$nodeCmd = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $nodeCmd) { throw "Node.js non trovato: installa Node.js LTS da nodejs.org." }
$nodePath = $nodeCmd.Source
New-Item -ItemType Directory -Path $base -Force | Out-Null
$tempScript = Join-Path $base ("discord-presence-" + [Guid]::NewGuid().ToString("N") + ".tmp.cjs")
try {
  Write-Host "Aggiorno il ponte Discord dal repository Music Box..."
  Invoke-WebRequest -UseBasicParsing -Uri $sourceUrl -OutFile $tempScript -TimeoutSec 30
  & $nodePath --check $tempScript
  if ($LASTEXITCODE -ne 0) { throw "Il ponte scaricato non supera il controllo JavaScript." }
  Stop-MusicBoxBridges
  Move-Item -Path $tempScript -Destination $scriptPath -Force
} finally {
  if (Test-Path $tempScript) { Remove-Item $tempScript -Force }
}
# VBScript windowStyle 0 hides the node.exe console window.
$commandLine = ('"' + $nodePath + '" "' + $scriptPath + '"')
$nl = [Environment]::NewLine
$vbs = 'Set sh = CreateObject("WScript.Shell")' + $nl +
  'sh.Run "' + $commandLine.Replace('"','""') + '", 0, False' + $nl
[System.IO.File]::WriteAllText($startupFile, $vbs, ([System.Text.Encoding]::Unicode))
Write-Host "Avvio automatico nascosto attivato per questo utente Windows."
Start-Process -FilePath (Join-Path $env:WINDIR "System32\wscript.exe") -ArgumentList ('"' + $startupFile + '"') -WindowStyle Hidden
Start-Sleep -Milliseconds 1300
try {
  $probe = Invoke-RestMethod -Uri "http://127.0.0.1:8792/health" -TimeoutSec 2 -ErrorAction Stop
  if (-not $probe.ok) { throw "Risposta inaspettata" }
  Write-Host "Ponte Discord in background attivo (nessuna finestra da tenere aperta)."
} catch {
  Write-Warning "Il ponte e stato configurato, ma non risponde ancora. Apri Music Box e Discord Desktop."
}
Write-Host "Si avviera automaticamente ad ogni accesso a Windows."
