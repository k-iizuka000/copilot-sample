---
name: detail-design-workflow
description: 人間が明示的に「Excel設計書を詳細設計（出典付きJSON・責務分割Markdown）へ変換する」作業を行うときの入口。自動では発火しない。
user-invocable: true
disable-model-invocation: true
---

# 詳細設計ワークフロー（入口）

Excel設計書を、出典付き JSON（J-* JSON）を経由して責務分割された詳細設計 Markdown（`spec/` ツリー）へ変換するワークフローの入口。
このスキルは自動では動かない。人間が上記の変換作業を行うと決めたときにだけ使う。

## まず読むもの

1. パッケージ導入とクイックスタート: [README.md](../../../README.md)
2. 日々の作業手順（正本）: [RUNBOOK.md](./RUNBOOK.md)
3. 実行ルールの正本: [共通ルール](../../copilot-instructions.md)

## 実行入口

実行は `.github/prompts/` の Prompt File を使う（詳しい流れは RUNBOOK.md）。

- `/01-setup` — 初回・設計書追加時の棚卸しとルーティング計画
- `/02-run` — 次の1タスクを自動選択して実行（反復）
- `/03-check` — 意味照合（`/02-run` とは別チャットで実行）

コード実装・実装計画・テスト生成へは進まない。
