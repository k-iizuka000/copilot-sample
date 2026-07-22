---
id: "{{機能ID}}"
generatedFrom:
  - "{{元設計書ファイル名1}}"
  - "{{元設計書ファイル名2}}"
generatedAt: "{{生成日時 ISO8601}}"
model: "{{GPT-5.4 | GPT-5.4 mini}}"
provisional: {{true|false}}
---

# {{機能ID}} メソッド・処理概要

<!--
使い方: このテンプレートをコピーして spec/back/{機能ID}/methods.md を作る。
載せるレコード: ui_event / process_section（処理概要） / external_interface（画面文脈）（責務=Controller / Service）。
処理概要は methods、業務ロジック本文は logic.md（T-logic）に分ける。振り分け規則の正本: spec-format/routing-table.md。
出典列の書式: シート名!範囲 の短縮表記。
JSON に無い仕様を書かない。ロジックの詳細は本ファイルに書かず logic.md へリンクする。
-->

## 1. イベント・遷移（ui_event）

| Event ID | 項目番号 | イベント名 | 処理概要 | 遷移先 | Record ID | 出典 |
|---|---|---|---|---|---|---|
| {{EventID}} | {{項目番号}} | {{イベント名}} | {{処理概要}} | {{遷移先}} | {{RecordID}} | {{シート名!範囲}} |

## 2. 処理概要（process_section／概要）

| Process ID | 処理名 | 入力 | 処理概要 | 出力 | Record ID | 出典 |
|---|---|---|---|---|---|---|
| {{ProcessID}} | {{処理名}} | {{入力}} | {{処理概要}} | {{出力}} | {{RecordID}} | {{シート名!範囲}} |

## 3. 外部連携（external_interface／画面文脈）

| Interface ID | 方向 | 相手 | 項目 | 条件 | Record ID | 出典 |
|---|---|---|---|---|---|---|
| {{InterfaceID}} | {{方向}} | {{相手}} | {{項目}} | {{条件}} | {{RecordID}} | {{シート名!範囲}} |

## 4. 業務ロジック本文参照

<!-- 分岐・例外・数値条件などのロジック本文は logic.md に置く。ここではリンクのみ。 -->

- 業務ロジック本文: [logic.md](./logic.md)（同一ディレクトリ spec/back/{{機能ID}}/logic.md）
