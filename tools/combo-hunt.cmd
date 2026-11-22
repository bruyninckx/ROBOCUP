@echo off
rem ROBOCUS T58 (22 Nov 2026): the combo hunt. Kev: "make a gigantic program to run on my pc to find combos that work really well".
rem Double-click it (from your ROBOCUS folder, your Desktop, anywhere). It does NOT touch your ROBOCUS folder: it gets the branch
rem into its own folder (%USERPROFILE%\robocus-combo), runs there on all logical processors but one, at low priority (the PC stays
rem usable), and can be stopped (close the window) and started again: it goes on where it stopped. At the end it names ONE file
rem to send back to Claude. Needs: Git and Node.js (both already used by play-latest). No Python.
setlocal
set BR=claude/combo-hunt
set WD=%USERPROFILE%\robocus-combo
set REPO=https://github.com/bruyninckx/robocup
title ROBOCUS combo hunt - leave this window open
where node >nul 2>nul || (echo Node.js is not installed. Get it from nodejs.org, then double-click this again. & pause & exit /b 1)
where git >nul 2>nul || (echo Git is not installed. & pause & exit /b 1)
echo Getting the branch %BR% into %WD% ...
if exist "%WD%\.git" (
  git -C "%WD%" fetch origin %BR% || (echo Could not reach GitHub. & pause & exit /b 1)
  git -C "%WD%" checkout -q -f -B combo origin/%BR% || (echo Could not update %WD%. & pause & exit /b 1)
) else (
  git clone -q --branch %BR% --single-branch %REPO% "%WD%" || (echo Could not download from GitHub. & pause & exit /b 1)
)
cd /d "%WD%"
git log -1 --format="%%h %%cd" > combo-results-rev.txt
echo Branch at:
type combo-results-rev.txt
if not exist node_modules\planck (
  echo Installing the physics library once (a minute^)...
  call npm install --no-package-lock --loglevel=error
)
set H=3
if exist "%WD%\combo-results\state.json" (
  echo.
  echo Going on with the earlier run (same plan, the fights already done are kept^).
) else (
  echo.
  echo How long may it run? 3 hours is a good first run, 8 for overnight. It picks how deep to search from this.
  set /p H=How many hours? [3] 
)
echo.
echo Searching. Progress and the time left are on the line below. You can use the PC, it will just be a bit slower.
echo.
node tools\damage-lab\combo-hunt.js --hours=%H%
echo.
pause
