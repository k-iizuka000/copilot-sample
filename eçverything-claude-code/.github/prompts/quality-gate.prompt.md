---
description: 対象範囲のフォーマット、lint、型、テストを実行し、品質ゲート結果を報告します。
---

# Quality Gate

This is a reusable VS Code prompt file, not a custom agent. Invoke it manually from chat, choosing the chat mode or custom agent that fits the task.

指定されたパスまたは現在のプロジェクトに対して品質ゲートを実行してください。`--fix` が明示されていない限り、自動修正は行わず結果を報告します。

## 入力

- 対象: 指定がなければ現在の作業範囲
- `--fix`: フォーマットや安全な自動修正を許可
- `--strict`: 警告も失敗扱いにする

## 手順

1. package scripts、設定ファイル、既存 CI から利用可能なチェックを特定する。
2. フォーマット、lint、型チェック、テストを可能な範囲で実行する。
3. `--fix` の場合も、破壊的変更や広範囲変更の前に確認する。
4. `edit` は `--fix` が指定された場合、またはユーザーが明示的に修正を承認した場合だけ使う。
5. 失敗はファイル位置、原因、修正案つきで整理する。

## 出力

- 対象範囲
- 実行したコマンド
- PASS/FAIL
- 自動修正の有無
- 残る問題と次のアクション
