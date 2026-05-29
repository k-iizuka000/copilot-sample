---
description: "Claudeのskillsとcommandsの品質を監査するときに使用します。Quick Scan（変更されたskillsのみ）とFull Stocktakeモードを、逐次subagentバッチ評価でサポートします。"
origin: ECC
---

# skill-stocktake

品質チェックリスト + AIによる総合判断を使って、すべてのClaude skillsとcommandsを監査するslash command（`/skill-stocktake`）。最近変更されたskills向けのQuick Scanと、完全レビュー向けのFull Stocktakeの2モードをサポートします。

## スコープ

このcommandは、**呼び出されたディレクトリからの相対位置**で次のパスを対象にします。

| パス | 説明 |
|------|-------------|
| `~/.claude/skills/` | グローバルskills（全プロジェクト） |
| `{cwd}/.claude/skills/` | プロジェクトレベルskills（ディレクトリが存在する場合） |

**フェーズ1の開始時に、このcommandは見つかってスキャンされたパスを明示的に一覧表示します。**

### 特定プロジェクトを対象にする

プロジェクトレベルskillsを含めるには、そのプロジェクトのルートディレクトリから実行します。

```bash
cd ~/path/to/my-project
/skill-stocktake
```

プロジェクトに `.claude/skills/` ディレクトリがない場合は、グローバルskillsとcommandsのみが評価されます。

## モード

| モード | 起動条件 | 所要時間 |
|------|---------|---------|
| Quick Scan | `results.json` が存在（デフォルト） | 5–10分 |
| Full Stocktake | `results.json` がない、または `/skill-stocktake full` | 20–30分 |

**結果キャッシュ:** `~/.claude/skills/skill-stocktake/results.json`

## Quick Scanフロー

前回実行以降に変更されたskillsのみを再評価します（5–10分）。

1. `~/.claude/skills/skill-stocktake/results.json` を読む
2. 実行: `bash ~/.claude/skills/skill-stocktake/scripts/quick-diff.sh \
         ~/.claude/skills/skill-stocktake/results.json`
   （Project dirは `$PWD/.claude/skills` から自動検出されます。必要な場合のみ明示的に渡します）
3. 出力が `[]` の場合: "前回実行以降の変更はありません。" と報告して停止
4. 同じフェーズ2基準を使って、変更されたファイルのみを再評価
5. 変更されていないskillsは前回結果から引き継ぐ
6. 差分のみを出力
7. 実行: `bash ~/.claude/skills/skill-stocktake/scripts/save-results.sh \
         ~/.claude/skills/skill-stocktake/results.json <<< "$EVAL_RESULTS"`

## Full Stocktakeフロー

### フェーズ1 — インベントリ

実行: `bash ~/.claude/skills/skill-stocktake/scripts/scan.sh`

スクリプトはskillファイルを列挙し、frontmatterを抽出し、UTC mtimeを収集します。
Project dirは `$PWD/.claude/skills` から自動検出されます。必要な場合のみ明示的に渡します。
スクリプト出力からスキャン概要とインベントリ表を提示します。

```
スキャン中:
  ✓ ~/.claude/skills/         (17 files)
  ✗ {cwd}/.claude/skills/    (未検出 — グローバルskillsのみ)
```

| Skill | 7d use | 30d use | 説明 |
|-------|--------|---------|-------------|

### フェーズ2 — 品質評価

完全なインベントリとチェックリストを渡して、Agent tool subagent（**general-purpose agent**）を起動します。

```text
Agent(
  subagent_type="general-purpose",
  prompt="
次のskillインベントリをチェックリストに照らして評価してください。

[INVENTORY]

[CHECKLIST]

各skillについてJSONを返してください:
{ \"verdict\": \"Keep\"|\"Improve\"|\"Update\"|\"Retire\"|\"Merge into [X]\", \"reason\": \"...\" }
"
)
```

subagentは各skillを読み、チェックリストを適用し、skillごとのJSONを返します。

`{ "verdict": "Keep"|"Improve"|"Update"|"Retire"|"Merge into [X]", "reason": "..." }`

**チャンクガイダンス:** コンテキストを扱いやすく保つため、subagent呼び出し1回あたり約20件のskillsを処理します。各チャンク後に中間結果を `results.json`（`status: "in_progress"`）へ保存します。

すべてのskillsを評価したら、`status: "completed"` を設定し、フェーズ3へ進みます。

**再開検出:** 起動時に `status: "in_progress"` が見つかった場合は、最初の未評価skillから再開します。

各skillはこのチェックリストに照らして評価されます。

