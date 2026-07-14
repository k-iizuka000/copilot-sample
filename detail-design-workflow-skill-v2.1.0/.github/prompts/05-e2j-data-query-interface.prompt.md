---
name: '05-e2j-data-query-interface'
description: 'データモデル・検索・外部連携をJ-30へ抽出'
argument-hint: 'featureId=... sourcePath=... profileId=... sheetName=... blockSelector=... outputPath=...'
agent: 'agent'
---

# 05-e2j-data-query-interface

## 実行パラメータ

- **featureId**: `${input:featureId:機能ID}`
- **sourcePath**: `${input:sourcePath:対象設計書}`
- **profileId**: `${input:profileId:J-01に記録されたProfile ID。標準はPROFILE-02、03、04}`
- **sheetName**: `${input:sheetName:項目DB対応表、エンティティ、VIEW等}`
- **blockSelector**: `${input:blockSelector:対象テーブル、VIEW、ブロック}`
- **outputPath**: `${input:outputPath:J-30出力先}`

## 参照ファイル

- [共通Instructions](../copilot-instructions.md)
- [入力ソース契約](../skills/detail-design-workflow/contracts/input/I-00-source-input-contract.md)
- [J-30 Schema](../skills/detail-design-workflow/contracts/json/J-30-data-model-interface.schema.json)
- [設計書プロファイル一覧](../skills/detail-design-workflow/profiles/PROFILE-INDEX.md)

## 対象recordType

`item_db_mapping`、`entity_field`、`attribute_definition`、`attribute_dictionary_entry`、`view_definition`、`view_query_block`、`select_constraint`、`external_interface`

## 手順

1. 指定された1シートまたは1論理ブロックだけを読む。
2. `profileId`のProfileで対象ブロックがE2J-04/J-30へルーティングされていることと、シート構成が一致することを確認する。不一致なら停止する。
3. 項目DB対応は`item_db_mapping`として、画面項目番号、テーブルID、テーブル名、カラム名、特記事項を1行1対応で抽出する。
4. エンティティ項目は`entity_field`、属性標準は`attribute_definition`、属性辞書は`attribute_dictionary_entry`として、Schemaのフィールドへ明記どおり抽出する。
5. VIEW一覧は1行を1件の`view_definition`として抽出する。
6. VIEW検索要領はVIEW物理名を親キーにし、検索ブロックを`view_query_block`、制約を`select_constraint`として抽出する。
7. 外部連携は`external_interface`として、方向、形式、項目、条件、エラーの明記情報だけを抽出する。
8. 旧版、バックアップ、移行、作業、生成SQLは確定recordへ混ぜず、coverageの`reference_only`、またはissueとして扱う。
9. J-30 JSONだけを`outputPath`へ書き込む。

DBカラム、索引、SQL、ファイル定義、外部連携方式を設計または推測しない。J-30 Schemaにない種類を独自追加しない。
