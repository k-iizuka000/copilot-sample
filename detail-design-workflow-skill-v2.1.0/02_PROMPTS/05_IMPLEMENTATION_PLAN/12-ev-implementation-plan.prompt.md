---
name: '12-ev-implementation-plan'
description: '詳細設計と実装計画の整合性評価'
argument-hint: 'markdownDirectory=... planPath=... outputPath=...'
agent: 'agent'
---

# 12-ev-implementation-plan

## 実行パラメータ

- **markdownDirectory**: `${input:markdownDirectory:詳細設計Markdown}`
- **planPath**: `${input:planPath:P-10実装計画}`
- **outputPath**: `${input:outputPath:J-90評価出力先}`

## 実行指示（全文）

## 参照契約

- `P-00`, `P-10`
- EV-02合格済みの詳細設計Markdown
- 評価対象の実装計画

## 唯一の役割

実装計画が詳細設計を漏れなく、推測なく、実行可能な粒度へ分割しているか評価する。計画を修正しない。

## 検査

1. 全Record IDがタスクまたは実装不要理由に対応する。
2. 詳細設計にない要件がない。
3. タスクIDが一意で安定している。
4. 各タスクに目的、対象、参照、前提、完了条件、テスト方法がある。
5. 1タスクが人間レビュー可能な大きさである。
6. 依存関係に循環や逆転がない。
7. blocking issue依存タスクが実装可能扱いになっていない。
8. ステータス値と列順が契約どおりである。

## 判定

- `FAIL`: 漏れ、過剰要件、巨大タスク、前提不備、完了条件またはテスト欠落。
- `PASS_WITH_WARNINGS`: 実装可能だが人間が確認すべき非blocking項目が残る。
- `PASS`: すべてのタスクを番号指定で安全に実行できる。

## 出力

J-90形式の評価結果だけを出力し、実装計画を変更しない。

## 最終応答

- 指定された出力ファイルを作成または更新する。
- チャット本文には、結果、出力先、件数、判定、blocking issueだけを簡潔に報告する。
- 指定された出力先以外を変更しない。
