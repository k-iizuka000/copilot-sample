---
name: '08-ev-source-fidelity'
description: '元設計書とJ-* JSONの忠実性評価'
argument-hint: 'sourcePath=... jsonPath=... outputPath=...'
agent: 'agent'
---

# 08-ev-source-fidelity

## 実行パラメータ

- **sourcePath**: `${input:sourcePath:抽出時と同じ設計書またはスナップショット}`
- **jsonPath**: `${input:jsonPath:評価対象J-* JSON 1件}`
- **outputPath**: `${input:outputPath:J-90評価出力先}`

## 実行指示（全文）

## 参照契約

- `I-00`, `J-00`, `J-90`, `J-99`
- 評価対象JSONの`contractId`に対応するSchema

## 入力

- 元Excelまたは、抽出時と同一の入力スナップショット
- 評価対象のJ-* JSON 1件
- 評価結果の出力先

## 唯一の役割

評価だけを行う。対象JSONを修正しない。仕様や設計案を追加しない。

## 検査順序

1. JSON構造、必須キー、Enum、定義外キーを確認する。
2. 各recordの事実が原本に存在するか確認する。
3. 原本にない事実が追加されていないか確認する。
4. 重要な行、節、表、ブロックの欠落を確認する。
5. sourceRefsのファイル、シート、位置、引用が正しいか確認する。
6. 全sourceUnitがcoverageで`extracted`、`metadata`、`asset`、`reference_only`、`ignored`、`issue`のいずれかになっているか確認する。
7. 非表示行、数式、旧版、派生物、読取不能アセットが適切に扱われているか確認する。
8. 不明点が確定事項になっていないか確認する。

## 判定

- `FAIL`: 原本にない仕様、重要情報の欠落、出典なし確定record、未処理sourceUnit、正本競合、入力切断のcomplete扱いが1件以上。
- `PASS_WITH_WARNINGS`: 不明点や読取不能アセットがissuesへ正しく残り、確定情報の忠実性と全件説明が成立。
- `PASS`: blocking/warningがなく全件追跡可能。

## 出力

`J-90`評価結果だけを書き込む。評価対象JSONを変更しない。

## 最終応答

- 指定された出力ファイルを作成または更新する。
- チャット本文には、結果、出力先、件数、判定、blocking issueだけを簡潔に報告する。
- 指定された出力先以外を変更しない。
