---
mode: 'agent'
description: 'J-* JSON と spec/ Markdown の意味照合（欠落・創作・「該当なし/未確認」混同・basis 妥当性）を評価する。02-run とは別チャットで実行する。'
model: 'GPT-5.4'
---

# 03-check — 意味照合

J-* JSON と生成済み spec/ Markdown を突き合わせ、**意味が失われていないか・創作が無いか**を評価する。
機械照合（構造・件数・リンク実在など）は `verify.ps1` の責務なので、**ここでは重複してやらない**。

> 共通ルール（出典必須・推測禁止・「該当なし(=[])」と「未確認(=null)」の区別など）は
> [共通ルール](../copilot-instructions.md) を正とする。本文には複製しない。
> このプロンプトは **`/02-run` とは別のチャット**で実行する（評価者を生成者から分ける）。

## 実行パラメータ

- **runDir**: `${input:runDir:作業ディレクトリ（例 runs/ab1234）。未指定なら自動特定}`
- **specDir**: `${input:specDir:最終出力ツリー。既定は run-request.json の outputSpecRoot（無ければ spec/）}`

runDir が未指定（空欄）の場合の自動特定は `/02-run` と同じ規則に従う（`runs/` 直下で run-request.json を持つフォルダが1つだけならそれ。複数なら選択を求める）。

## 参照

- [共通ルール](../copilot-instructions.md)
- 対象の J-* JSON（`runDir/10-json/`）と生成済み spec/ Markdown（`specDir/`）
- [ルーティング表](../../spec-format/routing-table.md)（recordType→出力先の対応）
- [検証結果](../skills/detail-design-workflow/scripts/verify.ps1) の出力 `runDir/20-check/verify-result.md`

## 前提（満たさなければ評価しない）

- `runDir/20-check/verify-result.md` が存在し、`verify.ps1` の結果が **OK（機械照合が緑）** であること。
- 未実行、または FAIL の場合は評価に入らず、
  「先に verify.ps1（`scripts/verify.ps1 -RunDir <runDir> -SpecDir <specDir>`）を実行してください」と案内して終了する。

## 役割

意味照合だけを行う。**spec/ Markdown を修正しない**（修正は `/02-run` の再実行で行う）。

## 検査項目

1. J-* JSON の **条件・否定・例外・数値・順序**が spec/ Markdown で失われていないか。
2. **spec/ にだけ存在する仕様（創作）**が無いか。JSON に根拠が無い記述はすべて指摘する。
3. **「該当なし」（=[]）と「未確認」（=null）の混同**が無いか。
4. `entity_relation` の **basis の妥当性**:
   - `basis: explicit` … 設計書に明記された関連であり、その出典（sourceRefs）が実在するか。
   - `basis: derived_join` … 導出元（VIEW定義・検索要領の JOIN 条件）が実在するか。
   - どちらにも該当しない **AI 推測による関連**が紛れていないか（推測線は禁止）。

## 結果の書き出し

- `runDir/20-check/check-result.md` に、判定（**PASS / PASS_WITH_WARNINGS / FAIL**）と findings 表を書く。
  - PASS: 欠落・創作・混同・basis 不正がいずれも無い。
  - PASS_WITH_WARNINGS: blocking でない指摘のみが残る。
  - FAIL: 欠落・創作・出典欠落・basis 不正・矛盾のいずれかがある。
- findings は `runDir/20-check/warnings.md`（種別: EV指摘）にも追記する。
- **FAIL でも成果物（spec/）は修正しない**。判定と findings を残すだけにする。

## チャット応答

判定・findings 件数・出力先を簡潔に報告し、FAIL があれば
「修正は /02-run を再実行してください」と1行で案内する。
