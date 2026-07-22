# 00-input

このフォルダには、`/01-setup` が変換対象の Excel 設計書（.xlsx）の**原本コピー**を自動で置きます。
人間がファイルを置いたり、CSV / TSV に書き出したりする作業は不要です（元の Excel ファイルは変更されません）。
`run-request.json` の `sourcePath` は、このフォルダ内のコピーを指します。
