@echo off
rem ROBOCUS T41 (21 Nov 2026): measure every table the game reads with wear on (bends, cracks, saw cuts) and the retuned robots.
rem Double-click it. It does NOT touch your ROBOCUS folder: it gets the test branch into its own folder
rem (%USERPROFILE%\robocus-wear), runs there on 15 of your 16 logical cores, and can be stopped (close the window) and
rem started again: it goes on where it stopped. At the end it names ONE file to send back to Claude.
rem Needs: Git and Node.js (both already used by play-latest). Playwright's Chromium for the last part (whole games):
rem if it is missing, that part is skipped and the window says so.
setlocal
set BR=claude/bending-on
set WD=%USERPROFILE%\robocus-wear
set REPO=https://github.com/bruyninckx/robocup
title ROBOCUS wear tables - leave this window open
where node >nul 2>nul || (echo Node.js is not installed. Get it from nodejs.org, then double-click this again. & pause & exit /b 1)
where git >nul 2>nul || (echo Git is not installed. & pause & exit /b 1)
echo Getting the test branch %BR% into %WD% ...
if exist "%WD%\.git" (
  git -C "%WD%" fetch origin %BR% || (echo Could not reach GitHub. & pause & exit /b 1)
  git -C "%WD%" checkout -q -f -B wear origin/%BR% || (echo Could not update %WD%. & pause & exit /b 1)
) else (
  git clone -q --branch %BR% --single-branch %REPO% "%WD%" || (echo Could not download from GitHub. & pause & exit /b 1)
)
cd /d "%WD%"
git log -1 --format="%%h %%cd" > wear-results-rev.txt
echo Test branch at:
type wear-results-rev.txt
if not exist node_modules\planck (
  echo Installing the physics library and the test browser driver once (a minute or two^)...
  call npm install --no-package-lock --loglevel=error
  call npx playwright install chromium
)
echo.
echo Measuring. This takes about an hour and a half on a Ryzen 7 9800X3D. You can use the PC, it will just be slower.
echo.
node tools\damage-lab\wear-tables.js 15
echo.
pause
