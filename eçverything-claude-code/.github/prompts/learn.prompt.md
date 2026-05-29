---
description: 作業セッションから再利用可能なパターンを抽出し、保存用の下書きを作ります。
---

# Learn

This is a reusable VS Code prompt file, not a custom agent. Invoke it manually from chat, choosing the chat mode or custom agent that fits the task.

現在のセッションを振り返り、次回以降に役立つパターンを抽出してください。保存は行わず、ユーザー確認用の下書きまで作ります。

## 抽出するもの

- 非自明なエラーの原因と修正
- 効果があった調査手順
- プロジェクト固有の規約や判断
- 何度も使えそうなテスト、検証、運用の型

## 除外するもの

- 単純な typo
- 一度限りの外部障害
- 抽象的すぎて行動に移せない教訓

## 出力

- パターン名
- 適用される状況
- 問題
- 解決策
- 例
- 使用タイミング
- 保存する場合の推奨先
- 「この内容で保存してよいか」の確認質問
