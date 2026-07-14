# 入出力契約一覧

共通の処理規則、停止条件、評価基準、Markdown生成条件は[Copilot Instructions](../../../copilot-instructions.md)を正本とする。

## 入力

| ID | ファイル | 役割 |
|---|---|---|
| I-00 | [入力ソース契約](./input/I-00-source-input-contract.md) | Excelまたは入力スナップショットの形式と処理単位 |

## 中間JSON

| ID | ファイル | 役割 |
|---|---|---|
| J-00 | [共通定義](./json/J-00-common-definitions.schema.json) | Record ID、出典、issue、coverage等の共通型 |
| J-01 | [文書マニフェスト](./json/J-01-document-manifest.schema.json) | 文書・シート棚卸しと後続ルーティング |
| J-10 | [画面構造](./json/J-10-ui-structure.schema.json) | 画面項目、表示モード、パラメータ |
| J-11 | [画面動作](./json/J-11-ui-behavior.schema.json) | 制御、バリデーション、イベント、メッセージ |
| J-20 | [処理・バッチ](./json/J-20-process-batch.schema.json) | 処理、検索、更新、バッチ制御 |
| J-30 | [データ・検索・連携](./json/J-30-data-model-interface.schema.json) | DB対応、データモデル、VIEW、外部IF |
| J-40 | [権限・共通](./json/J-40-authorization-common.schema.json) | 権限、ロール、共通規約 |
| J-60 | [アセット](./json/J-60-asset-manifest.schema.json) | 画像、図形、コメント、読取状態 |
| J-90 | [評価結果](./json/J-90-evaluation-report.schema.json) | EV-01とEV-02の結果 |

## 詳細設計Markdown

| ID | ファイル | 出力条件 | 出力例 |
|---|---|---|---|
| M-01 | [機能概要](./markdown/M-01-overview.template.md) | 常に作成 | `00-overview.md` |
| M-10 | [フロントエンド](./markdown/M-10-frontend.template.md) | 対応レコードあり | `10-frontend.md` |
| M-20 | [バックエンド](./markdown/M-20-backend.template.md) | 対応レコードあり | `20-backend.md` |
| M-30 | [DB](./markdown/M-30-database.template.md) | 対応レコードあり | `30-database.md` |
| M-40 | [バッチ・外部IF](./markdown/M-40-batch-interface.template.md) | 対応レコードあり | `40-batch-interface.md` |
| M-50 | [権限・共通](./markdown/M-50-authorization-common.template.md) | 対応レコードあり | `50-common-permission.md` |
| M-60 | [アセット](./markdown/M-60-assets.template.md) | 対応レコードあり | `60-assets.md` |
| M-90 | [未確定事項](./markdown/M-90-open-issues.template.md) | issueまたは警告あり | `90-open-issues.md` |
| M-99 | [トレーサビリティ](./markdown/M-99-traceability.template.md) | 常に作成 | `99-traceability.md` |

空Markdownは作成しない。分野別ファイルを省略した理由はM-01の出力一覧へ記録する。
