---
name: '07-e2j-assets'
description: '画像・図形・コメント等をJ-60へ登録'
argument-hint: 'featureId=... sourcePath=... profileId=... sheetName=... blockSelector=... outputPath=...'
agent: 'agent'
---

# 07-e2j-assets

## 実行パラメータ

- **featureId**: `${input:featureId:機能ID}`
- **sourcePath**: `${input:sourcePath:対象設計書}`
- **profileId**: `${input:profileId:J-01に記録されたProfile ID}`
- **sheetName**: `${input:sheetName:レイアウト等}`
- **blockSelector**: `${input:blockSelector:allまたは対象範囲}`
- **outputPath**: `${input:outputPath:J-60出力先}`

## 参照ファイル

- [共通Instructions](../copilot-instructions.md)
- [入力ソース契約](../skills/detail-design-workflow/contracts/input/I-00-source-input-contract.md)
- [J-60 Schema](../skills/detail-design-workflow/contracts/json/J-60-asset-manifest.schema.json)
- [設計書プロファイル一覧](../skills/detail-design-workflow/profiles/PROFILE-INDEX.md)

## 役割

画像、図形、drawing、media、chart、コメント、VML等を一覧化し、文字情報のJSONと分離する。画像内容を業務仕様として解釈しない。

## 手順

1. `profileId`がJ-01の`profileId`と一致し、`routingPlan`でE2J-06/J-60へ指定されたシートまたはブロックだけを読む。不一致なら停止する。
2. アセットごとにAsset ID、種別、元ファイル、元シート、位置、読取状態、保存先候補を記録する。
3. 内容を読めない場合は`manual_export_required`または`unreadable`とする。
4. コメント本文を明確に読める場合だけ注記を保存し、読めない場合はissueにする。
5. 画像から画面項目、属性、処理、権限を推測しない。
6. 全アセット候補をcoverageで説明する。
7. J-60 JSONだけを`outputPath`へ書き込む。

対象シート、位置、または後続工程に必要な画像内容を追跡できない場合はblocking issueとして停止する。
