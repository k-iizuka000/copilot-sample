---
mode: 'agent'
description: '設計書ブック（1冊）のダンプ化を extract.ps1 で代行する。ユーザーに PowerShell を打たせない。'
model: 'GPT-5.4-mini'
---

# /extract — 設計書ブックをダンプ化する

引数: 設計書ブック（作業用コピーの `.xlsx`）のパス。未指定ならその場で質問する。

起動契約・終了コードの正本は [dump-contract.md](../skills/detail-design-onestop/references/dump-contract.md) の1〜2章。手順の複製はせず、契約の詳細はそこを参照する。

## 事前案内（宣言シート）

ブックに宣言シート `_シート役割表` が未追加なら、次を案内する。追加・記入は人の作業であり代行しない。

- テンプレート: [declaration-sheet.xlsx](../skills/detail-design-onestop/templates/declaration-sheet.xlsx)
- 記入手順書: [declaration-guide.md](../skills/detail-design-onestop/templates/declaration-guide.md)

宣言シート無しでも extract は完走する。その場合 `/run` で種別の質問が増えることを伝える。

## 実行

ターミナルで次を実行する（`-OutDir` 省略時はブックと同じ場所の `<ブック名>.dump/`）。

```
powershell -ExecutionPolicy Bypass -File .github/skills/detail-design-onestop/scripts/extract.ps1 -BookPath <引数のパス>
```

出力先が既存で終了コード 10 のときは、既存 `.dump` ディレクトリの扱い（削除してよいか／`-OutDir` で別名にするか）をユーザーに確認してから再実行する。無断削除はしない。

## 結果報告

終了コードの意味は [dump-contract.md 2章](../skills/detail-design-onestop/references/dump-contract.md) の表のとおり、日本語で伝える。

| code | 意味 |
|---|---|
| 0 | 成功（警告のみは成功） |
| 10 | 前提エラー（非対応環境・Excel COM 生成不可・入力不在・引数不正・出力先既存） |
| 20 | 宣言シートの無効宣言 |
| 30 | 厳格結合の検査不合格 |
| 1 | 予期しないエラー |

成功時（終了コード 0）はダンプディレクトリのパスと「次は `/run <ブック名>.dump/`」を案内する。`manifest.json` の `warnings` と `requiresVisualCheck: true` のシートがあれば「要目視」として一覧を伝える。

## 禁止事項

- `extract.ps1` の中身の修正
- ダンプ JSON の手修正
- エラー時の代替様式へのフォールバック
