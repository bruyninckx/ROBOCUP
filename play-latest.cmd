@echo off
rem ROBOCUS: get the latest main from GitHub and open the game. Double-click it (Kev, 16 Nov 2026).
rem   play-latest            update, then open prototypes\tabletop-2.html from this folder
rem   play-latest online     update, then open the live GitHub Pages copy (what friends see)
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
if /i "%1"=="online" (start "" "https://bruyninckx.github.io/ROBOCUP/prototypes/tabletop-2.html") else (start "" "prototypes\tabletop-2.html")
echo The game shows its files stamp bottom left. A red bar at the top means old files: press Ctrl+F5.
timeout /t 5 >nul
