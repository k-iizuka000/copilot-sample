---
name: tdd-junit
description: |
  JUnit 5でRed-Green-Refactorを厳密に回すための手順とコマンド。
  TDD実装、テストファースト、失敗するテストの確認、決定表のParameterizedTest化を行うときに使う。
  Use when implementing Java code with TDD and JUnit 5.
---

# TDD（JUnit 5）の回し方

## 0. テストリストを作る

タスクファイルの「テスト観点」表を、作業用チェックリストに写す。

```
- [ ] 観点1: 同一支店・3万円未満 → 110円
- [ ] 観点2: 境界値 30,000円ちょうど → 3万円以上側
- [ ] 観点3: 金額0 → E001例外
```

## 1. Red — 失敗するテストを1つ書く

- リストの観点を**1つだけ**選び、テストを書く。
- 実行して**実際に失敗を見る**。

```bash
mvn test -Dtest=FeeCalculatorTest
```

- 対象クラスがまだ無いことによる**コンパイルエラーも正しいRed**。その場合は空実装（`throw new UnsupportedOperationException()` など）を作ってテストを「失敗」させてもよい。
- 失敗メッセージが**期待した理由**であることを確認する（別の理由で落ちているなら、テストの書き方を直す）。

## 2. Green — 最小限で通す

- そのテストを通す**最小限**の本番コードを書く。先回りして他の観点まで実装しない。
- `mvn test -Dtest=<クラス>` で緑を確認し、続けて `mvn test` で**全テスト**が緑なことも確認する。

## 3. Refactor — 緑のまま整える

- 重複の除去、定数化、命名改善を行う。規約: `.github/instructions/java-coding.instructions.md`
- 1回のRefactorごとに `mvn test` で緑を維持する。
- チェックリストの項目を消し、次の観点で 1 に戻る。

## 4. 仕上げ — カバレッジゲート

```bash
mvn clean verify
```

- JaCoCoのチェック（line/branch 100%）が落ちたら、skill `jacoco-coverage` の手順で不足箇所を特定してテストを足す。

## JUnit 5の道具の使い分け

| 場面 | 道具 |
| --- | --- |
| 決定表の全セル網羅 | `@ParameterizedTest` + `@CsvSource`（`name = "…{0}…"` で観点を表示） |
| 例外の検証 | `assertThrows(型, …)` + `getMessage()` の検証 |
| 値オブジェクトの等価性 | `assertEquals`（`BigDecimal` はスケールに注意。スケール不定なら `compareTo` の結果を検証） |
| 前提が共通の一連の観点 | `@Nested` クラスで仕様の階層を表現 |

## 期待値の作り方（重要）

- 期待値は**設計書から手計算で**求めて直書きする。
- 本番コードと同じ計算をテスト内に書いて期待値を作るのは禁止（トートロジーテストになり、バグごと緑になる）。

## 進捗の報告

各サイクルの完了時に、消した観点・Redの失敗メッセージ（要約）・Green確認の結果を簡潔に残す。これがレビュー時の「Redを踏んだ証拠」になる。
