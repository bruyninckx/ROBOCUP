@echo off
rem ROBOCUS: get the latest main from GitHub and open the game. Double-click it (Kev, 16 Nov 2026; local server 20 Nov).
rem   play-latest            update, then start a small game server on this PC and open the game from it
rem                          (http://127.0.0.1:8765/...: the bookie's test fights run in the background on all cores)
rem   play-latest online     update, then open the live GitHub Pages copy (what friends see)
rem   play-latest file       update, then open prototypes\tabletop-2.html as a file (the old way; slower bookie)
rem setlocal: the variables below stay in this window only
setlocal
cd /d "%~dp0"
echo Checking GitHub...
git fetch origin || (echo Could not reach GitHub. & pause & exit /b 1)
for /f %%b in ('git branch --show-current') do set BR=%%b
if not "%BR%"=="main" (
  echo This folder is on branch %BR%, not main. Switching to main...
  git switch main || (echo Could not switch to main: there are unsaved changes here. & git status --short & pause & exit /b 1)
)
git pull --ff-only origin main || (echo Could not update main: there are local changes or local commits. & git status --short & pause & exit /b 1)
for /f "delims=" %%h in ('git log -1 --format^="%%h %%cd" --date^=format:"%%d %%b %%H:%%M"') do set H=%%h
echo Up to date: main %H%
echo The game shows its files stamp bottom left. A red bar at the top means old files: press Ctrl+F5.

rem %~1 is the first word after play-latest, without quotes
if /i "%~1"=="online" goto online
if /i "%~1"=="file" goto file

rem ---- the default: a game server on this PC only ----
rem "where node" finds Node.js on the PATH (it is installed with nodejs.org's installer); errorlevel 0 = found
where node >nul 2>nul
if errorlevel 1 goto trypython
rem the window's title says what it is
title ROBOCUS game server - leave open while you play
rem tools\serve.js listens on 127.0.0.1 only (not the network), port 8765 or the next free one, and opens the game.
rem It keeps running in this window until the window is closed; closing the window stops it (no server left behind).
rem If a server for this folder already runs (another play-latest window), it only opens the game and ends at once.
node tools\serve.js --open
if errorlevel 1 goto failed
goto reused

:trypython
rem No Node: Python 3 works too. "py -3" is the Python launcher; "python" may be the Microsoft Store stub, which fails
rem the version test below (so it is skipped rather than opening the Store).
set PY=py -3
%PY% -c "import sys; sys.exit(0 if sys.version_info >= (3, 7) else 1)" >nul 2>nul
if not errorlevel 1 goto python
set PY=python
%PY% -c "import sys; sys.exit(0 if sys.version_info >= (3, 7) else 1)" >nul 2>nul
if not errorlevel 1 goto python
echo.
echo Node.js is not installed, so the game opens as a file: the bookie's test fights will be slower.
echo To fix it: install Node.js (the LTS button) from https://nodejs.org and double-click play-latest again.
goto file

:python
title ROBOCUS game server - leave open while you play
rem the same server written in Python (tools\serve.py): same address, same rules
%PY% tools\serve.py --open
if errorlevel 1 goto failed
goto reused

:reused
rem we get here when the server was already running elsewhere (or was stopped with Ctrl+C): nothing left to do
timeout /t 5 >nul
exit /b 0

:failed
echo.
echo The game server could not start (see the lines above). Opening the game as a file instead.
start "" "prototypes\tabletop-2.html"
pause
exit /b 1

:online
start "" "https://bruyninckx.github.io/ROBOCUP/prototypes/tabletop-2.html"
timeout /t 5 >nul
exit /b 0

:file
start "" "prototypes\tabletop-2.html"
timeout /t 8 >nul
exit /b 0
