# プロンプトインデックス

## 通常フロー

| 順番 | Prompt File | 正規プロンプト | 工程 |
|---:|---|---|---|
| 1 | `/01-e2j-inventory-route` | `E2J-00` | 設計書棚卸し |
| 2 | `/02`〜`/07`の必要分 | `E2J-01`〜`E2J-06` | 構造化JSON抽出 |
| 3 | `/08-ev-source-fidelity` | `EV-01` | JSON原本忠実性評価 |
| 4 | `/09-j2m-detail-design` | `J2M-01` | 詳細設計Markdown作成 |
| 5 | `/10-ev-markdown-integrity` | `EV-02` | Markdown整合性評価 |
| 6 | `/11-m2p-implementation-plan` | `M2P-01` | 実装計画作成 |
| 7 | `/12-ev-implementation-plan` | `EV-03` | 実装計画評価 |
| 8 | `/13-imp-execute-task` | `IMP-01` | 1タスク実装 |
| 9 | `/14-rev-task` | `REV-01` | タスクレビュー |
| 10 | `/15-rev-feature` | `REV-02` | 機能完了レビュー |

`/00-d00-format-survey`は、未知または改訂済みの設計書フォーマットを初めて扱うときだけ使用する。
