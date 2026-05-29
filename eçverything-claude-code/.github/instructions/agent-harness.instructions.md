---
applyTo: ".github/agents/**,.github/skills/**,.github/prompts/**,.github/instructions/**,.github/copilot-instructions.md"
---

# Copilot ハーネス指示

- repository-wide 指示は `.github/copilot-instructions.md` に短く広く置く。
- path-specific 指示は `.github/instructions/*.instructions.md` に置き、必ず `applyTo` frontmatter を付ける。
- 指示は短く、自己完結し、他ファイルと矛盾させない。
- 詳細な手順や専門知識は agents、skills、prompts に分け、常時指示を肥大化させない。
- agents は役割、入力、出力、停止条件を明確にする。
- skills は発動条件、手順、成果物、検証方法を明確にする。
- prompts は繰り返し使う依頼やチェックリストに絞り、リポジトリ固有の前提を明示する。
- 配布パック内の入れ子 `.github` は、対象リポジトリルートへコピーされるまで有効ではない。
