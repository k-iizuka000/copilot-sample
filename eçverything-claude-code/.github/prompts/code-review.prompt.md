---
description: 未コミット変更をセキュリティ、品質、テスト観点でレビューします。
---

# コードレビュー

This is a reusable VS Code prompt file, not a custom agent. Invoke it manually from chat, choosing the chat mode or custom agent that fits the task.

未コミット変更をレビューしてください。この prompt ではコードを編集せず、発見事項を優先度順に報告します。修正が必要な場合は、別の修正依頼または編集用 prompt に切り出してください。

## レビュー観点

- 重大: 認証情報、SQL injection、XSS、入力検証不足、危険な依存関係、path traversal
- 高: 長すぎる関数/ファイル、深いネスト、エラーハンドリング不足、不要なログ、重要 API の説明不足
- 中: テスト不足、アクセシビリティ、可変状態の乱用、保守性を下げる実装

## 手順

1. `git diff` と変更ファイルを確認する。
2. 変更行を中心に、周辺コードも必要な範囲で読む。
3. セキュリティ問題を最優先で検査する。
4. 重大または高優先度の問題がある場合は、コミットを止めるべき理由を明示する。

## 出力

- Findings first: 重大度、ファイル位置、問題、修正案
- Open questions
- 良かった点は短く
- 実行した確認コマンド
- 残るリスク
