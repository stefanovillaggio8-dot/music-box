# Ripristina la copia privata sul PC senza caricare o sostituire i file MP3.
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File ripara-musicbox-pc.ps1 -Root "C:\...\music-box"
param([string]$Root = "")
$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

if ([string]::IsNullOrWhiteSpace($Root)) { $Root = (Get-Location).Path }
$Root = [IO.Path]::GetFullPath($Root)
if (-not (Test-Path -LiteralPath (Join-Path $Root "app.js") -PathType Leaf) -or
    -not (Test-Path -LiteralPath (Join-Path $Root "songs") -PathType Container)) {
  throw "Cartella non valida: $Root. Deve contenere app.js e la cartella songs."
}
Write-Host ("Music Box sul PC: " + $Root) -ForegroundColor Cyan

# Esegui sempre la revisione piu' recente della procedura di aggiornamento:
# l'app e i metadati karaoke vengono salvati prima, i file audio sono intoccabili.
$Updater = Join-Path $env:TEMP "musicbox-aggiorna-copia-privata.ps1"
$Url = "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box/main/tools/aggiorna-copia-locale.ps1"
Invoke-WebRequest -Uri ($Url+"?refresh="+[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()) -OutFile $Updater -UseBasicParsing -TimeoutSec 60
& $Updater -Root $Root
if (-not $?) { throw "Aggiornamento locale non riuscito." }

# Carica il catalogo dei soli percorsi assenti da GitHub.
$Index = Join-Path $Root "audio-github-missing.json"
$ManifestUrl="https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box/main/audio-github-missing.json"
Invoke-WebRequest -Uri ($ManifestUrl+"?refresh="+[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()) -OutFile $Index -UseBasicParsing -TimeoutSec 60
$Catalog = Get-Content -LiteralPath $Index -Raw | ConvertFrom-Json
$Missing = New-Object System.Collections.Generic.List[string]
$Found = 0
foreach ($Entry in $Catalog.missing) {
    $Rel = [string]$Entry.file
    if ($Rel -notmatch '^songs/[A-Za-z0-9_.-]+\.mp3$') {
        throw "Nome file non previsto nel catalogo: $Rel"
    }
    $File = Join-Path $Root ($Rel.Replace("/", [IO.Path]::DirectorySeparatorChar))
    if (Test-Path -LiteralPath $File -PathType Leaf) {
        if ((Get-Item -LiteralPath $File).Length -gt 4096) { $Found++; continue }
    }
    $Missing.Add($Rel)
}
$Summary = [ordered]@{
  checkedAt = (Get-Date).ToString("o")
  version = (Get-Content (Join-Path $Root "versione.json") -Raw | ConvertFrom-Json).versione
  audioAbsentFromPublicGitHub = @($Catalog.missing).Count
  audioPresentOnPC = $Found
  audioMissingOnPC = $Missing.Count
  missingNames = @($Missing.ToArray())
}
$Summary | ConvertTo-Json -Depth 8 |
    Set-Content -LiteralPath (Join-Path $Root "audio-local-check.json") -Encoding UTF8
Write-Host ""
Write-Host ("VERSIONE: " + $Summary.version) -ForegroundColor Green
Write-Host ("MP3 mancanti su GitHub ma PRESENTI sul PC: " + $Found) -ForegroundColor Green
Write-Host ("MP3 mancanti anche sul PC: " + $Missing.Count) -ForegroundColor $(if ($Missing.Count -eq 0) {"Green"} else {"Yellow"})
Write-Host "Il controllo verifica presenza e dimensione, non identita' esatta del brano."

# Individua l'indirizzo del server musicale gia' avviato.
$Links = @(
  "http://127.0.0.1:8788/app/",
  "http://127.0.0.1:8167/music-box/",
  "http://127.0.0.1:8167/app/"
)
$Usable = ""
foreach($Link in $Links) {
    try {
      $Request = [Net.HttpWebRequest]::Create($Link + "index.html")
      $Request.Method="GET"
      $Request.Timeout=1600
      $Response=$Request.GetResponse()
      $Type=[string]$Response.ContentType
      $Response.Close()
      if($Type -match 'html'){ $Usable=$Link; break }
    } catch { }
}
if ($Usable) {
    Write-Host ("App locale rilevata: " + $Usable) -ForegroundColor Green
    Write-Host "Qui gli MP3 vengono letti dalla cartella songs sul PC, non da GitHub."
} else {
    Write-Host "Nessun server Music Box attivo sulle porte 8788/8167 rilevato."
    Write-Host "Avvia il server musicale gia' configurato sul PC per ascoltare la copia privata."
}
Write-Host "Lettura file completata. Nessun MP3 e' stato caricato su internet."
