---
name: '06-e2j-common-permission'
description: '権限・共通規約をJ-40へ抽出'
argument-hint: 'featureId=... sourcePath=... profileId=... sheetName=... blockSelector=... outputPath=...'
agent: 'agent'
---

# 06-e2j-common-permission

## 実行パラメータ

- **featureId**: `${input:featureId:機能IDまたはCOMMON}`
- **sourcePath**: `${input:sourcePath:対象設計書}`
- **profileId**: `${input:profileId:J-01に記録されたProfile ID。標準はPROFILE-05またはPROFILE-06}`
- **sheetName**: `${input:sheetName:対象シート}`
- **blockSelector**: `${input:blockSelector:対象画面、ロール、規約ID等}`
- **outputPath**: `${input:outputPath:J-40出力先}`

## 参照ファイル

- [共通Instructions](../copilot-instructions.md)
- [入力ソース契約](../skills/detail-design-workflow/contracts/input/I-00-source-input-contract.md)
- [J-40 Schema](../skills/detail-design-workflow/contracts/json/J-40-authorization-common.schema.json)
- [設計書プロファイル一覧](../skills/detail-design-workflow/profiles/PROFILE-INDEX.md)

## 対象recordType

`screen_action_permission`、`case_reference_permission`、`role_hierarchy`、`document_header_metadata`、`common_rule`

## 手順

1. 指定された1シートまたは1論理ブロックだけを読む。
2. `profileId`のProfileで対象ブロックがE2J-05/J-40へルーティングされていることと、シート構成が一致することを確認する。不一致なら停止する。
3. 多段ヘッダを正規化し、元ヘッダ行と列位置を出典へ保持する。
4. 権限マトリクスは`screen_action_permission`として、画面ID、イベントID、動作、ユーザロール、可否を1recordとして抽出する。
5. 案件参照権限は`case_reference_permission`として、原本に存在する条件軸、参照先、可否を明記どおり抽出する。
6. ロール階層、文書ヘッダ、共通規約はそれぞれ`role_hierarchy`、`document_header_metadata`、`common_rule`としてSchemaのフィールドへ抽出する。
7. コメント、画像、VMLは本文へ推測転記せず、assetまたはissueにする。
8. SQL生成列は確定recordへ混ぜず、coverageの`reference_only`、またはissueとして扱う。
9. J-40 JSONだけを`outputPath`へ書き込む。

複数機能に使えそうという理由だけで共通化しない。規約の優先順位や適用範囲を推測しない。
