@echo off
rem ROBOCUS: the two-PC online test, the HOST side. Real online games between two PCs on two networks, played by clicks.
rem Run tools\remote-host.cmd on this PC and tools\remote-join.cmd on the other one, with the SAME code, within ten
rem minutes of each other. Both load the game from the web address your friends use, so "git push" first.
rem   tools\remote-host.cmd [CODE] [games] [minutes] [players]     (defaults: asks for the code, 5 games, 15 minutes, 3 players)
rem Once on each PC: tools\remote-setup.cmd
rem Results: playtests\remote-runs\latest-remote-host.txt (tell Claude "read the remote test")
setlocal
cd /d "%~dp0.."
set CODE=%1
if "%CODE%"=="" set /p CODE=Code, the same on both PCs (a few letters, e.g. KEV): 
set GAMES=%2
if "%GAMES%"=="" set GAMES=5
set MINS=%3
if "%MINS%"=="" set MINS=15
set PLAYERS=%4
if "%PLAYERS%"=="" set PLAYERS=3
node tools\mp-scenario\remote.js host %CODE% %GAMES% %MINS% %PLAYERS%
echo.
pause
