@echo off
rem ROBOCUS next generation test (Kev, 28 Nov 2026): gets the "nextgen" branch into its OWN folder, next to nothing of the
rem real game (your ROBOCUS folder and play-latest are not touched), and opens the parts-that-fly-off lab page.
set "D=%USERPROFILE%\robocus-nextgen"
if not exist "%D%\.git" (
  echo First time: downloading the next-generation copy to %D% ...
  git clone -b nextgen https://github.com/bruyninckx/ROBOCUP.git "%D%" || (echo Could not download. & pause & exit /b)
) else (
  git -C "%D%" pull --ff-only origin nextgen || (echo Could not update. & pause & exit /b)
)
start "" "%D%\prototypes\flyoff-lab.html"
