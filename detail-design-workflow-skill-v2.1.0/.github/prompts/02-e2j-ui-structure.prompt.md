---
name: '02-e2j-ui-structure'
description: '画面構造・画面項目をJ-10へ抽出'
argument-hint: 'featureId=... sourcePath=... profileId=... sheetName=... blockSelector=... outputPath=...'
agent: 'agent'
---

# 02-e2j-ui-structure

## 実行パラメータ

- **featureId**: `${input:featureId:機能ID}`
- **sourcePath**: `${input:sourcePath:対象設計書}`
- **profileId**: `${input:profileId:J-01に記録されたProfile ID}`
- **sheetName**: `${input:sheetName:項目またはパラメータ等}`
- **blockSelector**: `${input:blockSelector:allまたは親キー}`
- **outputPath**: `${input:outputPath:J-10出力先}`

## 参照ファイル

- [共通Instructions](../copilot-instructions.md)
- [入力ソース契約](../skills/detail-design-workflow/contracts/input/I-00-source-input-contract.md)
- [J-10 Schema](../skills/detail-design-workflow/contracts/json/J-10-ui-structure.schema.json)
- [設計書プロファイル一覧](../skills/detail-design-workflow/profiles/PROFILE-INDEX.md)

## 対象recordType

`screen_item`、`display_mode`、`parameter_definition`、`layout_reference`

## 手順

1. 指定された1シートまたは1論理ブロックだけを読む。
2. `profileId`のProfileで対象ブロックがE2J-01/J-10へルーティングされていることと、見出しが一致することを確認する。不一致なら停止する。
3. 表形式は原則1行を1sourceUnitとする。
4. 項目番号、名称、属性、国際化キー、最小、最大、フォーマット、配置、備考、初期表示、一覧表示を明記どおり抽出する。
5. パラメータ表は表示モード、URL形式、パラメータ名、用途を抽出する。
6. レイアウトは明示テキストと参照関係だけを抽出し、見た目から仕様を断定しない。
7. 画面項目番号と表示モードを関連キーとして保持する。
8. J-10 JSONだけを`outputPath`へ書き込む。

バリデーション、イベント、メッセージ、HTML要素、DTO、DBカラムはこの工程で抽出または推測しない。
