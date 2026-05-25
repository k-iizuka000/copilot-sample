# Keep Awake Tray

Small Windows tray app for temporarily preventing system sleep. It uses the Windows execution-state API instead of sending fake keyboard or mouse input.

## Features

- Tray-only WinForms app.
- Duration menu: 30 min, 1 h, 3 h, 6 h.
- Optional "Keep display on" toggle.
- Cancel and Exit always clear the sleep-prevention request.
- No administrator privileges required.

## Build And Test

From this directory:

```bash
dotnet test KeepAwakeTray.sln
dotnet publish src/KeepAwakeTray.Windows/KeepAwakeTray.Windows.csproj \
  -c Release \
  -r win-x64 \
  --self-contained true \
  -p:PublishSingleFile=true \
  -p:IncludeNativeLibrariesForSelfExtract=true \
  -p:DebugType=None \
  -p:DebugSymbols=false \
  -p:PublishTrimmed=false \
  -o artifacts/win-x64
```

The executable is generated at:

```text
artifacts/win-x64/KeepAwakeTray.exe
```

## Windows Smoke Check

1. Run `KeepAwakeTray.exe`.
2. Use the tray menu to select a duration.
3. In PowerShell, run:

```powershell
powercfg /requests
```

While a duration is active, the app should appear under the system execution requests. After `Cancel` or `Exit`, that request should disappear.

## Notes

- This prevents system sleep while active. Corporate lock-screen rules, manual sleep, lid-close behavior, low battery, and restart policies may still apply.
- The app does not send key presses, mouse movement, clicks, or network requests.
