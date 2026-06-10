---
name: jacoco-coverage
description: |
  JaCoCoでline/branchカバレッジ100%を達成・確認するための手順。
  カバレッジの確認、不足分岐の特定、mvn clean verifyのカバレッジゲート対応を行うときに使う。
  Use when measuring or improving JaCoCo test coverage.
---

# JaCoCoカバレッジ100%の手順

## 計測と確認

```bash
mvn clean verify
```

- このプロジェクトでは `verify` でJaCoCoの `check` が走り、**line 100% / branch 100%** 未達ならビルドが失敗する。
- **`clean` を省略しない**こと。JaCoCoの実行データ（`target/jacoco.exec`）は前回実行分に追記されるため、`clean` なしではテストを削っても古いデータで100%に見えてしまう（検証済みの罠）。
- レポートの場所:
  - 人間向け: `target/site/jacoco/index.html`
  - 機械処理向け: `target/site/jacoco/jacoco.csv`（列: `LINE_MISSED`, `BRANCH_MISSED` などを見る）

```bash
# カバレッジが欠けているクラスを特定する（MISSEDが0でない行を探す）
grep -v ',0,.*,0,' target/site/jacoco/jacoco.csv | head
```

## 不足分岐の典型と潰し方（正攻法）

| 欠けやすい箇所 | 追加するテスト |
| --- | --- |
| `if` の片側 | 条件が偽（または真）になる入力のテスト |
| `&&` / `||` の短絡 | 各項が単独で結果を決める入力の組み合わせ |
| 例外スロー部 | `assertThrows` の異常系テスト |
| `switch` / enumの分岐 | 全区分値のParameterizedTest |
| 早期return | その経路に入る入力のテスト |
| ユーティリティクラスのprivateコンストラクタ | JaCoCoは未実行の行として数える。staticメソッドだけのクラスは作らず、インスタンス化して使う設計を優先する（どうしても必要なら質問票 → 除外手続きへ） |

足すテストは必ず**設計書のどの仕様の検証か**を `@DisplayName` で言えるものにする。言えないなら、それは「設計書にない分岐」の可能性がある → 本番コード側が過剰実装でないか疑い、reviewer / 質問票へ。

## やってはいけないこと

- **アサーションなしで呼ぶだけのテスト**でカバレッジを稼ぐ（レビューでBlocker扱い）
- カバレッジを通すために本番コードを変形する（分岐の削除・テスト用フック追加など）
- `pom.xml` のJaCoCo除外（excludes）を**勝手に追加**する

## 除外が本当に必要な場合の手続き

カバレッジ不能なコード（例: フレームワーク要求の定型コード）が出た場合:

1. `docs/questions/` に質問票を起こす（なぜテスト不能か、除外対象、代替の品質担保を書く）
2. 人間の回答（承認）を得る
3. 承認後に `pom.xml` の `<excludes>` へ追加し、コミットメッセージで質問票番号を参照する

この手続きを経ない除外はレビューでBlockerになる。
