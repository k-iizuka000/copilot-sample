# skills/ — 作業手順書

エージェントの「手足」になる具体的な手順・コマンド・テンプレート集です。
各エージェントが作業時に参照します（`<skill名>/SKILL.md`）。

| skill | 内容 | 主な利用者 |
| --- | --- | --- |
| [design-to-tasks](design-to-tasks/SKILL.md) | 設計書の読み方、タスク分割基準、カバレッジ表、質問票の起票 | planner |
| [tdd-junit](tdd-junit/SKILL.md) | Red-Green-Refactorの厳密な回し方、JUnit 5の道具の使い分け | implementer |
| [spec-compliance-review](spec-compliance-review/SKILL.md) | 三点突合、テスト品質アンチパターン検出、レポート形式 | reviewer |
| [jacoco-coverage](jacoco-coverage/SKILL.md) | カバレッジ計測、不足分岐の特定、除外の承認手続き | implementer / reviewer |

## 書き方のルール

- frontmatterは `name` と `description` のみ。`description` には「いつ使うか」を必ず書く（これを見て読み込まれるため）。
- 内容は手順・コマンド・テンプレート・判断基準に限定する。プロジェクトの背景説明は書かない。
- 手順が変わったらここを直す。エージェント定義は変えなくて済む構造を保つ。
