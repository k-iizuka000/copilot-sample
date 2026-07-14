---
id: "{{ジョブID}}"
generatedFrom:
  - "{{元設計書ファイル名1}}"
  - "{{元設計書ファイル名2}}"
generatedAt: "{{生成日時 ISO8601}}"
model: "{{GPT-5.4 | GPT-5.4 mini}}"
provisional: {{true|false}}
---

# {{ジョブID}} バッチ制御

<!--
暫定: バッチの標準ファイルセット（control.md / io.md / logic.md / queries.md）は実物の設計書での検証後に確定する。
使い方: このテンプレートをコピーして spec/batch/{ジョブID}/control.md を作る。
載せるレコード: batch_control（責務=バッチ起動 / 制御）。
振り分け規則の正本: spec-format/routing-table.md。標準セットの正本: spec-format/output-structure.md。
出典列の書式: シート名!範囲 の短縮表記。JSON に無い仕様を書かない。
入出力は io.md、業務ロジックは logic.md（T-logic 流用）、SQL は queries.md（T-queries 流用）に分ける。
-->

## 1. バッチ制御（batch_control）

| ジョブID | 起動条件 | スケジュール | 処理ステップ | 終了条件 | リトライ | リカバリ | Record ID | 出典 |
|---|---|---|---|---|---|---|---|---|
| {{ジョブID}} | {{起動条件}} | {{スケジュール}} | {{処理ステップ}} | {{終了条件}} | {{リトライ}} | {{リカバリ}} | {{RecordID}} | {{シート名!範囲}} |

## 2. 入出力・ロジック参照

<!-- バッチの入出力・ロジック・SQL は別ファイルにあり、ここではリンクのみ（存在するものだけ残す）。 -->

- 入出力: [io.md](./io.md)
- 業務ロジック: [logic.md](./logic.md)
- 検索・更新要領: [queries.md](./queries.md)
