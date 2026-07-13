---
name: detail-design-workflow
description: Use when converting standardized Excel design documents into traceable JSON and detailed-design Markdown, planning implementation by feature, executing one approved task, or reviewing implementation against design evidence.
argument-hint: "対象機能、工程番号、入力、出力先を指定"
user-invocable: true
disable-model-invocation: true
---

# 詳細設計ワークフロースキル

## 核心

設計書から直接実装しない。まず出典付きJSONを作り、原本忠実性を評価し、検証済みJSONから詳細設計Markdownを作る。その後、人間承認済みの1行1タスクだけを実装し、実装後に設計との一致を再評価する。

## 必ず先に読むもの

1. [画面・機能単位の標準作業手順](../01_RUNBOOK/01_SCREEN_FEATURE_RUNBOOK.md)
2. [契約インデックス](../03_CONTRACTS/CONTRACT-INDEX.md)
3. 対象設計書の[プロファイル](../04_PROFILES/PROFILE-INDEX.md)
4. [プロンプトインデックス](../02_PROMPTS/PROMPT-INDEX.md)

## 標準順序

```text
設計書棚卸し
→ 必要な構造化JSON抽出
→ JSONごとの原本忠実性評価
→ 詳細設計Markdown生成
→ Markdown整合性評価
→ 人間承認
→ 実装計画生成
→ 実装計画評価
→ 人間承認
→ 1タスク実装
→ タスクレビュー
→ 人間承認
→ 全タスク反復
→ 機能完了レビュー
→ 人間最終承認
```

## 絶対ルール

- 設計書にない仕様を作らない。
- 出典のない確定事実を作らない。
- 1回のE2Jは1冊、1シート、または1論理ブロックに絞る。
- すべてのsourceUnitの行方を説明する。
- `FAIL`成果物を次工程へ渡さない。
- blocking issueがある状態で実装へ進まない。
- 実装は承認済みの実装計画番号1件だけを対象にする。
- AIの生成・評価結果を、人間承認なしで完了扱いしない。
- ターミナルまたはCLIを標準手順に含めない。
