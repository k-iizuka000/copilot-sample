---
description: 失敗テストから始め、最小実装とリファクタリングまで進める TDD ワークフローです。
---

# TDD

This is a reusable VS Code prompt file, not a custom agent. Invoke it manually from chat, choosing the chat mode or custom agent that fits the task.

指定された機能またはバグ修正を TDD で進めてください。既存テストの構成を確認し、プロジェクトのテストフレームワークに合わせます。

## 手順

1. 要件と期待動作を整理する。
2. 対象のインターフェースや入出力を確認する。
3. まず失敗するテストを書く。
4. テストを実行し、期待した理由で失敗することを確認する。
5. 最小限の実装でテストを通す。
6. テストを緑のままリファクタリングする。
7. カバレッジや重要な境界条件を確認する。

## 出力

- 追加/変更したテスト
- RED の失敗内容
- GREEN の成功結果
- リファクタリング内容
- 実行したコマンド
- 未検証または追加すべきケース
