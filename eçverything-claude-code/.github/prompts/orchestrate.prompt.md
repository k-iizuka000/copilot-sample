---
description: 複雑なタスクを調査、計画、実装、レビュー、検証のフェーズに分けて進めます。
---

# Orchestrate

This is a reusable VS Code prompt file, not a custom agent. Invoke it manually from chat, choosing the chat mode or custom agent that fits the task.

複雑なタスクを、役割ごとのフェーズに分けて進めてください。複数エージェントを使える環境では独立した調査やレビューを分担し、使えない環境では同じ順序を単一セッションで実行します。

## Related assets

- 推奨 custom agent: coordinator は `.github/agents/planner.agent.md`
- 専門 delegate: フェーズに応じて `.github/agents/tdd-guide.agent.md`、`.github/agents/code-reviewer.agent.md`、`.github/agents/security-reviewer.agent.md`、`.github/agents/database-reviewer.agent.md`、`.github/agents/e2e-runner.agent.md`、`.github/agents/doc-updater.agent.md`
- 必ず参照する skills: `.github/skills/agentic-engineering/SKILL.md`、`.github/skills/ai-first-engineering/SKILL.md`、`.github/skills/tdd-workflow/SKILL.md`、`.github/skills/verification-loop/SKILL.md`、`.github/skills/security-review/SKILL.md`、`.github/skills/ai-regression-testing/SKILL.md`
- 関連 instructions: `.github/copilot-instructions.md` と、変更対象に応じて `.github/instructions/agent-harness.instructions.md`、`.github/instructions/testing.instructions.md`、`.github/instructions/security.instructions.md`、`.github/instructions/java-spring.instructions.md`、`.github/instructions/database.instructions.md`、`.github/instructions/documentation.instructions.md`

運用チェーン: planner が作業をフェーズ化し、各段階で必要な delegate、skills、path-specific instructions にハンドオフする。

## ワークフロー

- `feature`: 計画 -> TDD 実装 -> コードレビュー -> セキュリティ確認
- `bugfix`: 再現調査 -> 失敗テスト -> 修正 -> 回帰確認
- `refactor`: 影響範囲調査 -> 小さな変更 -> テスト -> 差分レビュー
- `security`: 脅威観点の調査 -> 修正案 -> 必要最小限の変更 -> 再検証

## 手順

1. タスク種別、対象範囲、編集可否を確認する。
2. 各フェーズの入力、出力、未解決事項を短いハンドオフとして残す。
3. 編集に入る前に計画とリスクを提示する。ユーザーが「進めて」と依頼済みなら実装まで進む。
4. 最後に実行した検証と残る不確実性を明示する。

## 出力

- ワークフロー種別
- フェーズごとの要約
- 変更ファイル
- 実行したテスト/検証
- セキュリティまたは品質上の発見
- リリース可否またはブロッカー
