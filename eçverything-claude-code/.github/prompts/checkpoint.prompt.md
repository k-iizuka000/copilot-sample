---
description: 作業状態のチェックポイントを作成、比較、一覧化します。
---

# チェックポイント

This is a reusable VS Code prompt file, not a custom agent. Invoke it manually from chat, choosing the chat mode or custom agent that fits the task.

目的は、現在の作業状態を後から比較できる形で記録または確認することです。ユーザーの指定がない場合は、まず `create`、`verify`、`list` のどれを実行するか確認してください。

## Related assets

- 推奨実行先: 通常のチャットまたは Agent mode（専用 custom agent なし）
- 必ず参照する skills: `.github/skills/verification-loop/SKILL.md`
- 関連 instructions: `.github/copilot-instructions.md`、報告時は `.github/instructions/documentation.instructions.md`、`.github` assets 編集時は `.github/instructions/agent-harness.instructions.md`

運用チェーン: git 状態を記録・比較し、stash や commit など履歴に影響する操作はユーザー確認なしに実行しない。

## 入力

- `create <name>`: 現在の状態を名前付きで記録
- `verify <name>`: 指定チェックポイントと現在状態を比較
- `list`: 既存チェックポイントを一覧化
- `clear`: 古いチェックポイント削除案を提示

## 手順

1. `git status` と現在のブランチを確認する。
2. `create` の場合、変更内容、テスト状態、記録方法を説明し、git stash や commit など履歴に影響する操作の前にユーザー確認を取る。
3. `verify` の場合、指定名に対応する記録、現在の差分、テスト/ビルド状態を比較する。
4. `list` の場合、名前、日時、Git SHA、現在との差分状態を表示する。

## 出力

- 実行した操作
- 変更または参照した記録
- 差分ファイル数
- 実行した検証コマンドと結果
- 未確認事項と次の推奨アクション
