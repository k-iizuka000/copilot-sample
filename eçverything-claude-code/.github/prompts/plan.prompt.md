---
description: 要件を整理し、リスクと段階的な実装計画を提示します。
---

# Plan

This is a reusable VS Code prompt file, not a custom agent. Invoke it manually from chat, choosing the chat mode or custom agent that fits the task.

コードに触れる前に、要件、影響範囲、実装計画を整理してください。ユーザーが明示的に承認するまで編集しないでください。

## Related assets

- 推奨 custom agent: `.github/agents/planner.agent.md`
- 任意 delegate: アーキテクチャ比重が高い場合は `.github/agents/architect.agent.md`
- 必ず参照する skills: `.github/skills/agentic-engineering/SKILL.md`、`.github/skills/ai-first-engineering/SKILL.md`、必要に応じて `.github/skills/api-design/SKILL.md`、`.github/skills/database-migrations/SKILL.md`、`.github/skills/deployment-patterns/SKILL.md`
- 関連 instructions: `.github/copilot-instructions.md` と、対象パスに応じて `.github/instructions/agent-harness.instructions.md`、`.github/instructions/java-spring.instructions.md`、`.github/instructions/database.instructions.md`、`.github/instructions/security.instructions.md`、`.github/instructions/testing.instructions.md`、`.github/instructions/documentation.instructions.md`

運用チェーン: planner が要求とリスクを整理し、必要な専門 skill と path-specific instructions を参照して編集前計画に落とす。

## 手順

1. ユーザー要求を自分の言葉で再整理する。
2. 関連ファイル、既存パターン、依存関係を確認する。
3. 実装フェーズを小さく分ける。
4. リスク、ブロッカー、確認が必要な点を挙げる。
5. 検証戦略を具体的なコマンドや確認手順で示す。

## 出力

- 要件の再整理
- 対象範囲と対象外
- 実装フェーズ
- リスクと判断ポイント
- 検証計画
- 編集開始前の確認質問
