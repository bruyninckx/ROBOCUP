@echo off
rem ROBOCUS 2.0: the overnight test. Start it before you go to bed, the night before a game night.
rem  1. Many online games played with real mouse clicks on all four screens (host + 3 joined), added up: stuck steps,
rem     page errors, broken numbers, screens out of step, anything only the host seat or only the joined seats ever get,
rem     and COVERAGE: what never happened in any game. A mix of games: watched fights with live cards, cards dealt every
rem     step, long games nobody can win (the late game), page reloads and slow connections, every screen its own size.
rem  2. The fixed checks: every card dragged on a host and a joined screen, the reaction window, the logs, a bot game,
rem     and 300 fights compared in every browser engine installed.
rem Run from the ROBOCUS folder (or double-click this file):   tools\click-night.cmd [games] [minutes] [parallel]
rem   games    how many click games (default 60)
rem   minutes  minutes per game at most (default 12; most games end sooner, the long ones run the full time)
rem   parallel games at once (default: a quarter of your CPU cores, 2 to 8; a game is four browser tabs)
rem Needs once: Node.js, then "npm install" and "npx playwright install chromium" in this folder.
rem   For the fights in Firefox and Safari's engine too:  npx playwright install firefox webkit
rem Results, in playtests\click-runs\ (tell Claude "read the click summary"):
rem   latest-summary.txt  the click games       latest-checks.txt  the fixed checks
rem   <date_time>\        each game's text, findings and screenshots
setlocal
cd /d "%~dp0.."
set GAMES=%1
if "%GAMES%"=="" set GAMES=60
set MINS=%2
if "%MINS%"=="" set MINS=12
set PAR=%3
if "%PAR%"=="" set PAR=0
node tools\mp-scenario\click-many.js %GAMES% %MINS% 0 %PAR%
echo.
echo === The fixed checks ===
node tools\mp-scenario\checks.js
echo.
echo Done. Results: playtests\click-runs\latest-summary.txt and latest-checks.txt
pause
