# instructions/ — ファイル種別ごとの規約

`applyTo`（globパターン）に一致するファイルを扱うとき、Copilotに自動で適用される規約です。

| ファイル | 適用範囲 | 内容 |
| --- | --- | --- |
| [java-coding.instructions.md](java-coding.instructions.md) | `src/main/java/**/*.java` | 本番コードの規約（BigDecimal、トレーサビリティ等） |
| [junit-testing.instructions.md](junit-testing.instructions.md) | `src/test/java/**/*.java` | テストコードの規約（DisplayName、決定表網羅等） |
| [task-format.instructions.md](task-format.instructions.md) | `docs/tasks/**/*.md` | タスクファイルの形式（この形式が正） |

## 書き方のルール

- 「このファイルを書くとき常に守ること」だけを書く。作業の手順は skills へ、役割は agents へ。
- 規約は理由つきの短い箇条書きにする。長文の解説は書かない。
- 案件のコーディング規約が確定したら、まずここを更新する。
