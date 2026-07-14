---
id: "_er-overview"
generatedFrom:
  - "{{全体テーブル定義書ファイル名}}"
generatedAt: "{{生成日時 ISO8601}}"
model: "{{GPT-5.4 | GPT-5.4 mini}}"
provisional: {{true|false}}
---

# 全体 ER 概要

<!--
使い方: このテンプレートをコピーして spec/db/_er-overview.md を作る。
生成条件: 全体テーブル定義書が取り込まれている場合のみ生成する（機能単位のエンティティ定義書だけの段階では作らない）。
載せるレコード: entity_relation。
関連の採否規則の正本: spec-format/routing-table.md（AI の推測による関連生成は禁止）。
関連線として描いてよいのは以下の2種のみ:
  - explicit    : 設計書に明記された関連（FK・参照関係の明記）
  - derived_join: VIEW定義・検索要領の JOIN 条件から導出した関連
出典列の書式: シート名!範囲 の短縮表記。
-->

## 1. テーブル一覧

| 物理名 | 論理名 | 定義ファイル | Record ID | 出典 |
|---|---|---|---|---|
| {{テーブル物理名}} | {{論理名}} | [spec/db/{{テーブル物理名}}.md](./{{テーブル物理名}}.md) | {{RecordID}} | {{シート名!範囲}} |

## 2. ER 図

<!--
凡例:
  - ラベル "explicit"     = 設計書に明記された関連
  - ラベル "derived_join" = JOIN 条件由来で導出した関連
  この2種以外の関連線を描かない（AI の推測禁止）。カーディナリティが不明なら unknown を関連一覧に記す。
Mermaid カーディナリティ記法: ||--|| =1:1, ||--o{ =1:N, }o--|| =N:1, }o--o{ =N:M
-->

```mermaid
erDiagram
    {{左テーブル物理名}} ||--o{ {{右テーブル物理名}} : "explicit"
    {{左テーブル物理名2}} }o--|| {{右テーブル物理名2}} : "derived_join"
```

## 3. 関連一覧（entity_relation）

| leftTable | rightTable | cardinality | basis | description | Record ID | 出典 |
|---|---|---|---|---|---|---|
| {{左テーブル}} | {{右テーブル}} | {{1:1 / 1:N / N:1 / N:M / unknown}} | {{explicit / derived_join}} | {{関連の説明}} | {{RecordID}} | {{シート名!範囲}} |
