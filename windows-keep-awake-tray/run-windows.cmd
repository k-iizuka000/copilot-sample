@echo off
setlocal

cd /d "%~dp0"
set "EXE=%~dp0artifacts\win-x64\KeepAwakeTray.exe"
set "ZIP=%~dp0artifacts\win-x64\KeepAwakeTray-win-x64.zip"
set "TAR=%SystemRoot%\System32\tar.exe"

if not exist "%ZIP%" (
  if exist "%EXE%" goto run_app

  echo.
  echo Could not find:
  echo   %EXE%
  echo   %ZIP%
  echo.
  echo Get the prebuilt zip or build the app with build-windows.cmd.
  pause
  exit /b 1
)

if not exist "%TAR%" (
  echo.
  echo Could not find Windows tar.exe for automatic extraction.
  echo.
  echo Please right-click this file and choose Extract All:
  echo   %ZIP%
  echo.
  echo Then run this file again:
  echo   %~f0
  pause
  exit /b 1
)

if exist "%EXE%" (
  del /f /q "%EXE%" >nul 2>nul
  if exist "%EXE%" (
    echo.
    echo Could not replace the existing app:
    echo   %EXE%
    echo.
    echo If Keep Awake Tray is already running, exit it from the tray menu and try again.
    pause
    exit /b 1
  )
)

echo Extracting prebuilt app...
"%TAR%" -xf "%ZIP%" -C "%~dp0artifacts\win-x64"
if errorlevel 1 (
  echo.
  echo Could not extract:
  echo   %ZIP%
  pause
  exit /b 1
)

if not exist "%EXE%" (
  echo.
  echo Extracted zip, but could not find:
  echo   %EXE%
  pause
  exit /b 1
)

:run_app
start "" "%EXE%"
exit /b 0
