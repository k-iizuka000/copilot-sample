---
name: '10-ev-markdown-integrity'
description: 'J-* JSONと詳細設計Markdownの整合性を評価'
argument-hint: 'jsonDirectory=... markdownDirectory=... outputPath=...'
agent: 'agent'
---

# 10-ev-markdown-integrity

## 実行パラメータ

- **jsonDirectory**: `${input:jsonDirectory:使用JSON格納先}`
- **markdownDirectory**: `${input:markdownDirectory:詳細設計Markdown格納先}`
- **outputPath**: `${input:outputPath:J-90評価出力先}`

## 参照ファイル

- [共通Instructions](../copilot-instructions.md)
- 使用したJ-* JSONと対応するEV-01結果
- [Markdownテンプレート一覧](../skills/detail-design-workflow/contracts/CONTRACT-INDEX.md)
- [J-90 Schema](../skills/detail-design-workflow/contracts/json/J-90-evaluation-report.schema.json)

## 役割

JSONと作成済みMarkdownの整合性だけを評価する。Markdownを修正しない。

## 検査順序

1. `00-overview.md`と`99-traceability.md`が存在するか確認する。
2. 分野別recordがある場合だけ、対応する`10`〜`60`のMarkdownが存在するか確認する。
3. issueまたは引継ぎ警告がある場合だけ、`90-open-issues.md`が存在するか確認する。
4. 空Markdown、空表だけのMarkdown、対象recordがない分野別Markdownが存在しないか確認する。
5. 全Record IDが`99-traceability.md`に1回以上現れるか確認する。
6. JSONの条件、否定、例外、数値、順序がMarkdownで失われていないか確認する。
7. Markdownだけに存在する仕様がないか確認する。
8. 分類、issue、asset、件数、参照リンクを確認する。

J-90形式のEV-02評価結果だけを`outputPath`へ書き込む。
