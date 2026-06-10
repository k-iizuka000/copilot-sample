# reviews/ — レビュー結果置き場

`/review` を実行すると、reviewer がここへレビューレポートを生成します。

- ファイル名: `RV-<タスクID>-<連番>.md`（例: `RV-T-001-01.md`。同じタスクの再レビューは連番が増える）
- レポート形式: [.github/skills/spec-compliance-review/SKILL.md](../../.github/skills/spec-compliance-review/SKILL.md)
- 判定が「❌ 要修正」の場合は `/implement` で指摘対応 → 再度 `/review` のループになります。
- 判定が「✅ 承認」でも、人間が最終確認してからタスク完了としてください。
