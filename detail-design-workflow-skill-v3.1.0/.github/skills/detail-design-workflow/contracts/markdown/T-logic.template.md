---
id: "{{機能ID}}"
generatedFrom:
  - "{{元設計書ファイル名1}}"
  - "{{元設計書ファイル名2}}"
generatedAt: "{{生成日時 ISO8601}}"
model: "{{GPT-5.4 | GPT-5.4 mini}}"
provisional: {{true|false}}
---

# {{機能ID}} 業務ロジック

<!--
使い方: このテンプレートをコピーして spec/back/{機能ID}/logic.md を作る。
載せるレコード: process_section（業務ロジック本文）（責務=Controller / Service）。
処理概要は methods.md、ロジック本文は本ファイル。振り分け規則の正本: spec-format/routing-table.md。
出典列の書式: シート名!範囲 の短縮表記。
最重要: 条件・否定・例外・数値・順序を JSON から一切欠落させない（意味照合 /03-check の第一対象）。
複数機能に適用と明記された業務ルールは本ファイルに複製せず spec/rules/BR-{番号}.md へリンクする。
-->

## 1. 業務ロジック（process_section）

| Process ID | 処理名 | 前提 | 分岐 | 例外 | トランザクション | Record ID | 出典 |
|---|---|---|---|---|---|---|---|
| {{ProcessID}} | {{処理名}} | {{前提}} | {{分岐}} | {{例外}} | {{トランザクション}} | {{RecordID}} | {{シート名!範囲}} |

## 2. 詳細ロジック記述

<!-- 表に収まらないロジック本文を Process ID ごとに記述する。設計書の記述順・条件の否定形・数値をそのまま保持する。 -->

### {{ProcessID}} {{処理名}}

- 出典: {{シート名!範囲}} ／ Record ID: {{RecordID}}
- ロジック本文:
  {{設計書に明記されたロジックを、条件・順序・数値を保ったまま記述}}

## 3. 業務ルール参照

<!-- 複数機能に適用される業務ルールは正本 spec/rules/BR-{番号}.md にあり、ここではリンクのみ。 -->

| Rule ID | 適用箇所（Process ID） | 参照先 |
|---|---|---|
| {{BR-番号}} | {{ProcessID}} | [spec/rules/BR-{{番号}}.md](../../rules/BR-{{番号}}.md) |
