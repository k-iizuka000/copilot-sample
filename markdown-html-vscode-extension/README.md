# Markdown HTML VS Code Extension

Markdownファイルを、読みやすい単体HTMLに変換するVS Code拡張です。

## 主な挙動

- Explorer、エディタ本文、エディタタブの右クリックメニュー、またはコマンドパレットから変換できます。
- 対象は選択した `.md` / `.markdown` ファイルだけです。
- 既定では `source.md` から `source.html` を元ファイルの隣に生成します。
- 同名HTMLがある場合は既定で上書きします。
- 生成後、VS Code内のプレビューでHTMLを表示します。
- 先頭のYAML frontmatterがある場合は、本文とは別のMetadata領域に表示します。
- frontmatterの未知のkeyも動的に表示します。
- Markdown内の参照リンクは参照リンクのまま残し、リンク先Markdownを再帰的には変換しません。
- 生成HTMLは `Clarity Report` ベースのCSSで、Metadataを本文から分離し、配布用の単体HTMLとして読みやすく表示します。

## 対応形式

- `.md`
- `.markdown`

## Settings

- `markdownHtml.outputLocation`
  - `nextToSource`: 元ファイルの隣に `source.html` を生成します。
  - `htmlFolder`: 元ファイルの隣の `html/` に生成します。
  - `askEachTime`: 毎回保存先を選びます。
- `markdownHtml.outputFolderName`
- `markdownHtml.overwritePolicy`
  - `overwrite`
  - `confirm`
  - `createUnique`
- `markdownHtml.openAfterExport`
- `markdownHtml.allowRawHtml`
- `markdownHtml.linkify`
- `markdownHtml.typographer`

## VS Codeでの使い方

1. `npm run package:extension` でVSIXを作成します。
2. VS Code Desktopに `dist/markdown-html-exporter-<version>.vsix` をインストールします。
3. Explorerで `.md` または `.markdown` を右クリックします。
4. `Export Markdown to HTML` を実行します。

Command Paletteからは `Markdown HTML: Export Active Markdown to HTML` を実行できます。

## デザインサンプル

`design-samples/index.html` に、今回検討した3つの方向性を置いています。

- `Clarity Report`: 標準CSSに採用した、メモにもスキル文書にも使いやすいレポート型。
- `Editorial Brief`: メモや読み物向け。
- `Agent Dossier`: `SKILL.md` や `AGENTS.md` のようなエージェント文書向け。

## 開発コマンド

このディレクトリ内で実行します。

```bash
npm install
npm run typecheck
npm test
npm run build
npm run package:extension
```

## セキュリティと制約

- 既定ではMarkdown内のraw HTMLを無効化します。
- ネットワーク処理や外部runtimeは使いません。
- リンク先や参照先のMarkdownは自動変換しません。変換するのは選択中のファイルだけです。
- 生成HTMLのヘッダーには、ローカルの絶対パスではなくファイル名だけを表示します。
