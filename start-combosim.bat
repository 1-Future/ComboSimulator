@echo off
:: Start ComboSim server + Cloudflare tunnel on login
:: Place shortcut to this file in shell:startup

cd /d C:\Users\username\ComboSimulator

:: Start the server
start /min "ComboSim Server" node serve.js

:: Wait for server to start
timeout /t 3 /nobreak >nul

:: Start the tunnel
start /min "ComboSim Tunnel" "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel run combosim
