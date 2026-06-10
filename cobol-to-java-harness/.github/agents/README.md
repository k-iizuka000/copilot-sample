# agents/ — エージェント定義

Copilotの「役割」の定義です。チャットのエージェント選択（または対応する `/プロンプト`）で切り替えて使います。

| エージェント | 役割 | 起動プロンプト | コードを書く？ |
| --- | --- | --- | --- |
| [planner](planner.agent.md) | 設計書 → タスク分解 | `/breakdown` | 書かない（タスクmdのみ） |
| [implementer](implementer.agent.md) | TDDでJava実装 | `/implement` | 書く（src/ 配下） |
| [reviewer](reviewer.agent.md) | 設計書との突合レビュー | `/review` | 書かない（レポートmdのみ） |

## 書き方のルール

- 1ファイル = 1役割。「入力と出力」「手順」「禁止事項」「完了条件」の4点を必ず書く。
- 具体的な作業手順・コマンド・テンプレートはここに書かず、`.github/skills/` に置いて参照する（エージェント定義は「誰が何をするか」、skillは「どうやるか」）。
- frontmatterの `tools` で権限を絞る（例: planner に `execute` は不要）。
