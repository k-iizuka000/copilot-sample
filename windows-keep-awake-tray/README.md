# Keep Awake Tray

Windows のスリープを一時的に止める、シンプルなタスクトレイ常駐アプリです。
キーボード入力やマウス移動の偽装はしません。Windows の正規APIで「この間はスリープしないで」と要求します。

## まずWindowsでやること

まず、Windowsでこのファイルをダブルクリックしてください。

```text
windows-keep-awake-tray/run-windows.cmd
```

同梱しているビルド済みzipを自動で展開してから起動するため、.NET SDK のインストールは不要です。

起動すると `Keep Awake is running` という通知が出ます。
`run-windows.cmd` の黒い画面はすぐ閉じます。これは起動用の画面だけで、アプリ本体は画面右下のタスクトレイに常駐します。
見当たらない場合は、タスクバー右下の隠れているインジケーターも確認してください。

自動展開に失敗した場合は、次のzipを右クリックして `Extract All` で展開してから、もう一度 `run-windows.cmd` を実行してください。

```text
windows-keep-awake-tray/artifacts/win-x64/KeepAwakeTray-win-x64.zip
```

起動失敗や動作中のエラーは、次のログにも出ます。

```text
%LOCALAPPDATA%\KeepAwakeTray\KeepAwakeTray.log
```

## アプリの使い方

起動すると、画面右下のタスクトレイに常駐します。画面に大きなウィンドウは出ません。

タスクトレイのアイコンを右クリックして、次のどれかを選びます。

- `30 min`
- `1 h`
- `3 h`
- `6 h`

選んだ時間だけ、Windows のスリープを抑制します。

画面も消したくない場合は、時間を選ぶ前か選んだ後に `Keep display on` をONにしてください。

止めたいときは `Cancel`、アプリを終わるときは `Exit` を選びます。`Cancel` と `Exit` ではスリープ抑制を解除します。

## Windowsでの動作確認

1. `run-windows.cmd` を起動します。
2. タスクトレイのアイコンを右クリックします。
3. `30 min` などの時間を選びます。
4. PowerShell または コマンドプロンプトを開いて、次を実行します。

```powershell
powercfg /requests
```

時間を選んでいる間は、実行中のアプリが `SYSTEM` の要求として表示されるはずです。

`Cancel` または `Exit` を選んだ後、もう一度これを実行します。

```powershell
powercfg /requests
```

表示から消えていれば、解除できています。

## 自分でビルドだけしたい場合

同梱zipではなく、C# / WinForms版の exe を自分で作り直したい場合だけ .NET 8 SDK が必要です。
その場合は、Windowsでこのファイルをダブルクリックしてください。

```text
windows-keep-awake-tray/build-windows.cmd
```

中で実行しているコマンドはこれです。

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

実行ファイルはここに生成されます。

```text
artifacts/win-x64/KeepAwakeTray.exe
```

## 注意

- 抑制するのはスリープです。会社PCの自動ロック、手動スリープ、ノートPCの蓋閉じ、バッテリー低下、Windows Update の再起動などは別ルールで動くことがあります。
- キー入力、マウス移動、クリック、ネットワーク送信はしません。
- 管理者権限は不要です。
