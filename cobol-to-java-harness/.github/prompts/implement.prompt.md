---
description: タスク1件をTDDで実装する。使い方 → /implement docs/tasks/DS-001/T-001_入力値の区分enumと検証.md
agent: implementer
---

# /implement — タスクをTDDで実装

指定されたタスクファイル1件を、テストファースト（TDD）で実装してください。

- エージェント: `implementer`（自動選択されない場合は、チャットのエージェント選択で `implementer` を選んでから実行する）
- 手順の詳細: skill `tdd-junit`、カバレッジは skill `jacoco-coverage`
- コード規約: `.github/instructions/java-coding.instructions.md`、`.github/instructions/junit-testing.instructions.md`

## 引数

- このプロンプトに続けてタスクファイルのパスを指定する。
- パスの指定がない場合は、`docs/tasks/` の `_index.md` から「未着手」かつ依存が解決済みの先頭タスクを提示し、それで良いか人間に確認してから始める。

## 再実装（レビュー指摘対応）の場合

- タスクのステータスが「修正中」のときは、対応するレビューレポート（`docs/reviews/RV-<タスクID>-*.md` の最新）を読み、Blocker / Major の指摘へ**1件ずつ**対応する。対応もTDDで行う（再現テスト → 修正）。

## 完了時

- テスト件数・`mvn clean verify` の結果・カバレッジを報告し、タスクのステータスを「レビュー待ち」に更新する。
- 自分でレビューを始めない。`/review` の実行を案内して止まる。
