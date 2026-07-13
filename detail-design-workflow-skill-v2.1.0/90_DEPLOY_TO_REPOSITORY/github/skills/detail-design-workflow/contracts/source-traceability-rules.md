# 出典・トレーサビリティ規約

## 確定レコード

`evidenceState=explicit`または`derived`のレコードは、最低1件の`sourceRefs`を持ちます。

## locator

推奨形式:

```text
<workbook>/<sheet>!<cell-range>
<workbook>/<sheet>#<block-id>/<row-id>
```

セル位置が取得できない場合は、シート名、見出し、行ID、親キーを組み合わせます。

## 原文

機密値を大量転記せず、照合に必要な最小限を`displayedValue`へ残します。業務データのサンプル値は、構造把握に不要なら保持しません。

## coverage

全sourceUnitを次のいずれかに分類します。

- `extracted`
- `metadata`
- `asset`
- `ignored`
- `reference_only`
- `issue`

`unaccountedSourceUnitCount`は0でなければなりません。
