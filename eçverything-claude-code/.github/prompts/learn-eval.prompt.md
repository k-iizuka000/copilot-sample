---
description: セッションから再利用可能な知見を抽出し、保存前に品質と保存先を評価します。
---

# Learn Eval

This is a reusable VS Code prompt file, not a custom agent. Invoke it manually from chat, choosing the chat mode or custom agent that fits the task.

今回の作業から再利用できる知見を抽出し、保存すべきかを評価してください。ファイル作成や追記は、ユーザー確認を得るまで行わないでください。

## Related assets

- 推奨実行先: 通常のチャットまたは Agent mode（専用 custom agent なし）
- 必ず参照する skills: `.github/skills/agentic-engineering/SKILL.md`、`.github` assets に保存する場合は `.github/skills/agent-harness-construction/SKILL.md`
- 関連 instructions: `.github/instructions/documentation.instructions.md`、`.github` assets を扱う場合は `.github/instructions/agent-harness.instructions.md`

運用チェーン: セッション知見を agentic-engineering 観点で評価し、`.github` assets 化する場合だけ agent-harness の規約に接続する。

## 抽出対象

- エラー解決パターン: 症状、根本原因、修正、再利用条件
- デバッグ技術: 有効だった調査順序やコマンド
- 回避策: ライブラリ、API、バージョン固有の注意
- プロジェクト固有知識: 規約、構成、運用判断

## 評価

1. 既存ドキュメントやスキルに重複がないか確認する。
2. 一度限りではなく、将来の作業で再利用できるか判断する。
3. 保存先を `Global` または `Project` として提案する。ただし実際の保存先はユーザーとプロジェクト方針に従う。
4. 判定は `Save`、`Improve then Save`、`Absorb into [X]`、`Drop` のいずれかにする。

## 出力

- 抽出候補
- 重複確認結果
- 判定と理由
- 保存または追記する場合の下書き
- 編集前確認の質問
