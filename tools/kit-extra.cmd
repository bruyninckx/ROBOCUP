@echo off
rem ROBOCUS T49 (22 Nov 2026): the Repair kit "something extra" study, with 4x the fights the build box could afford.
rem Double-click it. It does NOT touch your ROBOCUS folder: it gets the test branch into its own folder
rem (%USERPROFILE%\robocus-kit), runs there on 15 of your 16 logical cores, and can be stopped (close the window) and
rem started again: it goes on where it stopped. At the end it names ONE file to send back to Claude.
rem Needs: Git and Node.js (both already used by play-latest), and Python for the report (if it is missing, zip the folder instead).
setlocal
set BR=claude/repair-kit-extra
set WD=%USERPROFILE%\robocus-kit
set REPO=https://github.com/bruyninckx/robocup
title ROBOCUS repair kit study - leave this window open
where node >nul 2>nul || (echo Node.js is not installed. Get it from nodejs.org, then double-click this again. & pause & exit /b 1)
where git >nul 2>nul || (echo Git is not installed. & pause & exit /b 1)
echo Getting the test branch %BR% into %WD% ...
if exist "%WD%\.git" (
  git -C "%WD%" fetch origin %BR% || (echo Could not reach GitHub. & pause & exit /b 1)
  git -C "%WD%" checkout -q -f -B kit origin/%BR% || (echo Could not update %WD%. & pause & exit /b 1)
) else (
  git clone -q --branch %BR% --single-branch %REPO% "%WD%" || (echo Could not download from GitHub. & pause & exit /b 1)
)
cd /d "%WD%"
git log -1 --format="%%h %%cd" > kit-results-rev.txt
echo Test branch at:
type kit-results-rev.txt
if not exist node_modules\planck (
  echo Installing the physics library once (a minute^)...
  call npm install --no-package-lock --loglevel=error
)
echo.
echo Measuring 10 variants x 3,264 fights. About 15-30 minutes on a Ryzen 7 9800X3D. You can use the PC, it will just be slower.
echo.
node tools\damage-lab\kitextra-pc.js 15 16
echo.
pause
