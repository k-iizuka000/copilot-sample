# 詳細設計ワークフロースキル v2.1.0

このZIPは、Excel設計書を出典付き構造化JSONへ変換し、そのJSONから詳細設計Markdown、実装計画、1タスク実装、実装後レビューまでを進めるContract First型の作業キットです。

## 最初に開くファイル

1. `RUNBOOK.md` — 画面・機能単位の実行順序
2. `PROMPT-INDEX.md` — 実際に実行するプロンプト一覧
3. `03_CONTRACTS/CONTRACT-INDEX.md` — JSON・Markdown・評価契約
4. `90_DEPLOY_TO_REPOSITORY/README.md` — VS Code/Copilotへ配置する手順

## 今回のパッケージ構成

```text
00_START_HERE/                入口、概要、クイックスタート
01_RUNBOOK/                   画面・機能単位の手順書
02_PROMPTS/                   実際の全文プロンプト集
03_CONTRACTS/                 入出力契約、JSON Schema、Markdownテンプレート
04_PROFILES/                  設計書種類別プロファイル
05_PLAN/                      全体計画、役割マトリックス、移行計画
06_EXAMPLES/                  入力、JSON、Markdownの例
07_TESTS/                     ゴールデンサンプル、受入・漏れ確認
08_RUN_TEMPLATE/              画面・機能単位の作業フォルダ雛形
09_SKILL/                     Agent Skill本体
90_DEPLOY_TO_REPOSITORY/      リポジトリへ配置するための可視フォルダ
```

主要ファイルをドットで始まる隠しフォルダの中だけに置いていません。`02_PROMPTS`にはリンクだけのランチャーではなく、契約番号、停止条件、手順、出力条件を含む全文プロンプトを収録しています。
