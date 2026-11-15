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
echo Downloading the test browser...
call npx playwright install chromium
echo.
echo Ready. On this PC you can now run tools\remote-join.cmd or tools\remote-host.cmd
pause
