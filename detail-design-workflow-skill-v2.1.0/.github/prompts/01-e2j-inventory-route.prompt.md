---
name: '01-e2j-inventory-route'
description: '設計書1冊を棚卸しして後続Promptを決定'
argument-hint: 'featureId=... sourcePath=... profileId=... outputPath=...'
agent: 'agent'
---

# 01-e2j-inventory-route

## 実行パラメータ

- **featureId**: `${input:featureId:機能ID}`
- **sourcePath**: `${input:sourcePath:対象設計書1冊}`
- **profileId**: `${input:profileId:PROFILE-01等}`
- **outputPath**: `${input:outputPath:J-01出力先}`

## 参照ファイル

- [共通Instructions](../copilot-instructions.md)
- [入力ソース契約](../skills/detail-design-workflow/contracts/input/I-00-source-input-contract.md)
- [J-01 Schema](../skills/detail-design-workflow/contracts/json/J-01-document-manifest.schema.json)
- [設計書プロファイル](../skills/detail-design-workflow/profiles/PROFILE-INDEX.md)

## 役割

設計書1冊を棚卸しし、各シートの処理方針と後続で実行するPromptを決める。詳細仕様レコードは作らない。

## 手順

1. 対象が1冊であることを確認する。
2. ファイル名、文書種類、版、機能ID、機能名を、明記された範囲だけ取得する。
3. 全シートを列挙し、表示状態、使用範囲、数式、画像、コメント等の存在を記録する。
4. 指定プロファイルに従い、各シートを分類し、使用したIDをJ-01の`profileId`へ記録する。
5. 抽出対象シートについて、後続Prompt、処理単位、親キー、出力契約を`routingPlan`へ記録する。
6. 未定義シートはblocking issueにする。
7. J-01 JSONだけを`outputPath`へ書き込む。

## 完了条件

- 全シートがJ-01に存在する。
- 後続Prompt、対象シート、処理単位、出力契約が一意である。
- 未分類シートが0件、またはblocking issueとして明示されている。
