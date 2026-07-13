# I-00 入力ソース契約

## 1. 入力形態

優先順は次のとおりです。

1. 対象ExcelをVS Code/Copilotが直接読み取れる状態
2. 対象シートをTSV、CSV、Markdown表へ出したスナップショット
3. 行・節ID付きのテキスト
4. レイアウトや図形の画像

生の`.xlsx`を読めない場合、推測で続行せず、スナップショットを要求します。

## 2. 1回の処理単位

- `E2J-00`: 原則1ブック
- `E2J-01`〜`E2J-05`: 原則1シートまたは1論理ブロック
- 大きなシートは、親キーを保ったままブロック分割する

## 3. 必須識別情報

```yaml
sourcePath: 対象ファイルまたはスナップショット
profileId: PROFILE-01等
sheetName: 対象シート
blockSelector: all またはブロックID/親キー
outputPath: JSON出力先
```

## 4. sourceUnit

表形式は原則1行、文章は1節、縦積みの複数表は1論理ブロック内の1行をsourceUnitとします。

推奨ID:

```text
{documentId}:{sheetSlug}:R{rowNumber}
{documentId}:{sheetSlug}:B{blockNumber}:R{rowNumber}
{documentId}:{sheetSlug}:SEC{sectionNumber}
```

## 5. 数式

取得できる場合は、次を両方保存します。

- `displayedValue`: Excelに表示された計算結果
- `formula`: 数式文字列

Markdownへは`displayedValue`を使用し、`formula`は証跡として保持します。

## 6. 非表示

- アクティブな抽出対象シート内の非表示行・列は対象に含める。
- `hiddenRow` / `hiddenColumn`を出典へ記録する。
- 旧版・バックアップ・非正本のシートは、非表示状態ではなくプロファイルで除外する。

## 7. アセット

画像、drawing、media、chart、comment、VML、図形内文字は`J-60`へ登録します。読めない内容を本文へ推測転記しません。
