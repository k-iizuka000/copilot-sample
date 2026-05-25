@echo off
setlocal

cd /d "%~dp0"
set "SCRIPT=%~dp0keep-awake-tray.ps1"
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

start "" "%POWERSHELL%" -NoProfile -ExecutionPolicy Bypass -STA -WindowStyle Hidden -File "%SCRIPT%"
if errorlevel 1 (
  echo.
  echo Could not start Windows PowerShell.
  pause
  exit /b 1
)

exit /b 0
