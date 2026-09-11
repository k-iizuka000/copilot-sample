---
name: copilot-customization-advisor
description: GitHub Copilot (VS Code) 向けのカスタマイズを skill / custom agent / prompt file / instructions / hooks のどれで作るべきか、公式の最新仕様を根拠に提案する。「Copilot 用に A を作りたい」「どの種別で作るべきか」「Copilot の最新の書き方を確認したい」と言われたときに使う。
argument-hint: '[作りたいもの・やりたいこと] (例: PR レビュー手順を Copilot に覚えさせたい)'
---

# Copilot Customization Advisor

このスキルは、GitHub Copilot 向けのカスタマイズ (skill、custom agent、prompt file、
instructions、hooks、MCP) を **どの種別で作るべきか** を、公式の最新仕様を根拠に判断するためのものです。
仕様の調査は subagent `copilot-docs-researcher` に委譲し、このスキル自身は判断と提案に専念します。

## 最重要ルール

- 仕様を記憶で断言しない。frontmatter のキー名、配置場所、非推奨の有無は必ず subagent の調査結果か
  [references/](./references/) の原文で裏を取る。理由: Claude Code や Codex の記法 (`paths`、`effort`、`disallowedTools` など) と
  混同しやすく、間違ったキーは Copilot に無視されるだけで警告が出ない。
- このスキルの成果物は **提案レポート** まで。ファイルの生成はユーザーが種別を選んでから、別の依頼として行う。
- 調査に使う subagent は参照専用 (read / search / web fetch のみ)。編集やコマンド実行を頼まない。
- 既存資産 (`.github/` 配下) の流用で足りるなら新規作成を勧めない。
- 推奨を 1 つに絞れないときも、根拠付きで仮の推奨を出す。判断をユーザーに丸投げしない。

## 使う場面

- 「Copilot で A をやりたい。skill と agent どっちで作る?」
- 「この prompt file は skill に移すべき?」「instructions で足りる?」
- 「Copilot の custom agent の書き方 (model / tools / handoffs) を最新で確認したい」

使わない場面:

- Claude Code / Codex 向けのスキルやエージェントの設計 (記法が異なる)
- 既に種別が決まっていて、ファイルを書くだけの依頼 (公式の Agent Customizations editor や `/skills` で作る)

## 手順

### 1. 要望を 4 点に分解する

ユーザーの「A を作りたい」を次の 4 点に言い換え、不明な点はユーザーに 1 回で確認する。

| 観点 | 問い |
| --- | --- |
| 副作用 | 知識を与えるだけか、ファイル編集やコマンド実行を伴うか |
| 発動 | 常時適用か、ファイル種別で自動か、タスク内容で自動か、ユーザーが明示的に呼ぶか |
| 入出力 | 何を受け取り、何を返すか (観測できる形で) |
| 権限とモデル | ツール制限 (read-only など) や特定モデルの指定が必要か |

### 2. 既存資産を確認する

`.github/skills/`、`.github/agents/`、`.github/prompts/`、`.github/instructions/`、`.github/hooks/`、
`.github/copilot-instructions.md`、`AGENTS.md` を `#search` で確認し、似た目的の資産があれば列挙する。

### 3. 最新仕様を subagent に調べさせる

`agent` ツール (runSubagent) で `copilot-docs-researcher` を呼ぶ。1 回の呼び出しは 1 テーマ (1 つの種別) に絞る。
複数の種別を比べたいとき (例: skill と custom agent) は、種別ごとに分けて並列に呼ぶ。

```text
質問: <手順 1 の要望> を <種別> で作る場合の仕様
確認したい項目:
- <例: SKILL.md で使える frontmatter キーと、非推奨になったキー>
- <例: 補助ファイル (scripts/ references/) を読ませる条件>
返却: 出典 URL 付きの箇条書き。公式に記載が無い項目は「記載なし」と書く。
```

