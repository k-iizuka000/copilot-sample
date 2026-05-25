@echo off
setlocal

set NO_PAUSE=0
if "%~1"=="--no-pause" set NO_PAUSE=1

cd /d "%~dp0"

where dotnet >nul 2>nul
if errorlevel 1 goto missing_dotnet

dotnet test KeepAwakeTray.sln
if errorlevel 1 goto failed

dotnet publish src\KeepAwakeTray.Windows\KeepAwakeTray.Windows.csproj ^
  -c Release ^
  -r win-x64 ^
  --self-contained true ^
  -p:PublishSingleFile=true ^
  -p:IncludeNativeLibrariesForSelfExtract=true ^
  -p:DebugType=None ^
  -p:DebugSymbols=false ^
  -p:PublishTrimmed=false ^
  -o artifacts\win-x64
if errorlevel 1 goto failed

echo.
echo DONE: artifacts\win-x64\KeepAwakeTray.exe
if "%NO_PAUSE%"=="0" pause
exit /b 0

:missing_dotnet
echo.
echo ERROR: dotnet was not found.
echo Install .NET 8 SDK, then run this file again.
echo https://dotnet.microsoft.com/download/dotnet/8.0
if "%NO_PAUSE%"=="0" pause
exit /b 1

:failed
echo.
echo ERROR: build failed.
if "%NO_PAUSE%"=="0" pause
exit /b 1
