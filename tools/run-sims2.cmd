@echo off
rem ROBOCUS 2.0 balance overhaul, round 1: the baseline plus every variant in tools\bal\*.json.
rem Run from the ROBOCUS folder:   tools\run-sims2.cmd [games] [parallel]
rem   games    games per variant (default 100)
rem   parallel games at once (default: your number of CPU cores; try a few less if the PC gets sluggish)
rem Needs once: Node.js, then "npm install" and "npx playwright install chromium" in this folder.
rem Results: sims\overhaul1.txt (send it to Claude) and sims\o1_*.json (zip the sims folder if Claude asks for details).
setlocal enabledelayedexpansion
set GAMES=%1
if "%GAMES%"=="" set GAMES=100
set PAR=%2
if "%PAR%"=="" set PAR=%NUMBER_OF_PROCESSORS%
echo %GAMES% games per variant, %PAR% at a time
set TAGS=o1_base
node tools\game-sim.js --page=prototypes/tabletop-2.html --tag=o1_base --games=%GAMES% --par=%PAR%
for %%F in (tools\bal\*.json) do (
  echo.
  echo === %%~nF ===
  node tools\game-sim.js --page=prototypes/tabletop-2.html --tag=o1_%%~nF --games=%GAMES% --par=%PAR% --balFile=%%F
  set TAGS=!TAGS! o1_%%~nF
)
node tools\game-sim-report.js %TAGS% > sims\overhaul1.txt
type sims\overhaul1.txt
echo.
echo Saved: sims\overhaul1.txt  (send it to Claude)
