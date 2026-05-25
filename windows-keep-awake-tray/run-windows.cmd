@echo off
setlocal

cd /d "%~dp0"
set EXE=artifacts\win-x64\KeepAwakeTray.exe

if not exist "%EXE%" (
  call "%~dp0build-windows.cmd" --no-pause
  if errorlevel 1 (
    echo.
    echo Could not create %EXE%.
    pause
    exit /b 1
  )
)

start "" "%EXE%"
exit /b 0
