# ダンプ形式契約書（dump-contract）

- 版: 1.0.0（dumpFormatVersion）
- 位置づけ: `extract.ps1` が生成するダンプディレクトリの**機械解析契約の正本**。extract.ps1 の実装・fixture 生成・後続工程（/run の spec 生成・出典逆照合・網羅台帳）・宣言シートテンプレートは、すべて本契約に適合する。
- 用語: 「1冊」= Excel 設計書ファイル1個（.xlsx）。「ダンプ」= 1冊を解釈ゼロで全量 JSON 化したディレクトリ。「宣言シート」= ブック内のシート `_シート役割表`。

## 1. 実行環境と起動契約

- 対応環境は **Windows PowerShell 5.1（PSEdition Desktop）＋ デスクトップ版 Excel（COM）** のみ。それ以外（pwsh 7・macOS 等）では終了コード 10 で停止し、メッセージに「extract.ps1 は Windows PowerShell 5.1 ＋ Excel（COM）環境専用です」という文言を含める。
- 環境ガードは `$PSVersionTable`・OS 判定など文字列と標準 .NET 型のみで行う。Office 相互運用型・`#requires -PSEdition` は使わない（非対応環境でも構文エラーにならず、独自メッセージまで必ず到達する）。COM の列挙値は数値定数で記述する。
- 起動形式: `powershell -ExecutionPolicy Bypass -File extract.ps1 -BookPath <xlsx> [-OutDir <dir>] [-ShapeWarnThreshold <int>]`
  - `-OutDir` 既定値: 入力ブックと同じ場所の `<ブック名>.dump/`（例: `sample.xlsx` → `sample.dump/`）
  - `-ShapeWarnThreshold` 既定値: 10
  - `-Force` は存在しない。出力先ディレクトリが既存なら終了コード 10 で明示エラー。

## 2. 終了コードと原子性

| code | 意味 |
|---|---|
| 0 | 成功（警告のみは成功） |
| 10 | 前提エラー（非対応環境・Excel COM 生成不可・入力不在・引数不正・出力先既存） |
| 20 | 宣言シートの無効宣言（7章の無効4項目） |
| 30 | 厳格結合の検査不合格（5章） |
| 1 | 予期しないエラー（壊れた xlsx・COM 例外等） |

- 複数該当時は最初に検出したコードで停止する。
- **原子性**: 最終出力と同じ親ディレクトリに一時ディレクトリを作って全ファイルを書き、書き込み後の再読込検証（全 JSON がパース可能・manifest の必須キー存在）に成功した場合のみ最終名へ rename する。**0 以外で終了するとき、完成ダンプ（最終名のディレクトリ）は一切残さない**（一時ディレクトリは削除する）。部分ダンプ・代替様式へのフォールバックは禁止。

## 3. ダンプディレクトリ構造

```
<ブック名>.dump/
├── manifest.json
└── sheets/
    ├── 001_<サニタイズ済みシート名>.json
    ├── 002_<サニタイズ済みシート名>.json
    └── ...
```

- 1シート = 1 JSON。**宣言シート・非表示シートを含むブック内の全シート**が対象（全量ダンプ）。
- `NNN` はブック内シート順の 1 始まり 3 桁ゼロ埋め。
- シート名サニタイズ: `\ / : * ? " < > |` と制御文字を `_` に置換し、末尾の空白・ピリオドを除去、名前部は最大 50 文字。衝突・元名との対応は manifest の `sheets[].jsonFile` が正本（ファイル名から元シート名を復元しない）。
- 文字コードは全ファイル **UTF-8（BOM なし）**。改行は LF。`ConvertTo-Json` 使用時は `-Depth 10` 以上を明示し、単一要素でも配列は配列として出力する。

## 4. JSON の値の意味論（全スキーマ共通）

- `[]` = **該当なし**（調べた結果、存在しなかった）。
- `null` = **未確認**（読み取れず確定できない）。ただし完成ダンプでは `displayText` に null は存在しない（取得できなければ終了コード 30 で停止しダンプ自体を出さないため）。
- 値は型変換・解釈をせず **OpenXML の原文**を文字列で保持する（解釈ゼロの原則）。

## 5. セル抽出・displayText・厳格結合

### セル集合
- セル集合の正本は **OpenXML の全 `<c>` 要素の座標**（値が無く書式のみのセルを含む）。
- COM の `Value2` ブロック一括読みは「COM 側にのみ現れる非空セル」の検出補助に限定する。COM 側にのみ非空セルが現れた場合は**構造抽出の取得漏れとして終了コード 30**（完成ダンプなし）。

