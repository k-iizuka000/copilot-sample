---
name: '09-j2m-detail-design'
description: '検証済みJSONから詳細設計Markdown一式を作成'
argument-hint: 'featureId=... jsonDirectory=... evaluationDirectory=... outputDirectory=... allowWarnings=...'
agent: 'agent'
---

# 09-j2m-detail-design

## 実行パラメータ

- **featureId**: `${input:featureId:機能ID}`
- **jsonDirectory**: `${input:jsonDirectory:J-* JSON格納先}`
- **evaluationDirectory**: `${input:evaluationDirectory:EV-01結果格納先}`
- **outputDirectory**: `${input:outputDirectory:Markdown出力先}`
- **allowWarnings**: `${input:allowWarnings:trueまたはfalse}`

## 実行指示（全文）

## 参照契約

- `M-00`, `M-01`, `M-10`, `M-20`, `M-30`, `M-40`, `M-50`, `M-60`, `M-90`, `M-99`
- `C-02`分類ルール、`C-03`出典ルール、`C-04`問題ルール

## 前提

- 必要なJ-* JSONがそろっている。
- 各JSONに対応するEV-01結果がある。
- `FAIL`のJSONは使わない。
- `PASS_WITH_WARNINGS`を使う場合は、警告をM-90へ引き継ぐ。

## 唯一の役割

検証済みJSONを分類、並べ替え、表現変換し、詳細設計Markdown一式を作る。新しい仕様を作らない。

## 出力

- `00-overview.md` (`M-01`)
- `10-frontend.md` (`M-10`)
- `20-backend.md` (`M-20`)
- `30-database.md` (`M-30`)
- `40-batch-interface.md` (`M-40`)
- `50-common-permission.md` (`M-50`)
- `60-assets.md` (`M-60`)
- `90-open-issues.md` (`M-90`)
- `99-traceability.md` (`M-99`)

## 手順

1. 入力JSONとEV-01結果を対応付ける。
2. `FAIL`入力を除外し、除外理由をM-90へ記録する。
3. recordを`layers`と`scope`でルーティングする。
4. 各テンプレートの見出し順、表列、空欄表現を変えずに埋める。
5. 全仕様行へRecord IDと出典を付ける。
6. 共通recordを個別文書へ全文複製せず、IDまたはリンクで参照する。
7. 全issuesをM-90へ、全assetsをM-60へ、全recordsをM-99へ反映する。
8. 対象recordが0件でもファイルを省略せず、`該当なし`と`未確認`を区別する。

## 完了条件

- `JSON record count = M-99 trace count`。
- Markdownだけに存在する事実が0件。
- 未反映recordが0件、または理由付きでM-90に記録。
- Front Matterの件数が実数と一致。

## 最終応答

- 指定された出力ファイルを作成または更新する。
- チャット本文には、結果、出力先、件数、判定、blocking issueだけを簡潔に報告する。
- 指定された出力先以外を変更しない。
