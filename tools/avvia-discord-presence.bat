@echo off
setlocal
title Music Box - Discord in background (installazione una volta)
where powershell >nul 2>&1
if errorlevel 1 (
 echo PowerShell non trovato.
 pause
 exit /b 1
)
set "BASE=%LOCALAPPDATA%\MusicBox\Discord"
if not exist "%BASE%" mkdir "%BASE%"
set "INSTALL=%BASE%\install-discord-presence.ps1"
echo Preparo avvio automatico nascosto Discord per Music Box...
powershell -NoProfile -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -UseBasicParsing -Uri 'https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box/main/tools/install-discord-presence.ps1' -OutFile '%INSTALL%' -TimeoutSec 30"
if errorlevel 1 (
 echo Impossibile scaricare l'installer dal progetto Music Box.
 pause
 exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%INSTALL%"
if errorlevel 1 (
 echo Installazione non riuscita. Leggi l'errore sopra.
 pause
 exit /b 1
)
echo.
echo Fatto! Il ponte funziona in background e si avvia con Windows.
echo Puoi chiudere questa finestra: non serve tenerla aperta.
timeout /t 6 >nul
exit /b 0
