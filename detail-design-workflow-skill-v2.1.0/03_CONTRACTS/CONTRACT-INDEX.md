# 契約インデックス

## 共通契約

| ID | ファイル | 役割 |
|---|---|---|
| `C-00` | [契約の読み方](./C-00-contract-overview.md) | 契約番号、正本、評価、停止条件 |
| `C-01` | [出力共通ルール](./C-01-output-rules.md) | null、Enum、追加禁止、決定性 |
| `C-02` | [分類ルール](./classification-rules.md) | レイヤー、スコープ、正本優先 |
| `C-03` | [出典ルール](./source-traceability-rules.md) | sourceUnit、sourceRefs、coverage |
| `C-04` | [問題ルール](./C-04-issue-rules.md) | blocking、issueType、質問票 |
| `C-05` | [評価ルール](./C-05-evaluation-rules.md) | PASS、PASS_WITH_WARNINGS、FAIL |
| `C-06` | [状態遷移](./C-06-status-and-gates.md) | 人間確認ゲートと完了条件 |

## 入力契約

| ID | ファイル | 役割 |
|---|---|---|
| `I-00` | [入力ソース契約](./input/I-00-source-input-contract.md) | Excelまたは入力スナップショット |

## JSON契約

| ID | ファイル | 役割 |
|---|---|---|
| `J-00` | [共通定義](./json/J-00-common-definitions.schema.json) | 共通型・列挙値 |
| `J-01` | [文書マニフェスト](./json/J-01-document-manifest.schema.json) | 文書・シート棚卸し、ルーティング |
| `J-10` | [画面構造](./json/J-10-ui-structure.schema.json) | 画面項目、表示モード、パラメータ |
| `J-11` | [画面動作](./json/J-11-ui-behavior.schema.json) | 制御、バリデーション、イベント、メッセージ |
| `J-20` | [処理・バッチ](./json/J-20-process-batch.schema.json) | 処理、検索、更新、バッチ制御 |
| `J-30` | [データ・検索・連携](./json/J-30-data-model-interface.schema.json) | 項目DB対応、データモデル、VIEW、外部IF |
| `J-40` | [権限・共通](./json/J-40-authorization-common.schema.json) | 権限、ロール、共通規約 |
| `J-60` | [アセット](./json/J-60-asset-manifest.schema.json) | 画像、図形、コメント等 |
| `J-90` | [評価結果](./json/J-90-evaluation-report.schema.json) | EV-01、EV-02、EV-03の結果 |
| `J-99` | [問題・カバレッジ](./json/J-99-issue-coverage.schema.json) | issue、coverage、件数照合 |

## 詳細設計Markdown契約

| ID | ファイル | 出力 |
|---|---|---|
| `M-00` | [共通メタデータ](./markdown/M-00-common-metadata.md) | Front Matterと共通表記 |
| `M-01` | [機能概要](./markdown/M-01-overview.template.md) | `00-overview.md` |
| `M-10` | [フロントエンド](./markdown/M-10-frontend.template.md) | `10-frontend.md` |
| `M-20` | [バックエンド](./markdown/M-20-backend.template.md) | `20-backend.md` |
| `M-30` | [DB](./markdown/M-30-database.template.md) | `30-database.md` |
| `M-40` | [バッチ・外部IF](./markdown/M-40-batch-interface.template.md) | `40-batch-interface.md` |
| `M-50` | [権限・共通](./markdown/M-50-authorization-common.template.md) | `50-common-permission.md` |
| `M-60` | [アセット](./markdown/M-60-assets.template.md) | `60-assets.md` |
| `M-90` | [未確定事項](./markdown/M-90-open-issues.template.md) | `90-open-issues.md` |
| `M-99` | [トレーサビリティ](./markdown/M-99-traceability.template.md) | `99-traceability.md` |

## 実装工程契約

| ID | ファイル | 役割 |
|---|---|---|
| `P-00` | [実装計画ルール](./implementation/P-00-implementation-plan-rules.md) | 1行1タスク、依存、状態 |
| `P-10` | [実装計画テンプレート](./implementation/P-10-implementation-plan.template.md) | 実装計画 |
| `R-10` | [タスク実装結果](./implementation/R-10-task-execution-report.template.md) | 実装・テスト結果 |
| `R-20` | [タスクレビュー](./implementation/R-20-task-review-report.template.md) | 1タスク評価 |
| `R-30` | [機能完了レビュー](./implementation/R-30-feature-review-report.template.md) | 機能全体評価 |
