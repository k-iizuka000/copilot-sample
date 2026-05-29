# GitHub Copilot カスタマイズ配布パック

このフォルダは、Claude 風の参照資料をもとに GitHub Copilot 向けへ整理したカスタマイズ配布パックです。リポジトリ横断で使うための `.github/`、必要に応じて参照する `agents/`、`skills/`、`prompts/` 相当の素材をまとめています。

## 有効化

この `eçverything-claude-code/.github/` は、`copilot-sample` ルートからは入れ子の配布物として扱われます。`copilot-sample` ルートで作業しても、この `.github` は Copilot の有効な設定として読み込まれません。

有効化するには、次のどちらかを選んでください。

- 対象リポジトリのルートへ `eçverything-claude-code/.github/` をコピーする。
- ローカル試用では `eçverything-claude-code` フォルダ自体をワークスペースルートとして開く。

## 互換性

| Surface | 互換性 | 用途 |
| --- | --- | --- |
| GitHub.com cloud agent / coding agent | 主要対象 | リポジトリ全体の作業方針、タスク別指示、レビュー補助 |
| Copilot CLI | 参考利用 | 端末での変更方針、検証、報告粒度の統一 |
| VS Code / Visual Studio / JetBrains | 主要対象 | エディタ内補完、チャット、変更提案の常時ガイド |
| Code review | 主要対象 | セキュリティ、テスト、保守性、未検証事項の確認 |
| Prompt files | 補助対象 | VS Code などで手動実行する反復タスク用の reusable prompt |

## 各 surface の役割

- `.github/copilot-instructions.md`: リポジトリ全体に常時適用する短い原則。
- `.github/instructions/*.instructions.md`: `applyTo` で対象パスを絞るタスク別・領域別の指示。
- `.github/agents/`: 特定の役割で調査、設計、レビューを進めるためのエージェント定義を置く場所。
- `.github/skills/`: 詳細な作業手順や専門知識を、必要時に参照するための場所。
- `.github/prompts/`: 繰り返し使う依頼文、レビュー観点、チェックリストを置く場所。prompt file 自体は agent ではありません。frontmatter は任意で、このパックでは移植性を優先して `description` だけを使います。実行時の Ask、Plan、Agent、custom agent は利用者が選びます。

## 参照素材

トップレベルの `rules/`、`contexts/`、`agents/`、`skills/`、`commands/` は移植元の参考資料です。Copilot で常時有効にする指示ではありません。新しく使う場合は、`.github/` 配下の形式に変換してから対象リポジトリへコピーしてください。

## 公開リポジトリでの安全性

- 公開して困るシークレット、内部 URL、顧客情報、認証情報を含めないでください。
- 指示は短く、自己完結させ、同じ内容を複数ファイルで矛盾させないでください。
- セキュリティや本番変更に関わる作業では、調査結果、実行した検証、未検証の範囲を明記してください。
- 配布後は対象リポジトリで Copilot が実際に読む位置へ `.github/` が置かれていることを確認してください。