```
- [ ] 他のskillsとの内容重複を確認済み
- [ ] MEMORY.md / CLAUDE.mdとの重複を確認済み
- [ ] 技術参照の鮮度を検証済み（tool名 / CLIフラグ / APIが存在する場合はWebSearchを使用）
- [ ] 使用頻度を考慮済み
```

判定基準:

| 判定 | 意味 |
|---------|---------|
| Keep | 有用で最新 |
| Improve | 保持する価値はあるが、具体的な改善が必要 |
| Update | 参照技術が古い（WebSearchで検証） |
| Retire | 低品質、陳腐化、またはコストに見合わない |
| Merge into [X] | 別skillと大きく重複。マージ先を名前で示す |

評価は**AIによる総合判断**であり、数値ルーブリックではありません。判断軸:
- **実行可能性**: すぐ行動できるコード例、commands、手順がある
- **スコープ適合**: 名前、トリガー、内容が一致している。広すぎず狭すぎない
- **独自性**: MEMORY.md / CLAUDE.md / 別skillで代替できない価値がある
- **現行性**: 技術参照が現在の環境で機能する

**reason品質要件** — `reason` フィールドは自己完結し、意思決定に使える必要があります。
- "unchanged" だけを書かない — 常に中核となる根拠を再記述する
- **Retire**: (1) 見つかった具体的欠陥、(2) 同じニーズを代替して満たすもの、を記載
  - 悪い例: `"Superseded"`
  - 良い例: `"disable-model-invocation: trueは既に設定済み。同じパターンすべてとconfidence scoringをカバーするcontinuous-learning-v2に置き換えられている。独自内容は残っていない。"`
- **Merge**: マージ先を名前で示し、統合すべき内容を説明
  - 悪い例: `"Xと重複"`
  - 良い例: `"42行の薄い内容。chatlog-to-articleのStep 4が既に同じワークフローをカバーしている。'article angle'のコツをそのskillの注記として統合する。"`
- **Improve**: 必要な具体的変更（どのセクション、どの作業、関連する場合は目標サイズ）を説明
  - 悪い例: `"Too long"`
  - 良い例: `"276行。Section 'Framework Comparison'（L80–140）がai-era-architecture-principlesと重複している。削除して約150行にする。"`
- **Keep**（Quick Scanでmtimeのみ変更）: 元の判定理由を再記述し、"unchanged" と書かない
  - 悪い例: `"Unchanged"`
  - 良い例: `"mtimeは更新されたが内容は未変更。rules/python/から明示的にimportされる独自のPython参照であり、重複は見つからない。"`

### フェーズ3 — 要約表

| Skill | 7d use | 判定 | 理由 |
|-------|--------|---------|--------|

### フェーズ4 — 統合

1. **Retire / Merge**: ユーザー確認前に、ファイルごとの詳細な根拠を提示:
   - 見つかった具体的問題（重複、陳腐化、壊れた参照など）
   - 同じ機能を代替して満たすもの（Retireの場合: どの既存skill/ruleか。Mergeの場合: 対象ファイルと統合すべき内容）
   - 削除の影響（依存skills、MEMORY.md参照、影響を受けるワークフロー）
2. **Improve**: 根拠付きで具体的な改善提案を提示:
   - 何をなぜ変更するか（例: "sections X/Yがpython-patternsと重複するため430→200行へ削る"）
   - 実行するかどうかはユーザーが判断
3. **Update**: ソース確認済みの更新内容を提示
4. MEMORY.mdの行数を確認し、100行超なら圧縮を提案

## 結果ファイルスキーマ

`~/.claude/skills/skill-stocktake/results.json`:

**`evaluated_at`**: 評価完了時の実際のUTC時刻に設定する必要があります。
Bashで取得: `date -u +%Y-%m-%dT%H:%M:%SZ`。`T00:00:00Z` のような日付のみの近似は決して使用しない。

```json
{
  "evaluated_at": "2026-02-21T10:00:00Z",
  "mode": "full",
  "batch_progress": {
    "total": 80,
    "evaluated": 80,
    "status": "completed"
  },
  "skills": {
    "skill-name": {
      "path": "~/.claude/skills/skill-name/SKILL.md",
      "verdict": "Keep",
      "reason": "Xワークフローに対する具体的で実行可能な独自価値",
      "mtime": "2026-01-15T08:30:00Z"
    }
  }
}
```

## 注意

- 評価はブラインド: 由来（ECC、自作、自動抽出）に関係なく、すべてのskillsに同じチェックリストを適用
- アーカイブ / 削除操作には常にユーザーの明示的な確認が必要
- skillの由来によって判定分岐しない
