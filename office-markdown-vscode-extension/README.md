# Office Markdown VS Code Extension

Office OOXML/PDFファイルをMarkdownとassetディレクトリへ変換するVS Code拡張の成果物一式です。

## 内容

```text
office-markdown-vscode-extension/
  packages/core/              # VS Code非依存の変換エンジン
  packages/vscode-extension/  # VS Code command/settings/notification layer
  specs/                      # requirements, design, QA, tasks
  scripts/                    # public repo向け安全チェック
  dist/                       # packaged VSIX
  package.json
  package-lock.json
  tsconfig.base.json
```

## 対応形式

- Excel: `.xlsx`, `.xlsm`
- PowerPoint: `.pptx`
- Word: `.docx`
- PDF: `.pdf`

## 主な挙動

- Explorerの右クリックメニュー、またはコマンドパレットから変換できます。
- 既定では `source.md` と `source.assets/` を元ファイルの隣に生成します。
- Office内の画像と埋め込みオブジェクトは `*.assets/` に抽出し、Markdownから相対リンクします。
- PDFは抽出可能なテキストをページ単位でMarkdown化します。
- `*.assets/manifest.json` に抽出物、警告、エラー、非対応内容を記録します。
- `.xlsm` のマクロは実行せず、manifest/レポートに警告として記録します。
- Python、Pandoc、LibreOffice、Office本体などの外部runtimeは不要です。

## 開発コマンド

このディレクトリ内で実行します。

```bash
npm install
npm run typecheck
npm test
npm run build
npm run package:extension
```

生成されたVSIXは `dist/office-markdown-0.1.1.vsix` に出力されます。

## VS Codeでの使い方

1. `npm run package:extension` でVSIXを作成します。
2. VS Code Desktopに `dist/office-markdown-0.1.1.vsix` をインストールします。
3. Explorerで `.xlsx`, `.xlsm`, `.pptx`, `.docx`, `.pdf` を右クリックします。
4. `Convert Office/PDF File to Markdown` を実行します。

Command Paletteからは `Office Markdown: Convert Active Office/PDF File to Markdown` を実行できます。

## Settings

- `officeMarkdown.outputLocation`
- `officeMarkdown.overwritePolicy`
- `officeMarkdown.includeExcelHiddenSheets`
- `officeMarkdown.excelFormulaMode`
- `officeMarkdown.includePowerPointNotes`
- `officeMarkdown.includeConversionReport`
- `officeMarkdown.maxTableRows`
- `officeMarkdown.maxPdfPages`
- `officeMarkdown.maxPdfTextItemsPerPage`
- `officeMarkdown.maxPdfMarkdownChars`
- `officeMarkdown.maxExtractedAssetBytes`
- `officeMarkdown.maxPackageUncompressedBytes`
- `officeMarkdown.maxEntryCount`

## MVPの制約

- `.xls`, `.xlsb`, `.ppt`, `.doc` は対象外です。
- OCR、LLM Vision、Office/PDFページの画像レンダリング、複雑なSmartArt/Chart再構成は対象外です。
- PDF内の画像、図形、スキャン画像はMarkdown画像として抽出しません。
- 外部relationshipは取得せず、manifestに記録します。
