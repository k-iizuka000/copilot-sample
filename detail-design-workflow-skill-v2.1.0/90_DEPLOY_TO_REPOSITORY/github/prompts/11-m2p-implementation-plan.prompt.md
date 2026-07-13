---
name: '11-m2p-implementation-plan'
description: '詳細設計から1行1タスクの実装計画を作成'
argument-hint: 'featureId=... markdownDirectory=... ev02Path=... outputPath=...'
agent: 'agent'
---

# 11-m2p-implementation-plan

## 実行パラメータ

- **featureId**: `${input:featureId:機能ID}`
- **markdownDirectory**: `${input:markdownDirectory:EV-02合格済みMarkdown}`
- **ev02Path**: `${input:ev02Path:EV-02結果}`
- **outputPath**: `${input:outputPath:P-10実装計画出力先}`

## 実行指示（全文）

## 参照契約

- `P-00` 実装計画共通契約
- `P-10` 実装計画テンプレート
- EV-02合格済みの詳細設計Markdown一式

## 前提

- EV-02が`PASS`または、人間が受容した`PASS_WITH_WARNINGS`である。
- blocking issueが0件である。残る場合は関連タスクを`要確認`にし、実装可能と判断しない。

## 唯一の役割

詳細設計を、依存関係とレビュー可能性を考慮した1行1タスクの実装計画へ変換する。実装はしない。

## 手順

1. 詳細設計の全Record IDを読み、必要な成果物とテストを洗い出す。
2. 同じ目的で一体変更が必要な範囲だけを1タスクにまとめる。
3. 対象ファイルを確定できない場合、責務と候補を明示し`要確認`にする。
4. 依存先を先に並べ、前提タスクIDを付ける。
5. 各タスクに詳細設計Record ID、完了条件、テスト方法を付ける。
6. タスク番号を`{featureId}-001`から連番で発行する。
7. 全Record IDが少なくとも1タスクまたは「実装不要理由」に対応することを確認する。
8. P-10形式で実装計画だけを出力する。

## 禁止

- 設計書にない実装要件の追加。
- 1タスクに多数の独立目的を入れること。
- テストだけを後回しにする大きな一括タスク。
- 実装や既存コード変更。

## 最終応答

- 指定された出力ファイルを作成または更新する。
- チャット本文には、結果、出力先、件数、判定、blocking issueだけを簡潔に報告する。
- 指定された出力先以外を変更しない。
