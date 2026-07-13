---
name: '01-e2j-inventory-route'
description: '設計書1冊の棚卸しと後続ルーティング'
argument-hint: 'featureId=... sourcePath=... profileId=... outputPath=...'
agent: 'agent'
---

# 01-e2j-inventory-route

## 実行パラメータ

- **featureId**: `${input:featureId:機能ID}`
- **sourcePath**: `${input:sourcePath:対象設計書1冊}`
- **profileId**: `${input:profileId:PROFILE-01等}`
- **outputPath**: `${input:outputPath:J-01出力先}`

## 実行指示（全文）

## 参照契約

- `I-00` 入力ソース契約
- `J-01` 文書マニフェスト
- `J-60` アセットマニフェスト
- `J-99` 問題・カバレッジ
- 指定された`PROFILE-*`

## 唯一の役割

設計書1冊を棚卸しし、各シートの処理方針と、後続で実行するE2Jプロンプトを決める。詳細仕様レコードは作らない。

## 手順

1. 対象が1冊だけであることを確認する。
2. ファイル名、文書種類、版、機能ID、機能名を、明記された範囲だけ取得する。
3. 全シートを列挙し、表示・非表示、使用範囲、数式、画像、コメント等の存在を記録する。
4. プロファイルに従って各シートを`extract`、`metadata`、`asset`、`reference_only`、`ignored`、`unknown`へ分類する。
5. `extract`シートに必要なE2Jプロンプト、処理単位、親キーを`routingPlan`へ記録する。
6. 未定義シートは黙って無視せずblocking issueにする。
7. `J-01` JSONだけを指定出力先へ書き込む。

## 完了条件

- 設計書内の全シートがマニフェストに存在する。
- 後続プロンプト、対象シート、処理単位、出力契約が一意である。
- 未分類シートが0件、またはblocking issueとして明示されている。

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
