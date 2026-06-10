# tasks/ — 実装タスク置き場

`/breakdown` を実行すると、planner がここへ設計書ごとのタスクを生成します。

```
docs/tasks/<設計書ID>/
├── _index.md            # タスク一覧・依存関係・設計書カバレッジ表（まずこれを見る）
└── T-NNN_<タスク名>.md   # 個別タスク
```

- ファイル形式の正: [.github/instructions/task-format.instructions.md](../../.github/instructions/task-format.instructions.md)
- 人間は `/breakdown` の後にタスク内容を確認し、問題なければ `/implement` へ進めてください。
