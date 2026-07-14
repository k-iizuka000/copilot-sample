---
name: '03-e2j-ui-behavior'
description: '画面動作・入力制御をJ-11へ抽出'
argument-hint: 'featureId=... sourcePath=... profileId=... sheetName=... blockSelector=... outputPath=...'
agent: 'agent'
---

# 03-e2j-ui-behavior

## 実行パラメータ

- **featureId**: `${input:featureId:機能ID}`
- **sourcePath**: `${input:sourcePath:対象設計書}`
- **profileId**: `${input:profileId:J-01に記録されたProfile ID}`
- **sheetName**: `${input:sheetName:項目制御、バリデーション、イベント、メッセージ}`
- **blockSelector**: `${input:blockSelector:allまたは親キー}`
- **outputPath**: `${input:outputPath:J-11出力先}`

## 参照ファイル

- [共通Instructions](../copilot-instructions.md)
- [入力ソース契約](../skills/detail-design-workflow/contracts/input/I-00-source-input-contract.md)
- [J-11 Schema](../skills/detail-design-workflow/contracts/json/J-11-ui-behavior.schema.json)
- [設計書プロファイル一覧](../skills/detail-design-workflow/profiles/PROFILE-INDEX.md)

## 対象recordType

`item_control`、`validation_rule`、`correlation_validation`、`ui_event`、`message_rule`

## 手順

1. 指定された1シートまたは1論理ブロックだけを読む。
2. `profileId`のProfileで対象ブロックがE2J-02/J-11へルーティングされていることと、見出し・繰り返し単位が一致することを確認する。不一致なら停止する。
3. 項目制御は、画面項目番号、表示条件、活性条件、モード別制御を抽出する。
4. バリデーションは、対象項目、種別、最小、最大、形式、適用操作、メッセージIDを抽出する。
5. 相関チェックは別recordとして抽出し、関係する画面項目番号を保持する。
6. イベントとメッセージ規則を、明記された条件と順序のまま抽出する。画面遷移は`ui_event`の遷移先としてSchemaに定義された範囲だけ保持する。
7. J-11 JSONだけを`outputPath`へ書き込む。

Controller、Service、Validator、DB更新、一般的なエラー処理は割り当てまたは推測しない。
