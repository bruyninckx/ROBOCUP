@echo off
rem Fame simulations on your own PC (Windows). Run from the ROBOCUS folder:  tools\run-sims.cmd [games] [parallel]
rem Needs Node + "npm install" + "npx playwright install chromium" once (see README).
setlocal
set GAMES=%1
if "%GAMES%"=="" set GAMES=200
set PAR=%2
if "%PAR%"=="" set PAR=%NUMBER_OF_PROCESSORS%
echo %GAMES% games per setting, %PAR% at a time
node tools\game-sim.js --tag=start4_win12 --games=%GAMES% --par=%PAR% --start=4 --win=12
node tools\game-sim.js --tag=start1_win12 --games=%GAMES% --par=%PAR% --start=1 --win=12
node tools\game-sim.js --tag=start4_win16 --games=%GAMES% --par=%PAR% --start=4 --win=16
node tools\game-sim.js --tag=start1_win16 --games=%GAMES% --par=%PAR% --start=1 --win=16
node tools\game-sim-report.js start4_win12 start1_win12 start4_win16 start1_win16 > sims\report.txt
type sims\report.txt
echo.
echo Saved: sims\report.txt  (send it to Claude, or the sims folder)
