# 種別判定ガイド (VS Code / GitHub Copilot)

SKILL.md の判定表を補足する。本文の根拠は同ディレクトリの公式 docs 原文
([vscode-docs/](./vscode-docs/) と [github-docs/](./github-docs/))。
取得日は [SNAPSHOT.md](./SNAPSHOT.md) を見る。仕様の細部が判断を左右するときは
subagent `copilot-docs-researcher` に最新を取り直させる。

## 1. 種別ごとの要点

### Custom instructions

- 配置: `.github/copilot-instructions.md` (常時)、`.github/instructions/<name>.instructions.md` (`applyTo` の glob で自動)、`AGENTS.md` (ルート。`chat.useAgentsMdFile`)。`CLAUDE.md` も読まれる。
- frontmatter (`*.instructions.md`): `name`、`description`、`applyTo` はすべて任意。
- 向く: コーディング規約、レビュー観点、コミットメッセージ規則。
- 向かない: 手順やスクリプトを伴う作業。VS Code と GitHub.com 以外には持ち運べない。
- 原文: [vscode-docs/custom-instructions.md](./vscode-docs/custom-instructions.md)、[github-docs/custom-instructions-support.md](./github-docs/custom-instructions-support.md)

### Agent Skills

- 配置: `.github/skills/<name>/SKILL.md` (`.claude/skills/`、`.agents/skills/` も可)。個人用は `~/.copilot/skills/` など。
- frontmatter: `name` (必須。小文字英数とハイフン、64 字以内、ディレクトリ名と一致)、`description` (必須、1024 字以内、何をするかといつ使うか)、
  `argument-hint`、`user-invocable` (既定 true)、`disable-model-invocation` (既定 false)、`context: fork` (専用 subagent で実行。設定 `github.copilot.chat.skillTool.enabled` が必要)。
  agentskills.io 仕様の `license`、`compatibility`、`metadata`、`allowed-tools` (実験的) も書ける。
- スキル自体に `model` や `tools` は無い。モデル指定やツール制限が要るなら custom agent と組み合わせる。
- 補助ファイルは SKILL.md から相対パスのリンクで参照しないと読まれない。
- 向く: 手順書、スクリプト、テンプレを伴う再利用タスク。VS Code / Copilot CLI / cloud agent / code review で共通に使える。
- 原文: [vscode-docs/agent-skills.md](./vscode-docs/agent-skills.md)、[github-docs/about-agent-skills.md](./github-docs/about-agent-skills.md)、[github-docs/add-skills.md](./github-docs/add-skills.md)

### Custom agents

- 配置: `.github/agents/<name>.agent.md` (`.claude/agents/` も可)。個人用は `~/.copilot/agents/`。
- frontmatter: `name`、`description`、`argument-hint`、`tools` (配列。`'read'`、`'search'`、`'edit'`、`'execute'`、`'web/fetch'`、`'agent'`、`'<MCP サーバー名>/*'` など)、
  `agents` (子として呼べる agent の許可リスト。`['*']` で全許可、`[]` で禁止。`agent` ツールが必要)、
  `model` (文字列または優先順の配列。例 `['Claude Haiku 4.5 (copilot)', 'GPT-5.4 mini (copilot)']`)、
  `user-invocable` (false でドロップダウンから隠し、subagent 専用にする)、`disable-model-invocation` (true で他 agent から呼ばれない)、
  `target` (`vscode` / `github-copilot`)、`handoffs` (label / agent / prompt / send / model)、`hooks` (preview)。
- `infer` は非推奨。`mcp-servers` は cloud agent (`target: github-copilot`) 専用で VS Code では無視される。
- 向く: 役割固定、read-only などのツール制限、モデル固定、他 agent からの下請け。
- 原文: [vscode-docs/custom-agents.md](./vscode-docs/custom-agents.md)、[github-docs/custom-agents-configuration.md](./github-docs/custom-agents-configuration.md)

### Subagents

- 呼び出しは `agent` ツール (`runSubagent`)。結果は要約で親に戻り、子の途中経過は親のコンテキストに残らない。
- モデルの優先順位: 呼び出し時の明示指定 > agent の `model` > 親のモデル。**親より高い費用ティアのモデルは指定できない**。
- ネストは既定で無効 (`chat.subagents.allowInvocationsFromSubagents`)。
- 原文: [vscode-docs/subagents.md](./vscode-docs/subagents.md)

### Prompt files

