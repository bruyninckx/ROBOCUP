@echo off
rem ROBOCUS 2.0 balance overhaul, round 7: crew = Mechanics only, every variant in tools\bal7\*.json (base.json = the current defaults).
rem Run from the ROBOCUS folder:   tools\run-sims7.cmd [games] [parallel]
rem   games    games per variant (default 100)
rem   parallel games at once (default: your number of CPU cores; try a few less if the PC gets sluggish)
rem Needs once: Node.js, then "npm install" and "npx playwright install chromium" in this folder.
rem Results: sims\round7.txt (send it to Claude) and sims\o7_*.json (zip the sims folder if Claude asks for details).
setlocal enabledelayedexpansion
set GAMES=%1
if "%GAMES%"=="" set GAMES=100
set PAR=%2
if "%PAR%"=="" set PAR=%NUMBER_OF_PROCESSORS%
echo %GAMES% games per variant, %PAR% at a time
set TAGS=
for %%F in (tools\bal7\*.json) do (
  echo.
  echo === %%~nF ===
  node tools\game-sim.js --page=prototypes/tabletop-2.html --tag=o7_%%~nF --games=%GAMES% --par=%PAR% --balFile=%%F
  set TAGS=!TAGS! o7_%%~nF
)
node tools\game-sim-report.js %TAGS% > sims\round7.txt
type sims\round7.txt
echo.
echo Saved: sims\round7.txt  (send it to Claude)