### displayText
- 対象セル全部について、Excel COM の `Range.Text` を**セル単位**で取得する。
- 意味論: **抽出時点にそのPCの Excel が返す書式適用済み表示文字列**（decision 31 の「確実」の定義）。列幅不足の `####`・日付書式・先頭ゼロ・桁区切りは Excel の表示そのまま。書式のみで空のセルは空文字列 `""`（null ではない）。
- 数式セルの計算方針: **開いた時点の Excel 表示をそのまま正とする**。ブック全体の再計算は強制せず、計算モード・計算状態を manifest に記録する。例外は宣言セル（範囲宣言表の範囲数式セル）のみで、対象セルを明示的に計算（`Range.Calculate`）してから読む。

### 厳格結合の検査（不合格 = 終了コード 30）
1. OpenXML 側と COM 側のシート名・セル座標が一意に突き合うこと。
2. 対象セル全部で displayText の取得に成功すること。
3. COM 側にのみ現れる非空セルが存在しないこと。

**保存値（rawValue）と表示値（displayText）の文字列一致は検査対象外**（日付シリアル・丸め・再計算で一致しないのが正常）。

### Excel COM の起動・終了
- `Workbooks.Open` は UpdateLinks=0・ReadOnly=true・IgnoreReadOnlyRecommended=true・AddToMru=false を固定し、`Application.DisplayAlerts = false`・非表示で起動する。
- 全処理を try/finally で囲み、Range→Worksheet→Workbook→Application の逆順に COM 参照を解放して Excel プロセスを残さない。
- 保護ブック・パスワード要求・破損・ダイアログ要求はフォールバックせず非 0 終了する。

## 6. シート JSON スキーマ

```json
{
  "dumpFormatVersion": "1.0.0",
  "sheetName": "項目定義",
  "sheetIndex": 2,
  "visibility": "visible",
  "cells": [
    {
      "address": "B5",
      "cellType": "s",
      "rawValue": "商品コード",
      "formulaText": null,
      "sharedFormula": null,
      "displayText": "商品コード"
    }
  ],
  "mergedRanges": ["A1:C1"],
  "hiddenRows": [12, 13],
  "hiddenColumns": ["D"],
  "shapes": [
    { "kind": "drawingml-shape", "name": "TextBox 1", "text": "画面遷移の補足", "anchorCell": "H2" }
  ],
  "comments": [
    { "kind": "legacy", "cell": "B5", "author": "設計太郎", "text": "旧: 品目コード" },
    { "kind": "threaded", "cell": "C8", "author": "設計花子", "text": "要確認",
      "replies": [ { "author": "設計太郎", "text": "確認済み" } ] }
  ],
  "comSurplusCells": []
}
```

必須キーと規則:

| キー | 規則 |
|---|---|
| `cells[].address` | A1 形式。OpenXML の全 `<c>` を収録 |
| `cells[].cellType` | OpenXML の `t` 属性原文（`s`/`str`/`inlineStr`/`b`/`e`/`n`/`d`）。属性が無いセルは `null`（数値扱いの原文どおり） |
| `cells[].rawValue` | 保存値の原文（shared string は解決済みの文字列、それ以外は `<v>`/inlineStr の原文）。値なしは `null` |
| `cells[].formulaText` | `<f>` の数式原文。数式なしは `null`。共有数式の従属セル（本文なし）は `null` のまま `sharedFormula` を持つ |
| `cells[].sharedFormula` | `{ "si": "0", "ref": "B2:B10" }`（`ref` はマスターのみ。従属セルは `si` のみ）。共有数式でなければ `null`。復元解釈はしない |
| `cells[].displayText` | 5章の意味論。完成ダンプで `null` 不可 |
| `mergedRanges` | 結合セル範囲の A1 範囲文字列。なしは `[]` |
| `hiddenRows` / `hiddenColumns` | 非表示の行番号・列レター。なしは `[]` |
| `shapes` | 8章の対応範囲。なしは `[]` |
| `comments` | 8章。なしは `[]` |
| `comSurplusCells` | 完成ダンプでは常に `[]`（存在すれば終了コード 30 のため） |

## 7. 宣言シート `_シート役割表` の機械解析契約

- レイアウト・語彙・記入体験の正本は宣言シートテンプレート .xlsx（小分類「宣言シート」の成果物）。本章はそのテンプレートが満たすべき**解析可能条件**を定める。テンプレートは本章に適合しなければならない（宣言シート-4 の整合基準）。
- 宣言シートが存在しないブックはエラーにせず、manifest に `declarationSheet.present = false` を記録してダンプを完成させる（シート名推定・ユーザーへの質問は /run の責務）。

