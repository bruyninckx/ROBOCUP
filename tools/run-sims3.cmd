@echo off
rem ROBOCUS 2.0 balance overhaul, round 2: every variant in tools\bal2\*.json (base.json = the new defaults, level 4 on).
rem Run from the ROBOCUS folder:   tools\run-sims3.cmd [games] [parallel]
rem   games    games per variant (default 100)
rem   parallel games at once (default: your number of CPU cores; try a few less if the PC gets sluggish)
rem Needs once: Node.js, then "npm install" and "npx playwright install chromium" in this folder.
rem Results: sims\overhaul2.txt (send it to Claude) and sims\o2_*.json (zip the sims folder if Claude asks for details).
setlocal enabledelayedexpansion
set GAMES=%1
if "%GAMES%"=="" set GAMES=100
set PAR=%2
if "%PAR%"=="" set PAR=%NUMBER_OF_PROCESSORS%
echo %GAMES% games per variant, %PAR% at a time
set TAGS=
for %%F in (tools\bal2\*.json) do (
  echo.
  echo === %%~nF ===
  node tools\game-sim.js --page=prototypes/tabletop-2.html --tag=o2_%%~nF --games=%GAMES% --par=%PAR% --balFile=%%F
  set TAGS=!TAGS! o2_%%~nF
)
node tools\game-sim-report.js %TAGS% > sims\overhaul2.txt
type sims\overhaul2.txt
echo.
echo Saved: sims\overhaul2.txt  (send it to Claude)
