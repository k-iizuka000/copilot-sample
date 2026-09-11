# references/ の中身

`copilot-customization-advisor` スキルと `copilot-docs-researcher` エージェントが、Web 取得に失敗したときの
代替として読む公式ドキュメントの Markdown 原文 (スナップショット) と、判定ガイドを置いています。

| ファイル / ディレクトリ | 内容 |
| --- | --- |
| [decision-guide.md](./decision-guide.md) | 種別判定の詳細、種別ごとの必須設定、Claude Code / Codex との記法差分 (このリポジトリで書いた要約) |
| [manifest.txt](./manifest.txt) | 同梱するドキュメントの一覧 (保存先、リポジトリ、ブランチ、パス) |
| [SNAPSHOT.md](./SNAPSHOT.md) | 最後に取得した日付と、各ファイルの出典 URL、取得結果 |
| [vscode-docs/](./vscode-docs/) | microsoft/vscode-docs の `docs/agent-customization/` と `docs/agents/` から取得した原文 |
| [github-docs/](./github-docs/) | github/docs の `content/copilot/` から取得した原文 |

原文には docs サイトのテンプレート変数 (`{% data variables.... %}`) や相対リンクがそのまま残っています。
読むときは変数名を製品名に読み替えてください。

## 更新方法

macOS / Linux:

```bash
bash .github/skills/copilot-customization-advisor/scripts/refresh-references.sh
```

Windows (PowerShell):

```powershell
pwsh -File .github/skills/copilot-customization-advisor/scripts/refresh-references.ps1
```

どちらも `manifest.txt` を読み、raw.githubusercontent.com から取得し直して `SNAPSHOT.md` に取得日と結果を書きます。
取得に失敗したファイルは前回分を残します。取得先を増やすときは `manifest.txt` に 1 行追加します。

## 出典とライセンス (帰属表示)

- `vscode-docs/` 配下: [microsoft/vscode-docs](https://github.com/microsoft/vscode-docs) のドキュメント。
  ライセンスは [CC BY 3.0](https://github.com/microsoft/vscode-docs/blob/main/LICENSE.md)。著作権は Microsoft Corporation。
- `github-docs/` 配下: [github/docs](https://github.com/github/docs) のドキュメント。
  ライセンスは [CC BY 4.0](https://github.com/github/docs/blob/main/LICENSE)。著作権は GitHub, Inc.。

いずれも原文を改変せずに複製しています。各ファイルの取得元 URL は `SNAPSHOT.md` に記録しています。
