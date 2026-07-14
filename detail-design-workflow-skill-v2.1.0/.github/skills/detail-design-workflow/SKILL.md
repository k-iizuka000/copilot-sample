---
name: detail-design-workflow
description: Use when converting Excel design documents into traceable JSON and then into detailed-design Markdown, including source-fidelity and Markdown-integrity evaluation.
argument-hint: "対象機能、工程番号、入力、出力先を指定"
user-invocable: true
disable-model-invocation: true
---

# 詳細設計ワークフロー

Excel設計書から直接Markdownを作らない。まず出典付きJ-* JSONへ構造化し、原本忠実性を評価してから、検証済みJSONをM-* Markdownへ変換する。

## 必ず先に読むもの

1. [共通Instructions](../../copilot-instructions.md)
2. [標準作業手順](./RUNBOOK.md)
3. [入出力契約一覧](./contracts/CONTRACT-INDEX.md)
4. [設計書プロファイル一覧](./profiles/PROFILE-INDEX.md)

## 標準順序

```text
設計書棚卸し
→ 必要な構造化JSON抽出
→ JSONごとの原本忠実性評価
→ 人間によるJSON確認
→ 詳細設計Markdown生成
→ Markdown整合性評価
→ 人間による詳細設計確認
```

実行入口は[`.github/prompts`](../../prompts/)の番号付きPrompt Filesとする。実装計画、コード実装、実装レビュー、テスト生成へは進まない。