- 配置: `.github/prompts/<name>.prompt.md`。`/name` で呼ぶ。
- frontmatter: `name`、`description`、`argument-hint`、`agent` (`ask` / `agent` / `plan` / custom agent 名)、`model`、`tools`。旧 `mode` は使わない。
- VS Code は prompt file を skill へ移行する機能を提供している (`chat.customizations.promptMigration.enabled`)。新規に作るなら skill を優先する。
- 原文: [vscode-docs/prompt-files.md](./vscode-docs/prompt-files.md)、[vscode-docs/overview.md](./vscode-docs/overview.md)

### Hooks (preview)

- 配置: `.github/hooks/<name>.json`。個人用は `~/.copilot/hooks/`。custom agent の frontmatter `hooks` にも書ける (要 `chat.useCustomAgentHooks`)。
- イベント: SessionStart、UserPromptSubmit、PreToolUse、PostToolUse、PreCompact、SubagentStart、SubagentStop、Stop。
- 向く: フォーマッタ実行、危険コマンドのブロックなど、必ず走らせたい決定論的処理。LLM の注意力に頼らない。
- 原文: [vscode-docs/hooks.md](./vscode-docs/hooks.md)、[vscode-docs/hooks-reference.md](./vscode-docs/hooks-reference.md)、[github-docs/hooks-reference.md](./github-docs/hooks-reference.md)

### MCP / Tool sets / Agent plugins

- MCP: `.vscode/mcp.json` (ワークスペース) または `~/.copilot/mcp-config.json`。外部システムへの読み書き。
- Tool sets: 複数ツールをまとめて `tools` から名前で参照する。
- Agent plugins: skill / agent / hooks / MCP を束ねて配布する単位。
- 原文: [vscode-docs/mcp-servers.md](./vscode-docs/mcp-servers.md)、[vscode-docs/tool-sets.md](./vscode-docs/tool-sets.md)、[vscode-docs/agent-plugins.md](./vscode-docs/agent-plugins.md)

## 2. 判定の順序

1. **決定論で済むか**: lint、CI、hooks で 100% 通せる処理を skill にしない。
2. **常時か、条件付きか**: 常時なら instructions。ファイル種別で条件付きなら `applyTo`。
3. **手順や資材を伴うか**: 伴うなら skill。伴わず短い規約なら instructions。
4. **役割・ツール制限・モデル固定が要るか**: 要るなら custom agent。skill から呼ぶ下請けなら `user-invocable: false`。
5. **外部接続か**: 読み取りだけなら `#web/fetch`、読み書きなら MCP。
6. **配布したいか**: plugin。

## 3. Claude Code / Codex との記法差分 (勘違いしやすい点)

| 項目 | Claude Code | Copilot (VS Code) | Codex |
| --- | --- | --- | --- |
| skills の場所 | `.claude/skills/` | `.github/skills/` (`.claude/skills/` も読む) | `.agents/skills/` |
| skill の独自キー | `context`、`agent`、`model`、`effort`、`paths`、`hooks` など多数 | `user-invocable`、`disable-model-invocation`、`argument-hint`、`context: fork` | `name` と `description` のみ |
| agents の場所 | `.claude/agents/<name>.md` | `.github/agents/<name>.agent.md` | `config.toml` |
| agent のツール制限 | `tools` / `disallowedTools` (カンマ区切り文字列) | `tools` (YAML 配列) | 無し |
| agent のモデル | `model` | `model` (配列でフォールバック可。`(copilot)` 付きの表示名) | `model`、`model_reasoning_effort` |
| subagent の呼び出し | Agent ツール | `agent` ツール + `agents` 許可リスト | 公式に未文書化 |
| hooks | `settings.json` | `.github/hooks/<name>.json` | 無し |
| 常時指示 | `CLAUDE.md` | `copilot-instructions.md` + `AGENTS.md` (`CLAUDE.md` も読む) | `AGENTS.md` |

VS Code は `.claude/agents/` の Claude 形式 (tools がカンマ区切り文字列) も読めるが、
このリポジトリでは Copilot 形式 (`.github/agents/*.agent.md`、YAML 配列) に統一する。

## 4. よくある提案パターン

- 「A を skill で作りたい」→ 手順も資材も無く規約だけなら instructions で足りる。
- 「A を agent で作りたい」→ 役割固定やツール制限が不要なら skill の方が持ち運べる (CLI や cloud agent でも使える)。
- 「prompt file を増やしたい」→ 新規は skill。既存 prompt file は移行機能で skill に変換できる。
- 「毎回必ず lint を走らせたい」→ skill ではなく hooks か CI。
- 「安いモデルで調べさせたい」→ custom agent に `model` と read-only の `tools` を書き、`user-invocable: false` で subagent 専用にする。親のモデルが子より安いと指定が効かない点に注意。