subagent が Web 取得に失敗してスナップショットを根拠にした場合は、提案に「スナップショット時点の仕様」と明記する。

<important if="agent ツールが無い、または copilot-docs-researcher が見つからない (Copilot CLI、cloud agent、code review など VS Code 以外で実行している)">
subagent を呼ばず、[references/decision-guide.md](./references/decision-guide.md) と
[references/vscode-docs/](./references/vscode-docs/)、[references/github-docs/](./references/github-docs/) の原文を直接読む。
提案レポートの出典欄には「スナップショット (取得日は references/SNAPSHOT.md)」と書き、最新仕様は未確認である旨を添える。
</important>

### 4. 種別を判定する

subagent の結果と次の判定表で候補を決める。判定表の詳細と落とし穴は
[references/decision-guide.md](./references/decision-guide.md) にある。

| 要望の形 | 第一候補 | よくある代替 |
| --- | --- | --- |
| プロジェクト全体に常時効かせたい規約 | `.github/copilot-instructions.md` | `AGENTS.md` (他ツールと共用するとき) |
| 特定のファイル種別にだけ効かせたい規約 | `.github/instructions/*.instructions.md` (`applyTo`) | copilot-instructions.md に書く (量が少ないとき) |
| 手順・スクリプト・テンプレを伴う再利用タスク | `.github/skills/<name>/SKILL.md` | prompt file (VS Code は skill への移行を推奨) |
| 役割 (ペルソナ) とツール制限、モデル指定が必要 | `.github/agents/<name>.agent.md` | skill + `context: fork` (役割が不要なとき) |
| 他エージェントから呼ばれる下請け | custom agent に `user-invocable: false` | skill の `context: fork` |
| ライフサイクルで必ず走る決定論的処理 | `.github/hooks/*.json` (preview) | CI / lint (Copilot に依存させない) |
| 外部システムへの接続 | MCP サーバー (`.vscode/mcp.json`) | `#web/fetch` (読み取りだけで足りるとき) |
| 上記の組み合わせを配布したい | Agent plugin | リポジトリを丸ごと共有 |

### 5. 提案レポートを返す

次の形で返す。推奨 1 つと代替 2 つまで。各項目に subagent が返した出典 URL を残す。

```text
## 推奨: <種別> (<配置パス>)
理由: <要望の 4 点との対応>

## 代替案
1. <種別>: <どんな場合にこちらが良いか> / 影響: <失うもの・増える設定>
2. <種別>: ...

## 既存資産の流用
- <流用できる既存ファイル> → <改良点> / なし

## 影響と落とし穴
- <必要な VS Code 設定、preview 機能、モデルの費用倍率、他ツールとの互換性>

## 出典
- <URL> (最新 Web 取得 / スナップショット YYYY-MM-DD)

## 未確認
- <公式に記載が無かった項目>
```

## Additional resources

- [references/decision-guide.md](./references/decision-guide.md): 判定表の詳細、種別ごとの必須設定、Claude Code / Codex との記法差分
- [references/README.md](./references/README.md): 同梱スナップショットの一覧、出典、ライセンス、更新方法
- [references/vscode-docs/](./references/vscode-docs/) と [references/github-docs/](./references/github-docs/): 公式ドキュメントの Markdown 原文
- [scripts/refresh-references.sh](./scripts/refresh-references.sh) / [scripts/refresh-references.ps1](./scripts/refresh-references.ps1): スナップショット更新

## Gotchas

- VS Code docs の URL は `/docs/copilot/customization/` から `/docs/agent-customization/` に移った。古い URL を出典にしない。
- custom agent の `infer` は非推奨。`user-invocable` と `disable-model-invocation` に分かれた。
- subagent に要求するモデルは親の費用ティアを超えられない。超えるモデルを要求すると subagent は実行されず、利用可能なモデルを報告して終わる (公式 subagents ページの記述)。
- `chat.agentSkillsLocations` は非推奨。スキルは `.github/skills/` など標準の場所に置く。
