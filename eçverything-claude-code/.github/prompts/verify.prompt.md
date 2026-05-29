---
description: ビルド、型、lint、テスト、ログ監査、Git 状態を確認し、PR 準備状況を報告します。
---

# Verify

This is a reusable VS Code prompt file, not a custom agent. Invoke it manually from chat, choosing the chat mode or custom agent that fits the task.

現在のコードベースを検証してください。失敗した場合もこの prompt では編集せず、原因と修正案を報告します。修正が必要な場合は、別の修正依頼または編集用 prompt に切り出してください。

## Related assets

- 推奨実行先: Agent mode（この pack に専用 verifier agent はありません）
- 任意 reviewer: pre-pr やセキュリティ影響がある差分確認は `.github/agents/code-reviewer.agent.md`
- 必ず参照する skills: `.github/skills/verification-loop/SKILL.md`、`.github/skills/springboot-verification/SKILL.md`、pre-pr または security-sensitive scope では `.github/skills/security-review/SKILL.md`
- 関連 instructions: `.github/instructions/testing.instructions.md`、セキュリティ影響がある場合は `.github/instructions/security.instructions.md`、Java/Spring 対象は `.github/instructions/java-spring.instructions.md`

運用チェーン: Agent mode で検証を実行し、pre-pr や security-sensitive な範囲では code-reviewer と security-review を接続する。

## モード

- `quick`: ビルドと型チェック中心
- `full`: ビルド、型、lint、テスト、ログ監査、Git 状態
- `pre-commit`: 変更ファイルに関連するチェック
- `pre-pr`: full に加えてセキュリティ観点を強める

## 手順

1. package scripts、CI 設定、プロジェクト種別から検証コマンドを特定する。
2. ビルド、型チェック、lint、テストを順に実行する。
3. 重大な失敗があれば、その時点で止めて原因を報告する。
4. `console.log`、認証情報らしき文字列、未コミット変更を確認する。

## 出力

```text
検証: PASS/FAIL
ビルド: OK/FAIL
型: OK/FAIL
Lint: OK/FAIL
テスト: OK/FAIL
ログ監査: OK/FAIL
Git状態: clean/dirty
PR準備完了: YES/NO
```

あわせて、実行したコマンド、失敗詳細、未検証事項、次のアクションを示してください。
