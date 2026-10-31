param([string]$Root = "")
$ErrorActionPreference = "Stop"

# Aggiorna il codice dalla versione comune e mantiene anche le canzoni
# registrate SOLO nel catalogo del PC. Non tocca i file audio o i dati personali.
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$Root = if ($Root) { $Root } else { (Get-Location).Path }
$NL = [Environment]::NewLine
$Required = @("index.html", "app.js")
foreach ($Name in $Required) {
    if (-not (Test-Path (Join-Path $Root $Name) -PathType Leaf)) {
        throw "Cartella sbagliata: apri PowerShell nella cartella /app che contiene index.html e app.js. Cartella attuale: $Root"
    }
}

function Get-TrackEntries([string]$Source) {
    $Start = $Source.IndexOf("const BUILTIN = [")
    if ($Start -lt 0) { return @() }
    $End = $Source.IndexOf("];", $Start)
    if ($End -lt 0) { return @() }
    $Block = $Source.Substring($Start, $End - $Start)
    # Togli le voci di esempio/commentate: non devono diventare brani reali.
    $Block = [regex]::Replace($Block, '(?s)/\*.*?\*/', '')
    $Block = [regex]::Replace($Block, '(?m)^\s*//.*(?:\r?\n|$)', '')
    # Prendo tutti i file MP3 in songs/ e conservo le proprietà dopo artist.
    $Pattern = '\{\s*title:\s*"((?:[^"\\]|\\.)*)",\s*file:\s*"(songs/[^"]+?\.mp3)",\s*artist:\s*"((?:[^"\\]|\\.)*)"([^}]*)\}'
    $Found = [regex]::Matches($Block, $Pattern)
    $Items = New-Object System.Collections.Generic.List[object]
    foreach ($Match in $Found) {
        $Tail = $Match.Groups[4].Value
        $ProfileMatch = [regex]::Match($Tail, 'profile:\s*"((?:[^"\\]|\\.)*)"')
        $Profile = $ProfileMatch.Groups[1].Value
        if ([string]::IsNullOrWhiteSpace($Profile)) { $Profile = "Ste" }
        $Items.Add([pscustomobject]@{
            Text = $Match.Value
            Key = ($Profile + "|" + $Match.Groups[2].Value)
        })
    }
    return $Items.ToArray()
}

$Base = "https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box/main"
$Files = @("index.html", "app.js", "fuoco.js", "style.css", "sw.js", "versione.json", "karaoke-index.json", "karaoke-scan-state.json")
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

        if (-not (Test-Path $Destination -PathType Leaf) -or (Get-Item $Destination).Length -lt $(if ($Name -match "\.json$") { 2 } else { 40 })) {
            throw ("File scaricato incompleto: " + $Name)
        }
    }

    # Unisci gli ID karaoke pubblicati con quelli gia' recuperati sul PC:
    # nessun testo utente, profilo o MP3 viene sostituito.
    foreach ($JsonName in @("karaoke-index.json", "karaoke-scan-state.json")) {
        $JsonRemote = Join-Path $Stage $JsonName
        $JsonLocal = Join-Path $Root $JsonName
        $RemoteObj = Get-Content -LiteralPath $JsonRemote -Raw | ConvertFrom-Json
        $Merged = [ordered]@{}
        if (Test-Path -LiteralPath $JsonLocal -PathType Leaf) {
            $LocalObj = Get-Content -LiteralPath $JsonLocal -Raw | ConvertFrom-Json
            foreach ($Entry in $LocalObj.PSObject.Properties) {
                $Merged[$Entry.Name] = $Entry.Value
            }
        }
        foreach ($Entry in $RemoteObj.PSObject.Properties) {
            if (-not $Merged.Contains($Entry.Name)) {
                $Merged[$Entry.Name] = $Entry.Value
            }
        }
        $JSON = ConvertTo-Json -InputObject $Merged -Depth 20
        [IO.File]::WriteAllText($JsonRemote, $JSON + $NL, [Text.UTF8Encoding]::new($false))
    }

    $AppPath = Join-Path $Stage "app.js"
    $AppSource = Get-Content $AppPath -Raw
    $VersionPath = Join-Path $Stage "versione.json"
    $VersionInfo = Get-Content $VersionPath -Raw | ConvertFrom-Json
    $VersionMatch = [regex]::Match($AppSource, 'const APP_VERSION = "([^"]+)"')
    if (-not $VersionMatch.Success -or $VersionMatch.Groups[1].Value -ne [string]$VersionInfo.versione) {
        throw "Le versioni di app.js e versione.json non coincidono. Non ho sostituito i file."
    }

    # Unisco il catalogo remoto con quello già presente sul PC.
    # Le voci remote vincono se lo stesso profilo/file esiste in entrambe le copie;
    # le canzoni solo locali vengono conservate.
    $RemoteEntries = @(Get-TrackEntries $AppSource)
    $LocalSource = Get-Content (Join-Path $Root "app.js") -Raw
    $LocalEntries = @(Get-TrackEntries $LocalSource)
    if ($RemoteEntries.Count -eq 0) {
        throw "Non riesco a leggere il catalogo dei brani dal codice nuovo. Non ho sostituito i file."
    }

    $Seen = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
    $Combined = New-Object System.Collections.Generic.List[string]
    foreach ($Entry in (@($RemoteEntries) + @($LocalEntries))) {
        if ($Seen.Add([string]$Entry.Key)) { $Combined.Add([string]$Entry.Text) }
    }

    $CatalogStart = $AppSource.IndexOf("const BUILTIN = [")
    $CatalogEnd = $AppSource.IndexOf("];", $CatalogStart)
    if ($CatalogStart -lt 0 -or $CatalogEnd -lt 0) {
        throw "Non riesco a trovare il catalogo nel codice nuovo. Non ho sostituito i file."
    }
    $NewCatalog = "const BUILTIN = [" + $NL + "  " + ($Combined -join ("," + $NL + "  ")) + $NL + "  ];"
    $AppSource = $AppSource.Substring(0, $CatalogStart) + $NewCatalog + $AppSource.Substring($CatalogEnd + 2)
    [System.IO.File]::WriteAllText($AppPath, $AppSource, [System.Text.UTF8Encoding]::new($false))

    # Il contatore include le canzoni conservate dal catalogo locale,
    # così l'app le rileva appena si riapre.
    $VersionInfo.brani = $Combined.Count
    $VersionInfo.aggiornato = [DateTime]::UtcNow.ToString("o")
    $VersionContent = ($VersionInfo | ConvertTo-Json -Depth 10) + $NL
    [System.IO.File]::WriteAllText($VersionPath, $VersionContent, [System.Text.UTF8Encoding]::new($false))

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
    $LocalOnly = $Combined.Count - $RemoteEntries.Count
    Write-Host ""
    Write-Host ("Music Box aggiornato alla versione " + $VersionInfo.versione) -ForegroundColor Green
    Write-Host ("Catalogo finale: " + $Combined.Count + " brani; voci conservate solo dal PC: " + $LocalOnly)
    Write-Host ("Backup dei file precedenti: " + $Backup)
    Write-Host "Aggiornati anche gli ID karaoke senza cancellare quelli gia' recuperati." 
    Write-Host "Non ho modificato songs/, playlist.json, covers.json, lyrics.json, stato.json o altri dati personali."
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
