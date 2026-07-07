---
applyTo: "**/*.java"
description: "Java実装の規約とトレーサビリティヘッダ"
---

# Java 実装規約

## トレーサビリティヘッダ（必須）

クラス先頭の Javadoc に、根拠にした設計書へのタグを付ける。

```java
/**
 * @spec-front spec/front/FUNC-0123/items.md
 * @spec-back  spec/back/FUNC-0123/methods.md
 * @spec-db    spec/db/T_ORDER.md
 * @biz-rule   BR-0045
 */
```

- コード生成・修正時に必ず付与し、参照が変わったら追随させる。手で消さない。
- どの設計書を読むべきかは消費マトリクス（[spec.instructions.md](./spec.instructions.md)）に従う。

## 命名規約

<!-- TODO: /naming-convention-draft の成果物（有識者確認済み）をここへ転記する -->

確定までの暫定ルール: DCS の同種ファイルの命名に合わせ、参考にした DCS ファイルのパスを作業報告に含める。

## レイヤ責務

<!-- TODO: 代表機能の実物検証後に、Controller / Service / Repository それぞれの責務（何を書いてよいか・書いてはいけないか）を定義する -->

確定までの暫定ルール: DCS の同種画面の「処理の置き場所」に合わせる。

## 禁止

- 設計書にないバリデーション・分岐・項目・メソッドの追加
- DCS からの業務ロジックの流用（参考にするのは構成・パターンのみ）
