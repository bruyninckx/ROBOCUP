@echo off
rem ROBOCUS next generation test (Kev, 28 Nov 2026): gets the "nextgen" branch into its OWN folder (your ROBOCUS folder and
rem play-latest are not touched) and opens it.
rem   play-nextgen        the next-gen GAME (parts fly off, lost pieces stay on the card until repaired)
rem   play-nextgen lab    the lab page: pick one robot and watch its piece come off
set "D=%USERPROFILE%\robocus-nextgen"
if not exist "%D%\.git" (
  echo First time: downloading the next-generation copy to %D% ...
  git clone -b nextgen https://github.com/bruyninckx/ROBOCUP.git "%D%" || (echo Could not download. & pause & exit /b)
) else (
  git -C "%D%" pull --ff-only origin nextgen || (echo Could not update. & pause & exit /b)
)
if /i "%~1"=="lab" (start "" "%D%\prototypes\flyoff-lab.html" & exit /b)
where node >nul 2>nul
if errorlevel 1 (start "" "%D%\prototypes\tabletop-2.html" & exit /b)
title ROBOCUS NEXT-GEN game server - leave open while you play
cd /d "%D%"
node tools\serve.js --open
