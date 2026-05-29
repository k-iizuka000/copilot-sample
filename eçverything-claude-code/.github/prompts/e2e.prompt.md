---
description: 重要ユーザーフローの Playwright E2E テストを作成、実行、報告します。
---

# E2E テスト

This is a reusable VS Code prompt file, not a custom agent. Invoke it manually from chat, choosing the chat mode or custom agent that fits the task.

指定されたユーザーフローを、Playwright などプロジェクトで使われている E2E ツールで検証してください。既存のテスト規約を先に確認し、既存パターンに合わせます。

## 手順

1. 対象フロー、画面、API、既存 E2E 設定を確認する。
2. テストが未整備なら、編集前に作成予定ファイルとテスト観点を提示する。
3. 重要な happy path、空状態、エラー状態をテストに含める。
4. テストを実行し、失敗時はスクリーンショット、trace、ログなど利用可能な証拠を確認する。
5. 不安定な待機や brittle selector があれば修正する。

## 出力

- 対象ユーザーフロー
- 追加/変更したテストファイル
- 実行コマンドと結果
- 取得できた artifacts
- 失敗が残る場合の原因、再現手順、次の修正案
