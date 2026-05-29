# Copilot Prompt Files

このディレクトリの `*.prompt.md` は、VS Code などで手動実行する reusable prompt です。

prompt file 自体は custom agent ではありません。公式仕様では frontmatter も任意です。このパックでは、prompt を軽量で移植しやすく保つため、frontmatter は発見性のための `description` だけにしています。

## runner を固定しない理由

`.prompt.md` では `agent` や `tools` を指定できますが、指定すると実行環境や利用者の意図を強く縛ります。共有パックでは、利用者がその場で Ask、Plan、Agent、または custom agent を選べる形のほうが誤解が少なく、複数の Copilot クライアントへ持ち込みやすくなります。

特定のリポジトリで runner を固定したい場合だけ、対象 prompt に `agent` や `tools` を追加してください。

## 推奨実行先

| Prompt | 推奨 |
| --- | --- |
| `checkpoint.prompt.md` | Agent mode |
| `code-review.prompt.md` | Agent mode（編集なし）または `code-reviewer` custom agent |
| `e2e.prompt.md` | Agent mode または `e2e-runner` custom agent |
| `learn-eval.prompt.md` | Ask mode |
| `learn.prompt.md` | Ask mode |
| `orchestrate.prompt.md` | Agent mode |
| `plan.prompt.md` | Plan mode |
| `quality-gate.prompt.md` | Agent mode |
| `skill-create.prompt.md` | Agent mode |
| `tdd.prompt.md` | Agent mode または `tdd-guide` custom agent |
| `test-coverage.prompt.md` | Agent mode |
| `update-docs.prompt.md` | Agent mode または `doc-updater` custom agent |
| `verify.prompt.md` | Agent mode |
