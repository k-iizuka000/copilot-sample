---
description: 設計書ディレクトリを実装タスク群へ分解する。使い方 → /breakdown docs/designs/DS-001_振込手数料計算
agent: planner
---

# /breakdown — 設計書をタスクへ分解

指定された設計書ディレクトリを読み、`docs/tasks/<設計書ID>/` へタスクファイル群を生成してください。

- エージェント: `planner`（このプロンプトで自動選択されない場合は、チャットのエージェント選択で `planner` を選んでから実行する）
- 手順の詳細: skill `design-to-tasks`
- 出力形式の正: `.github/instructions/task-format.instructions.md`

## 引数

- このプロンプトに続けて設計書ディレクトリのパスを指定する（例: `/breakdown docs/designs/DS-001_振込手数料計算`）。
- パスの指定がない場合は、`docs/designs/` のディレクトリ一覧を提示して、どれを分解するか人間に確認してから始める。

## 完了時

- 生成したタスクの一覧、設計書カバレッジ表の結果（漏れの有無）、起こした質問票を報告する。
- タスクの実装は始めない。人間の確認を待つ。