### 7.1 影響先マトリクス

- ヘッダー行を上から走査し、「シート名」ラベルのセルを含む最初の行をヘッダーとする。
- 列構成: `シート名`｜影響先 11 種（下記・完全一致）｜`範囲宣言状態`｜`補足メモ`。
- 影響先 11 種（正本語彙・完全一致）: `フロント-画面項目` `フロント-レイアウト` `フロント-入力チェック` `バック-処理` `バック-検索・更新` `バッチ-制御` `バッチ-入出力` `DB定義` `共通・規約` `権限` `対象外`
- データ行はヘッダーの次行から、シート名列が空になる行の直前まで。
- セル値: 影響先セルは `○`（U+25CB）または空のみを有効値とする。`範囲宣言状態` は `完了`／`表形式なし`／空。`補足メモ` は自由記述（解析対象外・記録のみ）。

### 7.2 範囲宣言表

- ヘッダー行: `宣言ID`｜`対象シート`｜`内容ラベル`｜`範囲数式`｜`補足`（完全一致でヘッダー探索。マトリクスより下の行）。
- `範囲数式` は次の **ADDRESS 固定イディオム**のみを許可する（OpenXML 内の数式原文を解析対象とする）:

```
ADDRESS(ROW(<シート参照>!<開始セル>),COLUMN(<シート参照>!<開始セル>))&":"&ADDRESS(ROW(<シート参照>!<終了セル>),COLUMN(<シート参照>!<終了セル>))
```

- 許可正規表現（空白差のみ許容。`$` 絶対参照は任意、シート参照はアポストロフィ引用任意）:

```
^\s*ADDRESS\(\s*ROW\(\s*(?:'(?<s1>[^']+)'|(?<s1b>[^'!,()\s]+))!\$?(?<c1>[A-Z]{1,3})\$?(?<r1>[1-9][0-9]{0,6})\s*\)\s*,\s*COLUMN\(\s*(?:'(?<s2>[^']+)'|(?<s2b>[^'!,()\s]+))!\$?(?<c2>[A-Z]{1,3})\$?(?<r2>[1-9][0-9]{0,6})\s*\)\s*\)\s*&\s*":"\s*&\s*ADDRESS\(\s*ROW\(\s*(?:'(?<s3>[^']+)'|(?<s3b>[^'!,()\s]+))!\$?(?<c3>[A-Z]{1,3})\$?(?<r3>[1-9][0-9]{0,6})\s*\)\s*,\s*COLUMN\(\s*(?:'(?<s4>[^']+)'|(?<s4b>[^'!,()\s]+))!\$?(?<c4>[A-Z]{1,3})\$?(?<r4>[1-9][0-9]{0,6})\s*\)\s*\)\s*$
```

- 追加条件: ①ROW/COLUMN の 4 参照はすべて同一シートかつ同一セルのペア（1=2、3=4）であること ②そのシートが `対象シート` 列の値と一致すること。
- 正規化: 開始セル・終了セルから `対象シート!A5:L40` 形式の**正規化範囲**を導出し、範囲内の**非空セル数**（非空 = 保存値・数式・コメントのいずれかを持つセル）とあわせて manifest に出力する。
- 宣言セルは COM で対象セルのみ `Range.Calculate` してから表示値を読む（`#REF!` の検出用。表示値と解析結果の照合は行わない）。

### 7.3 自己チェック: 無効 4 項目（1件でも該当 → 終了コード 20・完成ダンプなし）

| # | 無効条件 |
|---|---|
| 1 | 範囲宣言の `対象シート` が実シートに存在しない |
| 2 | `範囲数式` が許可正規表現に一致しない、または数式・計算結果に `#REF!` を含む |
| 3 | 開始セルと終了セルの逆転（行・列いずれか開始 > 終了）、またはイディオム内のシート参照不一致・`対象シート` との不一致 |
| 4 | マトリクスで `対象外` に ○ かつ他の影響先にも ○ がある行が存在する |

### 7.4 自己チェック: 警告 3 項目（manifest に記録・ダンプは完成する）

| # | 警告条件（狭い初版定義） |
|---|---|
| 1 | 棚卸しズレ: マトリクスのシート名集合と実シート名集合（宣言シート自身を除く）の双方向差分が空でない |
| 2 | 終端直後の内容: 正規化範囲の終端行の**次の 1 行・同じ列範囲**に非空セルがある（他の宣言の正規化範囲内のセルは除外） |
| 3 | 宣言範囲が空: 正規化範囲内の非空セル数が 0 |

