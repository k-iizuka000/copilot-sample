# カバレッジテストケース

| ケース | 入力sourceUnit | 期待される行方 |
|---|---:|---|
| 通常レコード | 1 | extracted + recordId |
| 改訂履歴 | 1 | metadata |
| 印刷用空行 | 1 | ignored + reason |
| 画像 | 1 | asset + assetId |
| 旧版 | 1 | reference_only + reason |
| 判断不能 | 1 | issue + blocking判定 |

全ケースで`sourceUnitCount = accountedSourceUnitCount`を満たす。
