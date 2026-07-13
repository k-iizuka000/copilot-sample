# 契約上の判断方針

| 論点 | 採用方針 |
|---|---|
| 5冊すべてを契約対象にするか | すべて対象。画面・処理はfeature、DB/VIEW/権限はshared_master |
| レイアウト画像 | J-60へ分離。明示テキスト・表示モードだけJSON化 |
| 数式 | 表示値と数式を両方保持。詳細設計は表示値を使用 |
| hidden行 | アクティブ抽出シートでは含める |
| 旧版・bk | manifestへ記録して業務レコードから除外 |
| 移行・A5SQL作業 | reference_only |
| 権限SQL生成列 | derived。正本は権限マトリクス行 |
| コメント・VML | assetまたはunsupported_visual issue |
| バッチ | PROFILE-02Bは暫定。不一致時停止 |
