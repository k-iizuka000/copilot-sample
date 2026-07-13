---
name: '14-rev-task'
description: '1タスクの実装差分をレビュー'
argument-hint: 'featureId=... taskId=... planPath=... detailDesignDirectory=... executionReportPath=... reviewOutputPath=...'
agent: 'agent'
---

# 14-rev-task

## 実行パラメータ

- **featureId**: `${input:featureId:機能ID}`
- **taskId**: `${input:taskId:実装計画番号}`
- **planPath**: `${input:planPath:P-10実装計画}`
- **detailDesignDirectory**: `${input:detailDesignDirectory:詳細設計Markdown}`
- **executionReportPath**: `${input:executionReportPath:R-10実装結果}`
- **reviewOutputPath**: `${input:reviewOutputPath:R-20レビュー出力先}`

## 実行指示（全文）

## 参照契約

- `P-10`の指定タスク行
- 参照された詳細設計Markdown
- 対象差分とR-10実装結果
- `R-20` タスクレビュー結果

## 唯一の役割

指定タスクの実装差分を、詳細設計、完了条件、テスト、変更範囲に照らして評価する。コードを修正しない。

## 検査

1. 指定タスク以外の変更がない。
2. 参照Record IDの仕様が漏れなく実装されている。
3. 設計書にない動作が追加されていない。
4. 完了条件を満たす証跡がある。
5. テストが条件、境界、異常系を必要範囲で確認する。
6. 未実施テストが成功扱いされていない。
7. 意図しない変更、コンパイル懸念、未確認事項が明示されている。

## 判定

- `FAIL`: 漏れ、過剰実装、対象外変更、テスト不十分、完了条件未達。
- `PASS_WITH_WARNINGS`: 実装自体は適合するが、人間確認または未実施テストが残る。
- `PASS`: 設計、範囲、完了条件、テストがすべて一致。

## 出力

R-20だけを出力する。修正はIMP-01の再実行として別に行う。

## 最終応答

- 指定された出力ファイルを作成または更新する。
- チャット本文には、結果、出力先、件数、判定、blocking issueだけを簡潔に報告する。
- 指定された出力先以外を変更しない。
