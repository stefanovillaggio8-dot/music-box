@echo off
setlocal
title Music Box - Discord Rich Presence
cd /d "%~dp0.."
where node >nul 2>&1
if errorlevel 1 (
 echo Installa Node.js LTS da https://nodejs.org e riprova.
 pause
 exit /b 1
)
echo Tieni Discord Desktop aperto e ascolta da Music Box.
echo Lascia questa finestra aperta per mostrare lo stato.
node tools\discord-presence-bridge.cjs
pause
