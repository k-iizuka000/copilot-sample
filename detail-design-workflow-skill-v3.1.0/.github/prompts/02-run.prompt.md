---
mode: 'agent'
description: '次の1タスクを自動選択して1つだけ実行する。抽出→spec生成→trace生成まで、同じコマンドを繰り返し呼ぶ。'
model: 'GPT-5.4'
---

# 02-run — 次の1タスクを自動実行

現在の状態（J-01・抽出済み J-*・生成済み spec/）を見て、**次にやるべき1タスクを自分で選び、1つだけ実行**する。
利用者は「次はどれ？」を判断しなくてよい。毎回このプロンプトを呼ぶだけで先へ進む。

> 共通ルール（出典必須・推測禁止・「該当なし(=[])」と「未確認(=null)」の区別など）は
> [共通ルール](../copilot-instructions.md) を正とする。本文には複製しない。

## 実行パラメータ

- **runDir**: `${input:runDir:作業ディレクトリ（例 runs/FUNC0123）}`
- **specDir**: `${input:specDir:最終出力ツリー。既定は spec/}`

## 参照

- [共通ルール](../copilot-instructions.md)
- [ルーティング表](../../spec-format/routing-table.md)（recordType→出力先 spec ファイルの正本）
- [出力ツリー定義](../../spec-format/output-structure.md)（spec/ の標準ファイルセット。暫定）
- [消費マトリクス](../../spec-format/consumption-matrix.md)（trace の消費マトリクス抜粋の元）
- [Markdown テンプレート](../skills/detail-design-workflow/contracts/markdown/)（各 spec / trace の書式）
- [J-* スキーマ](../skills/detail-design-workflow/contracts/json/)（抽出出力の契約）

## モデルの目安

- ステップ2（シート抽出）は **GPT-5.4 mini** でよい。
- ステップ3・4（spec 生成・trace 生成）は手戻りが大きいので **GPT-5.4** を使う（mini だけで完結させない）。

## 冒頭にやること（毎回）

1. `runDir/10-json/`・`specDir/`・`runDir/20-check/warnings.md` の現状を確認する。
2. 下の「次の1タスク選択」を上から順に評価し、**最初に該当した1つ**を今回のタスクに決める。
3. **「今回やること: …」を1行で宣言**してから実行に入る。

## 次の1タスク選択（上から順に、最初に該当した1つだけ実行する）

1. `runDir/10-json/` に **J-01 が無い** → 実行せず「先に /01-setup を実行してください」と案内して終了。
2. J-01 の routingPlan に **未処理の抽出単位がある**（＝その抽出単位に対応する J-* 出力が `10-json/` にまだ無い）
   → その **最初の1つ**だけを抽出する。抽出単位の1シート／1論理ブロックのみを読み、
   routingPlan が指定する **J-* スキーマ**に従って JSON を `10-json/` に書き出す。
   各レコードに `recordId`・`recordType`・`layers`・1件以上の `sourceRefs` を付ける（設計・推測はしない）。
3. **全抽出済み**で、ルーティング表に照らして **未生成の spec/ 責務ファイルがある**
   → その **1ファイルだけ**を生成する（下の「spec 生成の要点」参照）。
4. spec/ 生成済みで **`specDir/trace/{機能ID}.md` が未生成**
   → `T-trace.template.md` に従い trace を **1つ**生成する（クラス図・設計→実装対応表・ER断片・消費マトリクス抜粋）。
5. 上記すべて完了 → 実行せず「verify.ps1 を実行し、別チャットで /03-check を実行してください」と案内して終了。

### spec 生成の要点（ステップ3）

- 抽出済み J-* の各レコードを、[ルーティング表](../../spec-format/routing-table.md)の `recordType→出力先` で振り分ける。
  出力先が未生成の責務ファイルのうち、ルーティング表の行順→ID順で**最初の1つ**を対象にする。
- 対応する Markdown テンプレート（`T-items` / `T-validation` / `T-methods` / `T-queries` / `T-db-table` 等）を使う。
- front-matter 必須キー（id / generatedFrom / generatedAt / model / provisional）を埋める。
- 仕様行の表には **「Record ID」列と「出典」列**を必須で置く。**JSON に無い仕様を書かない**（創作禁止）。
- 共通仕様は複製せず、`spec/rules/` または `spec/common/` へのリンクで参照する。
- 共有領域（`db/` `common/` `rules/`）で既存記述と矛盾する内容を検出したら、**上書きしない**。
  両論併記のうえ `warnings.md`（種別: 矛盾検出）に記録し、人間の判断に委ねる。

## 機械FAILの停止（機械FAILのみ停止）

抽出済み J-* に次のような**機械的に壊れた状態**を検出したら、後続タスクを**実行せず**、
`runDir/20-check/warnings.md`（種別: 機械FAIL）に記録し、停止理由を表示して終了する:

- JSON がパース不能
- レコードの `sourceRefs` が空（出典欠落）
- routingPlan に無いシート／ブロックを参照している
- `recordId` が重複している

**人間レビューの有無では止まらない**（未レビューは警告として表示するだけで先へ進む）。

## 末尾にやること（毎回）

- (a) 実行結果（生成／更新したファイルと件数）を数行で報告する。
- (b) **「次にやること: …」を1行で案内**する（残タスクの種類、または /03-check への誘導）。
- (c) `warnings.md` の **未解消警告を要約表示**する（例: 「未レビューのまま進行中 2件」「EV指摘が未修正 1件」「矛盾検出 1件」）。
