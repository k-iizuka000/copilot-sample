@echo off
setlocal

cd /d "%~dp0"
set "SCRIPT=%~dp0keep-awake-tray.ps1"
set "LOG=%~dp0keep-awake-tray.log"
set "POWERSHELL=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"

if not exist "%SCRIPT%" (
  echo.
  echo Could not find %SCRIPT%.
  pause
  exit /b 1
)

if not exist "%POWERSHELL%" (
  set "POWERSHELL=powershell.exe"
)

echo Starting Keep Awake Tray in debug mode.
echo Close the tray app first, then close this PowerShell window.
echo Log: %LOG%
echo.

"%POWERSHELL%" -NoProfile -ExecutionPolicy Bypass -STA -NoExit -File "%SCRIPT%" -LogPath "%LOG%"
if errorlevel 1 (
  echo.
  echo Keep Awake Tray exited with an error.
  echo Log: %LOG%
  pause
  exit /b 1
)

exit /b 0
