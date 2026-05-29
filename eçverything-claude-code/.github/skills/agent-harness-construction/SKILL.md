---
name: agent-harness-construction
description: AI agentのtool、observation、recovery contract、context budgetを設計し、完了率と検証可能性を上げるときに使う。
---

# Agent Harness Construction

agent harness の品質は、agent の賢さだけでなく、操作空間、観測結果、失敗時の復旧導線、context budget に強く依存します。

## Related assets

- 主な入口 prompts: `skill-create`, `update-docs`, `learn`, `learn-eval`
- 主な agents: `doc-updater`, `architect`
- 関連 instructions: `agent-harness`, `documentation`

## 使うタイミング

- agent 向け tool / command / workflow を設計するとき
- Copilot agent が迷いやすい作業を harness 化したいとき
- tool output が不安定で後続判断が難しいとき
- long-running task の成功率、再試行率、検証性を改善したいとき

## Tool設計

- tool 名は安定した動詞 + 対象にする。
- 入力は schema-first で狭く定義する。
- output は deterministic な形にする。
- 高リスク操作は小さな tool に分ける。
- 編集、検索、検証のような頻出操作は中粒度にする。

## Observation contract

tool response には、可能な限り次を含めます。

```json
{
  "status": "success | warning | error",
  "summary": "1行の結果",
  "artifacts": ["path-or-id"],
  "next_actions": ["実行可能な次の一手"],
  "diagnostics": ["必要な場合だけ詳細"]
}
```

## Error recovery

失敗出力には次を入れます。

- 推定原因
- retry してよい条件
- retry してはいけない条件
- user input が必要な場合の質問
- 関連する log / artifact path

## Context budget

- 常時読み込む instructions は短くする。
- 長い手順は `.github/skills/<skill-name>/SKILL.md` に分ける。
- 参照資料は skill 内に置き、SKILL.md から明示的に参照する。
- phase boundary ごとに、決定事項と未解決事項を短く要約する。

## ベンチマーク

- task completion rate
- first-pass success rate
- retry count
- verification pass rate
- failure category
- successful task あたりの時間とコスト
