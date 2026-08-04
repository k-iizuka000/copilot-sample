# Copilot メモリー機構バンドル

GitHub Copilot（VS Code）に「信頼できる記憶」を持たせるためのファイル一式。

設計の骨子は1つ: **読み出しは Copilot の記憶力（Copilot Memory）に頼らず、`applyTo: "**"` の instructions ファイルとして毎回強制注入する。スキルが担うのは「書き込み」と「昇格」だけ。**

## 構成

```
.github/
├── copilot-instructions.md        # メモリー運用の常設ルール（既存ファイルがあれば該当節を追記）
├── instructions/
│   └── memory.instructions.md     # メモリー本体（applyTo: "**" で毎回注入される）
├── skills/
│   ├── remember/SKILL.md          # 記録スキル（「覚えておいて」「ちゃんとやってよ」で発火）
│   └── memory-triage/SKILL.md     # 整理スキル（「メモリー整理して」で棚卸し）
└── prompts/
    └── sample-task.prompt.md      # セルフチェックリスト型プロンプトファイルの見本
```

## 運用サイクル

1. **記録**: 会話中に「覚えておいて」「ちゃんとやってよ」と言う → remember スキルが、その時の状況（何の作業中に・何が起きて・どう直すよう言われたか）を `memory.instructions.md` へ M 番号付きで追記する
2. **昇格**: 同種の指摘が2回目に達すると昇格候補になり、Copilot が昇格を提案する → OK すると instructions またはプロンプトファイルへ転記され、メモリーから削除される
3. **棚卸し**: 「メモリー整理して」→ memory-triage スキルが全エントリを昇格・統合・削除・維持に分類して提案する

メモリーは「昇格 → 削除」で回転するため、太り続けない設計。

## 導入手順（3ステップ）

### 1. ファイルを対象リポジトリへコピー

- `.github/` の中身を対象リポジトリの `.github/` へコピーする
- 既存の `copilot-instructions.md` がある場合は上書きせず、本バンドルの「メモリー運用」「プロンプトファイルの実行規律」の2節だけを既存ファイル末尾へ追記する
- `sample-task.prompt.md` は見本。実タスク用に複製して使う（見本のままのコピーは不要）

### 2. VS Code 設定の確認

設定名はバージョンで変わることがあるため、設定 UI で検索して確認する:

- instructions ファイル: `github.copilot.chat.codeGeneration.useInstructionFiles` が有効（既定で有効な版もある）
- プロンプトファイル: `chat.promptFiles` が有効
- Agent Skills（SKILL.md）: 設定検索「skills」で確認。非対応の版でも下記フォールバックで動く

### 3. 動作確認（3つ）

1. チャットで「◯◯と覚えておいて」→ `memory.instructions.md` に M1 が追記され、「M1 として記録しました」と報告される
2. 同種の指摘をもう一度する → 回数が2になり昇格提案が来る。OK すると転記＋メモリーから削除される
3. 「メモリー整理して」→ 処置案の一覧表が出る

## スキルが発火しない場合（フォールバック）

Agent Skills 非対応の版でも運用は成立する。トリガー語と手順の要点は `copilot-instructions.md`（常時注入）に、エントリのフォーマットは `memory.instructions.md` 冒頭（常時注入）に書いてあるため、スキルはあくまで手順の詳細版。スキルが読まれなくても Copilot は記録の仕方を知っている。

## メモリーが肥大化したら（B 方式への移行）

昇格サイクルが回っていれば通常は不要。それでも常時注入が重くなったら:

1. `memory.instructions.md` には「昇格候補と直近の要注意エントリ」だけを残す
2. 全エントリは `.github/memory-ledger.md`（`applyTo` なし・常時注入されない台帳）へ移す
3. remember / memory-triage スキルの読み書き先を台帳に変更し、「昇格候補になったエントリは memory.instructions.md へも転載する」の1行を各スキルへ足す

## 公式 Copilot Memory との関係

公式の Copilot Memory（自動記憶・プレビュー）はオンのまま併用してよい。本バンドルとは書き込み先が別で干渉しない。本バンドルは「思い出してくれるかが運次第」問題を強制注入で回避するためのもの。

## 出典（公式ドキュメント）

- カスタム指示の種類と対応表: https://docs.github.com/en/copilot/reference/custom-instructions-support
- VS Code のカスタム指示: https://code.visualstudio.com/docs/agent-customization/custom-instructions
- Agent Skills: https://code.visualstudio.com/docs/agent-customization/agent-skills
- プロンプトファイル: https://code.visualstudio.com/docs/copilot/copilot-customization
- Copilot Memory（公式）: https://docs.github.com/en/copilot/concepts/agents/copilot-memory
