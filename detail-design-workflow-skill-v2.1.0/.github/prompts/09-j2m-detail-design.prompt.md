---
name: '09-j2m-detail-design'
description: '検証済みJSONから必要な詳細設計Markdownを作成'
argument-hint: 'featureId=... jsonDirectory=... evaluationDirectory=... statusPath=... outputDirectory=... allowWarnings=...'
agent: 'agent'
---

# 09-j2m-detail-design

## 実行パラメータ

- **featureId**: `${input:featureId:機能ID}`
- **jsonDirectory**: `${input:jsonDirectory:J-* JSON格納先}`
- **evaluationDirectory**: `${input:evaluationDirectory:EV-01結果格納先}`
- **statusPath**: `${input:statusPath:runフォルダのstatus.md}`
- **outputDirectory**: `${input:outputDirectory:Markdown出力先}`
- **allowWarnings**: `${input:allowWarnings:trueまたはfalse}`

## 参照ファイル

- [共通Instructions](../copilot-instructions.md)
- [Markdownテンプレート一覧](../skills/detail-design-workflow/contracts/CONTRACT-INDEX.md)
- [Markdownテンプレート本体](../skills/detail-design-workflow/contracts/markdown/)

## 前提

- 使用するJ-* JSONごとにEV-01結果がある。
- `statusPath`のG1 JSON承認が`承認済み`である。未承認、空欄、判定不能なら停止する。
- EV-01が`FAIL`、またはblocking findingを含むJSONが1件でもあれば、G1の記載にかかわらず停止する。
- EV-01が`PASS_WITH_WARNINGS`のJSONがある場合、`allowWarnings=false`なら停止する。
- EV-01が`PASS_WITH_WARNINGS`のJSONがある場合、`allowWarnings=true`かつG1が`承認済み`のときだけ続行し、全警告を`90-open-issues.md`へ引き継ぐ。
- 全件が`PASS`の場合も、G1が`承認済み`でなければ停止する。
- J-90の`humanReviewStatus`が`rejected`なら停止する。`not_reviewed`または`in_review`は評価時点の情報として扱い、`statusPath`のG1承認を上書きしない。人間確認状態の正本は`statusPath`とする。

## 役割

検証済みJSONを分類、並べ替え、表現変換し、必要な詳細設計Markdownだけを作る。新しい仕様を作らない。

## 出力条件

- 常に作成: `00-overview.md`、`99-traceability.md`
- 対応recordがある場合だけ作成: `10-frontend.md`、`20-backend.md`、`30-database.md`、`40-batch-interface.md`、`50-common-permission.md`、`60-assets.md`
- issueまたは引継ぎ警告がある場合だけ作成: `90-open-issues.md`

## 手順

1. `statusPath`のG1状態、`allowWarnings`、全EV-01の`result`とblocking findingを照合し、前提を満たさなければ出力を変更せず停止する。
2. 入力JSONとEV-01結果を対応付ける。
3. recordを`layers`と`scope`でルーティングする。
4. 対応recordがあるテンプレートだけを使用する。
5. 各仕様行へRecord IDと出典を付ける。
6. 共通recordを複製せず、Record IDまたはリンクで参照する。
7. issueと警告をM-90へ、assetをM-60へ、全recordをM-99へ反映する。
8. 作成しない分野と理由をM-01の出力一覧へ記録する。
9. 出力先に空Markdown、空表だけのMarkdown、以前の実行で残った不要な分野別Markdownがあれば削除する。

## 完了条件

- JSON record数とM-99の追跡record数が一致する。
- Markdownだけに存在する事実が0件である。
- 未反映recordが0件、またはissueとして記録されている。
- 作成した各Markdownに実データが1件以上ある。ただしM-01とM-99を除く。
