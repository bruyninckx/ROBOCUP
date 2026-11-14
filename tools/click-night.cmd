@echo off
rem ROBOCUS 2.0: the overnight click test. Many online games played with real mouse clicks on all four screens
rem (host + 3 joined), added up: stuck steps, page errors, broken numbers, screens out of step, and anything only the
rem host seat or only the joined seats ever get. Start it before you go to bed, the night before a game night.
rem Run from the ROBOCUS folder (or double-click this file):   tools\click-night.cmd [games] [minutes] [parallel]
rem   games    how many games (default 30)
rem   minutes  minutes per game (default 15)
rem   parallel games at once (default: a quarter of your CPU cores, 2 to 8; a game is four browser tabs)
rem Needs once: Node.js, then "npm install" and "npx playwright install chromium" in this folder.
rem Results: playtests\click-runs\latest-summary.txt (send it to Claude, or just say "read the click summary").
rem          Each game's text, findings and screenshots are in playtests\click-runs\<date_time>\.
setlocal
cd /d "%~dp0.."
set GAMES=%1
if "%GAMES%"=="" set GAMES=30
set MINS=%2
if "%MINS%"=="" set MINS=15
set PAR=%3
if "%PAR%"=="" set PAR=0
node tools\mp-scenario\click-many.js %GAMES% %MINS% 0 %PAR%
echo.
echo Done. The summary is in playtests\click-runs\latest-summary.txt
pause
