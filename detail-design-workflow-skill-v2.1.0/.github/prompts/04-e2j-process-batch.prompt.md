---
name: '04-e2j-process-batch'
description: '処理機能・バッチをJ-20へ抽出'
argument-hint: 'featureId=... sourcePath=... profileId=... sheetName=... blockSelector=... outputPath=...'
agent: 'agent'
---

# 04-e2j-process-batch

## 実行パラメータ

- **featureId**: `${input:featureId:機能ID}`
- **sourcePath**: `${input:sourcePath:対象設計書}`
- **profileId**: `${input:profileId:J-01に記録されたProfile ID。標準はPROFILE-02またはPROFILE-02B}`
- **sheetName**: `${input:sheetName:処理機能記述、検索要領、更新要領等}`
- **blockSelector**: `${input:blockSelector:イベントID、検索要領番号等}`
- **outputPath**: `${input:outputPath:J-20出力先}`

## 参照ファイル

- [共通Instructions](../copilot-instructions.md)
- [入力ソース契約](../skills/detail-design-workflow/contracts/input/I-00-source-input-contract.md)
- [J-20 Schema](../skills/detail-design-workflow/contracts/json/J-20-process-batch.schema.json)
- [設計書プロファイル一覧](../skills/detail-design-workflow/profiles/PROFILE-INDEX.md)

## 対象recordType

`process_section`、`search_requirement`、`update_requirement`、`batch_control`

## 手順

1. 指定された1シートまたは1論理ブロックだけを読む。
2. `profileId`のProfileで対象ブロックがE2J-03/J-20へルーティングされていることと、シート構成が一致することを確認する。不一致なら停止する。
3. イベントIDまたは処理節をブロック境界として保持する。
4. 処理機能記述は節単位の`process_section`として、入力、処理内容、メッセージ、出力をSchemaのフィールドへ分離する。
5. 検索要領は番号ごとの`search_requirement`として、入力テーブル、絞込、結合、ソート、出力項目を抽出する。
6. 更新要領は番号ごとの`update_requirement`として、対象テーブル、更新種別、編集条件、更新項目を抽出する。
7. バッチ情報は`batch_control`として、起動条件、終了条件、再実行、リトライ、リカバリ、コミット境界が明記された場合だけ抽出する。
8. 処理順序を原文どおりに保持する。
9. J-20 JSONだけを`outputPath`へ書き込む。

クラス、メソッド、SQL、一般的な例外処理やトランザクションは割り当てまたは補完しない。
