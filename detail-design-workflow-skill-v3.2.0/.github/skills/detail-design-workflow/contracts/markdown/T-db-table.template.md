---
id: "{{テーブル物理名}}"
generatedFrom:
  - "{{元設計書ファイル名1}}"
  - "{{元設計書ファイル名2}}"
generatedAt: "{{生成日時 ISO8601}}"
model: "{{GPT-5.4 | GPT-5.4 mini}}"
provisional: {{true|false}}
---

# {{テーブル物理名}} テーブル定義

<!--
使い方: このテンプレートをコピーして spec/db/{テーブル物理名}.md を作る。ファイル名はテーブル物理名（ASCII）。
載せるレコード: entity_field / attribute_definition / view_definition / view_query_block（責務=Entity / DTO / Mapper）。
振り分け規則の正本: spec-format/routing-table.md。
db/ は共有領域。既存記述と矛盾する定義（型・桁の不一致）を検出したら上書きせず両論併記し warnings.md に記録する
（共有領域の扱いの正本: spec-format/routing-table.md）。
出典列の書式: シート名!範囲 の短縮表記。JSON に無い型・桁を推測で埋めない（未確認は null、該当なしは 空）。
-->

## 1. テーブル概要（attribute_definition）

| 論理名 | 物理名 | 区分（テーブル/VIEW） | 用途 | Record ID | 出典 |
|---|---|---|---|---|---|
| {{論理名}} | {{テーブル物理名}} | {{テーブル / VIEW}} | {{用途}} | {{RecordID}} | {{シート名!範囲}} |

## 2. カラム定義（entity_field）

| 論理名 | 物理名 | 型 | 桁 | PK | NN | Index | デフォルト | 備考 | Record ID | 出典 |
|---|---|---|---:|---|---|---|---|---|---|---|
| {{カラム論理名}} | {{カラム物理名}} | {{型}} | {{桁}} | {{PK}} | {{NN}} | {{Index}} | {{デフォルト}} | {{備考}} | {{RecordID}} | {{シート名!範囲}} |

## 3. VIEW定義（view_definition）

<!-- 区分が VIEW の場合のみ記載。テーブルなら表を空のまま残す。 -->

| VIEW論理名 | VIEW物理名 | 用途 | 定義概要 | Record ID | 出典 |
|---|---|---|---|---|---|
| {{VIEW論理名}} | {{VIEW物理名}} | {{用途}} | {{定義概要}} | {{RecordID}} | {{シート名!範囲}} |

## 4. VIEW検索ブロック（view_query_block）

| VIEW | 入力テーブル | 条件 | JOIN | 出力項目 | 集約 | Record ID | 出典 |
|---|---|---|---|---|---|---|---|
| {{VIEW物理名}} | {{入力テーブル}} | {{条件}} | {{JOIN}} | {{出力項目}} | {{集約}} | {{RecordID}} | {{シート名!範囲}} |

## 5. 関連参照

<!-- テーブル間の関連（ER）は db/_er-overview.md が正本（全体テーブル定義書がある場合のみ生成）。ここではリンクのみ。 -->

- 全体ER: [_er-overview.md](./_er-overview.md)（存在する場合）
