---
description: テストカバレッジを分析し、不足ケースのテストを追加して改善結果を報告します。
---

# Test Coverage

This is a reusable VS Code prompt file, not a custom agent. Invoke it manually from chat, choosing the chat mode or custom agent that fits the task.

既存のテストカバレッジを確認し、不足している重要ケースを追加してください。テスト追加前に、対象ファイルと狙う分岐を短く提示します。

## Related assets

- 推奨 custom agent: `.github/agents/tdd-guide.agent.md`
- 必ず参照する skills: `.github/skills/tdd-workflow/SKILL.md`、`.github/skills/springboot-tdd/SKILL.md`、`.github/skills/ai-regression-testing/SKILL.md`、`.github/skills/verification-loop/SKILL.md`
- 関連 instructions: `.github/instructions/testing.instructions.md`、`.github/instructions/java-spring.instructions.md`

運用チェーン: tdd-guide が不足分岐をテスト追加に変換し、coverage 前後比較を verification-loop で報告する。

## 手順

1. プロジェクトのカバレッジ実行コマンドを特定する。
2. カバレッジを実行し、summary や HTML/LCOV レポートを確認する。
3. 80% 未満、または重要ロジックなのに未検証のファイルを優先する。
4. happy path、エラー処理、null/undefined/空、境界条件を追加する。
5. 新しいテストを実行し、前後比較を報告する。

## 出力

- カバレッジ実行コマンド
- 低カバレッジ箇所
- 追加したテスト
- 前後のカバレッジ
- まだ残る未検証リスク
