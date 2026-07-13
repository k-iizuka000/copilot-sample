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
- **profileId**: `${input:profileId:PROFILE-05またはPROFILE-06}`
- **sheetName**: `${input:sheetName:対象シート}`
- **blockSelector**: `${input:blockSelector:対象画面、ロール、規約ID等}`
- **outputPath**: `${input:outputPath:J-40出力先}`

## 実行指示（全文）

## 参照契約

- `I-00`, `J-00`, `J-40`, `J-60`, `J-99`
- `PROFILE-05`または`PROFILE-06`

## 許可されたrecordType

- `screen_action_permission`
- `reference_permission`
- `role_hierarchy`
- `common_rule`
- `naming_rule`
- `nonfunctional_rule`
- `applicability_rule`

## 手順

1. 指定された1シートまたは1論理ブロックだけを読む。
2. 多段ヘッダを正規化し、元ヘッダ行と列位置を出典へ保持する。
3. 権限マトリクスは画面ID、イベントID、動作、ユーザロール、可否を1レコードとして抽出する。
4. 参照権限は案件分類、起票元組織、公開設定、参照先組織、タブ別可否を抽出する。
5. 共通規約はRule ID、適用対象、条件、規則、例外、優先順位、有効版を、明記された範囲だけ抽出する。
6. コメント、画像、VMLは本文へ推測転記せず、アセットまたはissueにする。
7. SQL生成列は`derived`として分離する。
8. `J-40` JSONだけを指定出力先へ書き込む。

## やらないこと

- 複数機能に使えそうという理由だけで共通化すること。
- 規約の優先順位や適用範囲を推測すること。
- 派生SQLを権限ルールの正本として扱うこと。

## 共通禁止事項

- 設計書にない仕様を補完しない。
- 設計書以外の資料、既存コード、Web、別ブックを参照しない。
- 元ファイルを変更しない。
- 指定出力先以外を変更しない。
- 正本、旧版、参照用、派生物を混ぜない。
- 読取不能を空欄や推測値で埋めない。
- ターミナルまたはCLIを使用しない。

## 共通停止条件

次のいずれかを検出した場合、`status=failed`または`status=partial`とし、blocking issueを出す。

- 対象ブックが複数ある。
- 指定プロファイルと実際のシート構成が一致しない。
- 正本候補が競合する。
- 入力が途中で切れている。
- 見出し、繰り返し単位、ブロック境界を特定できない。
- 出典を付けられない。

## 共通セルフチェック

1. 出力は指定Schemaに従い、定義外キーを追加しない。
2. 不明値は`null`とする。
3. 確定レコードには1件以上の`sourceRefs`がある。
4. 全sourceUnitがcoverageに存在する。
5. `sourceUnitCount = accountedSourceUnitCount`かつ`unaccountedSourceUnitCount = 0`である。
6. 条件5を満たせない場合、`complete`にしない。
7. 数式を読める場合、表示値と数式文字列を両方保持する。
8. 非表示行・列を、非表示という理由だけで除外しない。
9. 画像、図形、コメント等をアセットまたはissueとして残す。

## 最終応答

- 指定された出力ファイルを作成または更新する。
- チャット本文には、結果、出力先、件数、判定、blocking issueだけを簡潔に報告する。
- 指定された出力先以外を変更しない。
