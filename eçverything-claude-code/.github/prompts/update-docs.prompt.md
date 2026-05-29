---
description: package.json や env サンプルなど信頼できる情報源から開発ドキュメントを更新します。
---

# Update Docs

This is a reusable VS Code prompt file, not a custom agent. Invoke it manually from chat, choosing the chat mode or custom agent that fits the task.

信頼できる情報源からドキュメントを同期してください。推測で運用手順を書かず、確認できない項目は未確認として明記します。

## Related assets

- 推奨 custom agent: `.github/agents/doc-updater.agent.md`
- 必ず参照する skills: `.github/skills/verification-loop/SKILL.md`、必要に応じて `.github/skills/docker-patterns/SKILL.md`、`.github/skills/deployment-patterns/SKILL.md`、`.github/skills/api-design/SKILL.md`、`.github` docs では `.github/skills/agent-harness-construction/SKILL.md`
- 関連 instructions: `.github/instructions/documentation.instructions.md`、`.github` assets 編集時は `.github/instructions/agent-harness.instructions.md`、秘密情報を避けるため `.github/instructions/security.instructions.md`

運用チェーン: doc-updater が信頼できる情報源を確認し、対象領域の skills/instructions と verification-loop でドキュメント差分を裏付ける。

## 信頼する情報源

- `package.json` の scripts と依存関係
- `.env.example` や設定テンプレート
- 既存 CI、Docker、デプロイ設定
- 既存 docs の明示的な手順

## 手順

1. scripts、環境変数、セットアップ、テスト、デプロイ関連ファイルを確認する。
2. 更新対象ドキュメントと変更方針を提示する。
3. `docs/CONTRIB.md`、`docs/RUNBOOK.md`、README など既存構成に合わせて更新する。
4. 古い可能性がある記述は、根拠とともに修正または未確認扱いにする。

## 出力

- 更新したドキュメント
- 参照した情報源
- 追加/削除した手順
- 未確認の運用項目
- 差分サマリー
