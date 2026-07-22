---
id: "{{ジョブID}}"
generatedFrom:
  - "{{元設計書ファイル名1}}"
  - "{{元設計書ファイル名2}}"
generatedAt: "{{生成日時 ISO8601}}"
model: "{{GPT-5.4 | GPT-5.4 mini}}"
provisional: {{true|false}}
---

# {{ジョブID}} バッチ入出力

<!--
暫定: バッチの標準ファイルセット（control.md / io.md / logic.md / queries.md）は実物の設計書での検証後に確定する。
使い方: このテンプレートをコピーして spec/batch/{ジョブID}/io.md を作る。
載せるレコード: external_interface（バッチ文脈。責務=連携処理）。
振り分け規則の正本: spec-format/routing-table.md（画面文脈の external_interface は back/{機能ID}/methods.md）。
出典列の書式: シート名!範囲 の短縮表記。JSON に無い項目定義を創作しない。
-->

## 1. ファイル・外部連携（external_interface）

| Interface ID | 方向 | 媒体 | 送信元 | 送信先 | 項目 | 条件 | Record ID | 出典 |
|---|---|---|---|---|---|---|---|---|
| {{InterfaceID}} | {{方向}} | {{媒体}} | {{送信元}} | {{送信先}} | {{項目}} | {{条件}} | {{RecordID}} | {{シート名!範囲}} |

## 2. レイアウト詳細

<!-- ファイル・電文の項目レイアウトが設計書に明記されている場合のみ記載する。無ければ表を空のまま残す。 -->

| Interface ID | 項目名 | 型 | 桁 | 位置 | 備考 | Record ID | 出典 |
|---|---|---|---:|---|---|---|---|
| {{InterfaceID}} | {{項目名}} | {{型}} | {{桁}} | {{位置}} | {{備考}} | {{RecordID}} | {{シート名!範囲}} |
