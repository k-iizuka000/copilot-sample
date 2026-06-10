# prompts/ — 起動コマンド

チャットで `/プロンプト名` と入力して使う、定型作業の入口です。

| プロンプト | 使い方 | 動くエージェント |
| --- | --- | --- |
| [/breakdown](breakdown.prompt.md) | `/breakdown docs/designs/DS-001_振込手数料計算` | planner |
| [/implement](implement.prompt.md) | `/implement docs/tasks/DS-001/T-001_xxx.md` | implementer |
| [/review](review.prompt.md) | `/review docs/tasks/DS-001/T-001_xxx.md` | reviewer |

3つとも「引数なし」で実行すると、対象の候補を一覧して確認してから始めます。

## 書き方のルール

- プロンプトは「何を・どの引数で・どこまでやるか」の指示だけ。役割の詳細は agents、手順は skills に置く。
- frontmatterの `agent:` でエージェントを指定する。環境が対応していない場合は、チャットのエージェント選択で手動で切り替えてから実行する。
