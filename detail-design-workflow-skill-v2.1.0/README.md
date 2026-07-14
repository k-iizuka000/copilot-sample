# 詳細設計ワークフロー

Excel設計書を、出典付きJSONへ構造化してから詳細設計Markdownへ変換するためのGitHub Copilot用パッケージです。

```text
Excel設計書
  → J-* 構造化JSON
  → EV-01 原本照合
  → M-* 詳細設計Markdown
  → EV-02 Markdown整合性確認
```

実装計画、コード実装、実装レビュー、テスト生成は対象外です。

## 導入

このディレクトリの`.github`と`.vscode`を、使用するリポジトリのルートへコピーします。既存の`.vscode/settings.json`がある場合は、`json.schemas`と`chat.promptFilesLocations`を上書きせず統合してください。

VS Codeを再読み込みし、Copilot Chatで`/01-e2j-inventory-route`が候補に出れば準備完了です。

## 最初に読むもの

1. [標準作業手順](.github/skills/detail-design-workflow/RUNBOOK.md)
2. [入出力契約一覧](.github/skills/detail-design-workflow/contracts/CONTRACT-INDEX.md)
3. [設計書プロファイル一覧](.github/skills/detail-design-workflow/profiles/PROFILE-INDEX.md)

## 通常の実行順序

```text
/01-e2j-inventory-route
→ routingPlanで必要とされた /02〜/07
→ 作成したJ-*ごとに /08-ev-source-fidelity
→ 人間がJSONを確認
→ /09-j2m-detail-design
→ /10-ev-markdown-integrity
→ 人間が詳細設計を確認
```

`/00-d00-format-survey`は、未知または改訂済みのExcelフォーマットを初めて扱う場合だけ使用します。

番号付きPromptを`/00`から`/10`まで各1回実行するのではありません。`/01`は1冊ごと、`/02`〜`/07`はJ-01が指定したシートまたは論理ブロックごと、`/08`は生成JSONごとに繰り返し、`/09`と`/10`はrunの最後に各1回実行します。

生のExcelを読めない場合のCSV/TSV書き出しは、番号付きPromptの外側で人間が行う前処理です。CSV/TSVから直接Markdownへ変換せず、必ず出典付きJSONとEV-01を経由します。

## 構成

```text
.github/
  copilot-instructions.md                 共通ルールの正本
  prompts/                                実行するPrompt Files 00〜10
  skills/detail-design-workflow/
    SKILL.md                              スキル入口
    RUNBOOK.md                            手順書の正本
    contracts/input/                      入力契約
    contracts/json/                       中間JSON Schema
    contracts/markdown/                   詳細設計Markdownテンプレート
    profiles/                             Excel種類別プロファイル
    run-template/FEATURE-ID/              1画面・1機能用の作業雛形
.vscode/settings.json                     Prompt FilesとJSON Schemaの設定
```

共通ルールは`.github/copilot-instructions.md`だけを正本とし、各Prompt Fileには工程固有の指示だけを置きます。