## 8. 図形・テキストボックス・コメントの対応範囲

### 図形（shapes）
- 文字列抽出の対象: **DrawingML の shape/textbox**（`xl/drawings/drawing*.xml` の `xdr:sp`、`a:t` の連結）と **legacy VML テキストボックス**（コメント由来を除く）。
- 各要素: `kind`（`drawingml-shape`／`vml-textbox`）・`name`・`text`・`anchorCell`（開始アンカーの A1 座標）。1 要素は一度だけ計数する。
- 対応外要素（チャート・画像・SmartArt 等の `graphicFrame`/`pic`）: 文字列抽出せず、シートごとに種類と個数を manifest の警告 `unsupported-drawing` として記録する（停止しない）。
- 図形密度: シートの shapes 計数（対応外要素を含む総数）が `ShapeWarnThreshold`（既定 10）**以上**なら、manifest に「要目視」警告 `shape-density` を記録する。

### コメント（comments）
- **legacy コメント**（`xl/comments*.xml`）と **threaded comments**（`xl/threadedComments/*.xml`＋`xl/persons/`）の両対応。いまの Excel の既定コメントは threaded のため必須スコープ。
- legacy: `kind: "legacy"`・`cell`・`author`・`text`。
- threaded: `kind: "threaded"`・`cell`・`author`（persons の displayName）・`text`（先頭コメント）・`replies`（親子順のフラット配列。各要素 `author`・`text`）。

## 9. manifest.json スキーマ

```json
{
  "dumpFormatVersion": "1.0.0",
  "generator": { "tool": "extract.ps1", "toolVersion": "0.1.0" },
  "generatedAt": "2026-07-24T10:00:00+09:00",
  "book": { "fileName": "sample.xlsx", "sha256": "..." },
  "environment": { "excelVersion": "16.0", "psVersion": "5.1.22621.4249", "os": "...", "locale": "ja-JP" },
  "calculation": { "mode": "automatic", "fullCalcOnLoad": false },
  "shapeWarnThreshold": 10,
  "sheets": [
    {
      "index": 1, "name": "表紙", "jsonFile": "sheets/001_表紙.json",
      "visibility": "visible", "cellCount": 20, "shapeCount": 0,
      "requiresVisualCheck": false
    }
  ],
  "declarationSheet": {
    "present": true,
    "sheetName": "_シート役割表",
    "matrix": [
      { "sheetName": "項目定義", "targets": ["フロント-画面項目"], "rangeDeclarationStatus": "完了", "note": "" }
    ],
    "rangeDeclarations": [
      {
        "id": "R1", "targetSheet": "項目定義", "label": "項目一覧",
        "formulaRaw": "ADDRESS(ROW(項目定義!A5),COLUMN(項目定義!A5))&\":\"&ADDRESS(ROW(項目定義!L40),COLUMN(項目定義!L40))",
        "normalizedRange": "項目定義!A5:L40", "nonEmptyCellCount": 42
      }
    ]
  },
  "selfCheck": { "result": "pass", "invalids": [] },
  "warnings": [
    { "type": "shape-density", "sheet": "画面レイアウト", "detail": "図形12個 >= 閾値10。要目視" }
  ]
}
```

必須キーと規則:

| キー | 規則 |
|---|---|
| `book` | **ファイル名と SHA-256 のみ**。絶対パス・ユーザー名は記録しない（公開リポジトリ秘匿ルール準拠） |
| `environment` | Excel 版・PowerShell 版・OS・locale |
| `calculation` | ブックの計算モードと計算状態 |
| `sheets[]` | ブック内全シート。順序・可視性（`visible`/`hidden`/`veryHidden`）・セル数・図形数・JSON ファイル対応・`requiresVisualCheck`（図形密度警告の対象か） |
| `declarationSheet` | 7章の解析結果。`present: false` のとき `matrix`/`rangeDeclarations` は `[]` |
| `selfCheck` | `result`: `pass`／`warned`。`invalids` は完成ダンプでは常に `[]`（無効があれば終了コード 20 でダンプ自体が出ないため） |
| `warnings[]` | `type` は `shape-density`／`unsupported-drawing`／`inventory-mismatch`／`content-after-range`／`empty-range`／`no-declaration-sheet`。各要素に `sheet`（該当なしは null）と `detail` |

## 10. 本契約の変更手続き

キーの追加・削除・意味変更は dumpFormatVersion を上げ、fixture・採点・後続工程（/run・出典逆照合・網羅台帳）との整合を取ってから行う。
