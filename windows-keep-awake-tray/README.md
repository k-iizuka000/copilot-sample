# Keep Awake Tray

Windows のスリープを一時的に止める、シンプルなタスクトレイ常駐アプリです。
キーボード入力やマウス移動の偽装はしません。Windows の正規APIで「この間はスリープしないで」と要求します。

## まずWindowsでやること

`artifacts/` は生成物なので、GitでWindowsに持っていった直後は存在しないことがあります。

まず、Windowsでこのファイルをダブルクリックしてください。

```text
windows-keep-awake-tray/run-windows.cmd
```

`artifacts/` がなければ自動で作成してから、アプリを起動します。

もし `dotnet was not found` と表示された場合は、Windowsに .NET 8 SDK が入っていません。
その場合は .NET 8 SDK を入れてから、もう一度 `run-windows.cmd` を実行してください。

```text
https://dotnet.microsoft.com/download/dotnet/8.0
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

1. `KeepAwakeTray.exe` を起動します。
2. タスクトレイのアイコンを右クリックします。
3. `30 min` などの時間を選びます。
4. PowerShell を開いて、次を実行します。

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

アプリを起動せず、exe だけ作りたい場合は、Windowsでこのファイルをダブルクリックしてください。

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
