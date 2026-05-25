# copilot-sample

再利用可能な GitHub Copilot / AI エージェント向け資産と、関連する独立ツールをまとめる public リポジトリです。

このリポジトリは、ひとつのアプリを継続開発する場所ではありません。他のリポジトリ、他のユーザー、他の PC でも使い回せるスキル、エージェント、instructions、ツールを置くための保管庫です。

## 内容

| パス | 内容 |
| --- | --- |
| `.github/agents/` | GitHub Copilot / AI エージェント向けの custom agent 定義 |
| `.github/skills/` | コピーして使える skill |
| `.github/instructions/` | 特定用途や特定パス向けの instructions |
| `office-markdown-vscode-extension/` | Office ファイルを Markdown に変換する VS Code 拡張の独立ツール |
| `markdown-html-vscode-extension/` | Markdown ファイルを HTML に変換する VS Code 拡張の独立ツール |
| `windows-keep-awake-tray/` | Windows のスリープを一時的に抑制するタスクトレイ常駐アプリ |
| `AGENT.md` | AI エージェント向けの作業地図 |

## 追加ルール

- スキル、エージェント、instructions は `.github/` 配下に追加します。
- 独立したツール、CLI、VS Code 拡張、サンプル実装は、リポジトリ直下に専用ディレクトリを作って追加します。
- 独立ツールの詳細な使い方、セットアップ、検証手順は、そのツールのディレクトリ内 README に書きます。
- ルート README は、リポジトリ全体の目的と索引だけを保ちます。

## 公開時の注意

このリポジトリは public 前提です。絶対パス、ユーザー名、端末固有情報、秘密情報、トークン、鍵、認証情報、個人情報を含めないでください。
