---
name: agentic-engineering
description: AI agentに実装や調査を任せる作業を、eval-first、検証可能な小単位、コスト意識のある進め方へ分解するときに使う。
---

# Agentic Engineering

agentic engineering では、人間は「何を満たせば良いか」「どう検証するか」「どのリスクを許容しないか」を設計し、AI agent には狭く検証可能な作業を渡します。

## 使うタイミング

- 複数ファイルにまたがる実装を依頼する前
- 調査、修正、検証を一連の loop にしたいとき
- agent が途中で迷いやすい作業を分解するとき
- AI 生成コードの品質を安定させたいとき

## Eval-first loop

1. 現在の失敗、期待挙動、受け入れ条件を短く書く。
2. 可能なら先に failing test / reproduction / smoke command を作る。
3. 変更範囲と触ってはいけない範囲を明示する。
4. 実装後に同じ検証を再実行する。
5. 結果を「verified」「not verified」「remaining risk」に分けて報告する。

## タスク分解

- 1つの作業単位に主要リスクを1つだけ持たせる。
- 各単位に入力、出力、完了条件、検証方法を付ける。
- database、security、public API、deployment は専用の検証単位に分ける。
- 大きな変更では、まず read-only investigation と plan を置いてから実装へ進む。

## Agentへの依頼テンプレート

```text
目的:
制約:
編集してよい範囲:
調査してよい範囲:
完了条件:
必ず走らせる検証:
報告してほしい未検証事項:
```

## レビューの重点

- 不変条件と edge case
- error boundary と retry / rollback
- 認証、認可、入力検証
- migration と deploy の互換性
- 複数コードパスの contract 一致

## コスト規律

- 大きな文書を常に貼らず、必要な skill や参照ファイルだけ読む。
- 迷ったら作業を小さく分け、短い検証で早く失敗させる。
- 調査結果、コマンド、失敗ログを残し、同じ探索を繰り返さない。
