---
name: '08-ev-source-fidelity'
description: '元設計書とJ-* JSONの忠実性を評価'
argument-hint: 'sourcePath=... jsonPath=... outputPath=...'
agent: 'agent'
---

# 08-ev-source-fidelity

## 実行パラメータ

- **sourcePath**: `${input:sourcePath:抽出時と同じ設計書またはスナップショット}`
- **jsonPath**: `${input:jsonPath:評価対象J-* JSON 1件}`
- **outputPath**: `${input:outputPath:J-90評価出力先}`

## 参照ファイル

- [共通Instructions](../copilot-instructions.md)
- [入力ソース契約](../skills/detail-design-workflow/contracts/input/I-00-source-input-contract.md)
- [J-90 Schema](../skills/detail-design-workflow/contracts/json/J-90-evaluation-report.schema.json)
- 評価対象JSONの`contractId`に対応する[JSON Schema](../skills/detail-design-workflow/contracts/json/)

## 役割

元入力とJ-* JSON 1件の忠実性だけを評価する。対象JSONを修正せず、仕様や設計案を追加しない。

## 検査順序

1. JSON構造、必須キー、Enum、定義外キーを確認する。
2. 各recordの事実が原本に存在するか確認する。
3. 原本にない事実が追加されていないか確認する。
4. 重要な行、節、表、ブロックの欠落を確認する。
5. sourceRefsのファイル、シート、位置、引用が正しいか確認する。
6. 全sourceUnitがcoverageで説明されているか確認する。
7. 非表示行、数式、旧版、派生物、読取不能アセットの扱いを確認する。
8. 不明点が確定事項になっていないか確認する。

J-90形式のEV-01評価結果だけを`outputPath`へ書き込む。
