$ErrorActionPreference = "Stop"

# Aggiorna solo i file del programma. Non modifica songs/, playlist.json,
# covers.json, lyrics.json, stato.json o altri dati personali.
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$Root = (Get-Location).Path
$Required = @("index.html", "app.js")
foreach ($Name in $Required) {
    if (-not (Test-Path (Join-Path $Root $Name) -PathType Leaf)) {
        throw "Cartella sbagliata: apri PowerShell nella cartella /app che contiene index.html e app.js. Cartella attuale: $Root"
    }
}

$Base = "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box/main"
$Files = @("index.html", "app.js", "fuoco.js", "style.css", "sw.js", "versione.json")
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Stage = Join-Path $Root (".musicbox-update-" + $Stamp)
$Backup = Join-Path $Root (".musicbox-backup-" + $Stamp)
$BackupComplete = $false
$Replacing = $false
$UpdateComplete = $false
New-Item -ItemType Directory -Path $Stage | Out-Null

try {
    foreach ($Name in $Files) {
        $Uri = $Base + "/" + $Name + "?refresh=" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        $Destination = Join-Path $Stage $Name
        Write-Host ("Scarico " + $Name + "...")
        Invoke-WebRequest -Uri $Uri -OutFile $Destination -TimeoutSec 45

        if (-not (Test-Path $Destination -PathType Leaf) -or (Get-Item $Destination).Length -lt 40) {
            throw ("File scaricato incompleto: " + $Name)
        }
    }

    $VersionInfo = Get-Content (Join-Path $Stage "versione.json") -Raw | ConvertFrom-Json
    $AppSource = Get-Content (Join-Path $Stage "app.js") -Raw
    $VersionMatch = [regex]::Match($AppSource, 'const APP_VERSION = "([^"]+)"')
    if (-not $VersionMatch.Success -or $VersionMatch.Groups[1].Value -ne [string]$VersionInfo.versione) {
        throw "Le versioni di app.js e versione.json non coincidono. Non ho sostituito i file."
    }

    New-Item -ItemType Directory -Path $Backup | Out-Null
    foreach ($Name in $Files) {
        $Old = Join-Path $Root $Name
        if (Test-Path $Old -PathType Leaf) {
            Copy-Item -LiteralPath $Old -Destination (Join-Path $Backup $Name)
        }
    }
    $BackupComplete = $true

    $Replacing = $true
    foreach ($Name in $Files) {
        Move-Item -LiteralPath (Join-Path $Stage $Name) -Destination (Join-Path $Root $Name) -Force
    }

    $UpdateComplete = $true
    Write-Host ""
    Write-Host ("Music Box aggiornato alla versione " + $VersionInfo.versione) -ForegroundColor Green
    Write-Host ("Backup dei file precedenti: " + $Backup)
    Write-Host "Non ho modificato brani, playlist, copertine o dati personali."
    Write-Host "Ora ricarica la pagina /app/ con Ctrl+F5."
}
catch {
    if ($BackupComplete -and $Replacing -and -not $UpdateComplete) {
        foreach ($Name in $Files) {
            $Target = Join-Path $Root $Name
            $Saved = Join-Path $Backup $Name
            if (Test-Path $Saved -PathType Leaf) {
                Copy-Item -LiteralPath $Saved -Destination $Target -Force
            } elseif (Test-Path $Target -PathType Leaf) {
                Remove-Item -LiteralPath $Target -Force
            }
        }
    }
    throw ("Aggiornamento annullato: " + $_.Exception.Message + ". Se la sostituzione era già iniziata, ho ripristinato i file dal backup.")
}
finally {
    if (Test-Path $Stage) {
        Remove-Item -LiteralPath $Stage -Recurse -Force -ErrorAction SilentlyContinue
    }
}
