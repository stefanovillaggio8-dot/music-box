@echo off
setlocal
title Music Box - Discord Rich Presence
where node >nul 2>&1
if errorlevel 1 (
 echo Node.js non trovato. Installa Node.js LTS da https://nodejs.org
 pause
 exit /b 1
)
set "SCRIPT=%~dp0discord-presence-bridge.cjs"
if not exist "%SCRIPT%" (
 set "SCRIPT=%LOCALAPPDATA%\MusicBox\Discord\discord-presence-bridge.cjs"
 if not exist "%LOCALAPPDATA%\MusicBox\Discord" mkdir "%LOCALAPPDATA%\MusicBox\Discord"
 echo Scarico il ponte Discord dal progetto ufficiale Music Box...
 powershell -NoProfile -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box/main/tools/discord-presence-bridge.cjs' -OutFile '%LOCALAPPDATA%\MusicBox\Discord\discord-presence-bridge.cjs'"
 if errorlevel 1 (
  echo Download fallito. Verifica la connessione.
  pause
  exit /b 1
 )
)
echo.
echo Ponte Music Box - Discord Desktop.
echo Lascia questa finestra aperta, apri Discord e ascolta una canzone.
node "%SCRIPT%"
echo.
echo Collegamento interrotto.
pause
