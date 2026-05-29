---
description: Git 履歴と既存コードからチームの実践パターンを抽出し、スキル文書案を作成します。
---

# Skill Create

This is a reusable VS Code prompt file, not a custom agent. Invoke it manually from chat, choosing the chat mode or custom agent that fits the task.

リポジトリの Git 履歴と既存ファイルから、チームの繰り返しパターンを抽出し、Copilot などの AI 支援に渡せるスキル文書案を作成してください。新規ファイルの作成先は、ユーザー確認を得てから決めます。

## 分析対象

- コミットメッセージ規約
- 一緒に変更されるファイル
- フォルダ構成と命名規則
- テスト配置と実行パターン
- リリース、レビュー、ドキュメント更新の運用

## 手順

1. 直近コミット、変更頻度、主要ディレクトリを確認する。
2. 推測ではなく、確認できた evidence に基づいてパターンを列挙する。
3. スキル文書として残す価値があるものだけを選ぶ。
4. 出力先、ファイル名、内容を提示し、ユーザー確認後に作成する。

## 出力

- 分析したコミット数と範囲
- 抽出したパターン
- evidence
- 生成する文書案
- 編集前確認の質問
