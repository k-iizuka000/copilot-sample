# 分類ルール

## レイヤーとスコープを分離する

```text
layers: frontend / backend / db / integration / test / authorization
scope: individual / common / shared_master / unknown
```

一つの仕様は複数レイヤーを持てます。複数レイヤーに該当することを理由にレコードを複製せず、同じ`recordId`へ複数`layers`を付けます。

## スコープ

- `individual`: 一つの機能ID・画面ID・処理IDに限定
- `common`: 規約として複数機能へ適用することが原本に明記
- `shared_master`: エンティティ、VIEW、ロール、権限表等の共有マスター
- `unknown`: 原本から判断不能

単に複数機能で使えそうという理由で`common`にしません。

## 正本優先

- 無印・現行と明記されたシートを優先する。
- `*_bk`、`旧版`、`古い`、版番号付き旧シートは業務レコードへ混ぜない。
- `移行`、`作業`、`A5SQL`、生成SQLは`reference_only`または`derived`とする。
- 正本候補が複数あり優先を決められない場合は停止する。

## 該当なしと未確認

- `該当なし`: 対象資料を確認し、対象レコードが存在しない。
- `未確認`: 資料不足、読取不能、判断不能。

両者を置き換えません。
