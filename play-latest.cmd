@echo off
rem ROBOCUS: get the latest main from GitHub and open the game. Double-click it (Kev, 16 Nov 2026; local server 20 Nov).
rem   play-latest            update, then start a small game server on this PC and open the game from it
rem                          (http://127.0.0.1:8765/...: the bookie's test fights run in the background on all cores)
rem   play-latest online     update, then open the live GitHub Pages copy (what friends see)
rem   play-latest file       update, then open prototypes\tabletop-2.html as a file (the old way; slower bookie)
rem It runs from a copy of itself in %TEMP%, so the update can change this file safely (why: below the copy lines).
rem (Keep these lines ending at byte 1181: see "The Keep this line lines" below.)
rem ------------------------------------------------------------------------------------------------------------------
rem ------------------------------------------------------------------------------------------------------------------
rem ------------------------------------------------------------------------------------------------------------------
rem -------------------------------------------------
if /i "%~1"=="--from-temp" goto main
rem copies older than a day are left over from closed windows: tidy them (forfiles fails quietly when there are none).
rem "type" makes the copy, not "copy": a copy keeps the old file date, and forfiles would then delete a running copy.
forfiles /p "%TEMP%" /m "robocus-play-latest-*.cmd" /d -1 /c "cmd /c del @path" >nul 2>nul
set "ROBOCUS_PL=%TEMP%\robocus-play-latest-%RANDOM%%RANDOM%.cmd"
type "%~f0" > "%ROBOCUS_PL%" 2>nul || goto inplace
if not exist "%ROBOCUS_PL%" goto inplace
"%ROBOCUS_PL%" --from-temp "%~dp0." %*

rem Why it runs from a copy (T53, 22 Nov 2026): cmd.exe reads a .cmd file line by line from the disk while it runs, and
rem goes on at the same byte position. "git pull" below can replace this very file, and cmd then went on in the middle of a
rem line of the new file ("'folder' is not recognized", Kev, 21 Nov). So the lines above copy this file to %TEMP% and run
rem the copy, which nobody changes. A .cmd started without "call" replaces the one that started it, so this file is not
rem read again after that line. The new version takes effect from the next double-click.
rem Wrapping the whole script in one ( ) block does not help: every "goto" (online, file, no Node, failed) reads the
rem file from the disk again, and %errorlevel% / %BR% inside a block would need delayed expansion.
rem The "Keep this line" lines: the 20 Nov play-latest goes on reading at byte 1181 of this file after its update replaced it;
rem that byte must be the start of a line (it then runs the lines above and works). Only matters for that one run.

:inplace
rem only if %TEMP% can't be written: run from here as before (an update of this file can then confuse this one run)
echo (Could not copy play-latest to %TEMP%: running it in place.)
set "ROBOCUS_PL="
goto main

:main
rem setlocal: the variables below stay in this window only
setlocal
rem DIR = the ROBOCUS folder, MODE = the first word after play-latest (online, file or nothing)
if /i "%~1"=="--from-temp" (set "DIR=%~2" & set "MODE=%~3") else (set "DIR=%~dp0." & set "MODE=%~1")
cd /d "%DIR%" || (echo Could not open the folder "%DIR%". & pause & goto done)
echo Checking GitHub...
git fetch origin || (echo Could not reach GitHub. & pause & goto done)
for /f %%b in ('git branch --show-current') do set BR=%%b
if not "%BR%"=="main" (
  echo This folder is on branch %BR%, not main. Switching to main...
  git switch main || (echo Could not switch to main: there are unsaved changes here. & git status --short & pause & goto done)
)
git pull --ff-only origin main || (echo Could not update main: there are local changes or local commits. & git status --short & pause & goto done)
for /f "delims=" %%h in ('git log -1 --format^="%%h %%cd" --date^=format:"%%d %%b %%H:%%M"') do set H=%%h
echo Up to date: main %H%
echo The game shows its files stamp bottom left. A red bar at the top means old files: press Ctrl+F5.

if /i "%MODE%"=="online" goto online
if /i "%MODE%"=="file" goto file

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
goto done

:failed
echo.
echo The game server could not start (see the lines above). Opening the game as a file instead.
start "" "prototypes\tabletop-2.html"
pause
goto done

:online
start "" "https://bruyninckx.github.io/ROBOCUP/prototypes/tabletop-2.html"
timeout /t 5 >nul
goto done

:file
start "" "prototypes\tabletop-2.html"
timeout /t 8 >nul
goto done

:done
rem the end. Run from this folder (no copy): nothing to tidy. Run as the copy in %TEMP%: delete it. "(goto)" first ends this
rem script and the rest of the line still runs, so cmd does not go looking for the deleted file afterwards.
if /i not "%~1"=="--from-temp" exit /b
(goto) 2>nul & del "%~f0" & set "ROBOCUS_PL="
