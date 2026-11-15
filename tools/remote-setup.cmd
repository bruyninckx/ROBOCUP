@echo off
rem ROBOCUS: set up a PC for the two-PC online test (and for the other test tools). Run it once, from the ROBOCUS folder.
rem Needs Node.js first (https://nodejs.org, the LTS version). It downloads the test browser (about 150 MB).
setlocal
cd /d "%~dp0.."
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Get the LTS version from https://nodejs.org , install it, then run this file again.
  pause
  exit /b 1
)
echo Installing the test tools...
call npm install
if errorlevel 1 (
  echo.
  echo The test tools could not be installed. Check the internet connection and run this file again.
  pause
  exit /b 1
)
echo Downloading the test browser...
call npx playwright install chromium
if errorlevel 1 (
  echo.
  echo The test browser could not be downloaded. On a PC behind a company filter that is normal
  echo ^("unable to get local issuer certificate"^). The tools will use the Edge or Chrome on this PC instead.
)
echo.
echo Ready. On this PC you can now run tools\remote-join.cmd or tools\remote-host.cmd
pause
