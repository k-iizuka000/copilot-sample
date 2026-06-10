---
applyTo: "**/src/test/java/**/*.java"
---

# JUnitテスト規約

テストコード（`src/test/java/`）を書くときの規約です。

## 基本形

- JUnit 5（`org.junit.jupiter`）を使う。
- テストクラス名は `<対象クラス名>Test`。対象クラスと同じパッケージに置く。
- `@DisplayName` で日本語の仕様文を書く。テスト名を読めば仕様が分かる状態にする。

```java
@Test
@DisplayName("振込金額30,000円ちょうどは「3万円以上」の手数料を適用する")
void calculate_boundaryAmount_appliesUpperFee() {
    // Arrange
    // Act
    // Assert
}
```

- テスト本体は Arrange-Act-Assert の3段構成。コメントで区切る。
- 1テストメソッド = 1観点。複数の観点を1メソッドに詰め込まない。

## 設計書とのトレーサビリティ

- テストクラスのJavadocに、検証対象の設計書箇所とタスクIDを書く。

```java
/**
 * 設計書: docs/designs/DS-001_振込手数料計算/003-処理仕様.md「2. 手数料決定」
 * タスク: T-002
 */
```

## 決定表・境界値のテスト

- 設計書の決定表は `@ParameterizedTest` + `@CsvSource` で**全組み合わせ**をテストする。

```java
@ParameterizedTest(name = "会員={0}, 振込先={1}, 金額={2} → 手数料={3}円")
@CsvSource({
    "GENERAL, SAME_BRANCH, 29999, 110",
    "GENERAL, SAME_BRANCH, 30000, 220",
    // …決定表の全セルを網羅する
})
```

- 境界値は「境界ちょうど」「境界の1つ手前」を必ず両方テストする。
- 例外は `assertThrows` で型とメッセージの両方を検証する。

## BigDecimalの比較

- 値の比較は `assertEquals(0, expected.compareTo(actual))` ではなく、スケールまで仕様で決まっている場合のみ `assertEquals` を使う。迷ったら `usingComparator` ではなく `compareTo` の結果を検証し、意図をテスト名に書く。

## 禁止事項

- **アサーションのないテスト**（実行するだけのテストはカバレッジ偽装とみなす）
- 本番コードの計算ロジックをテスト側へコピーして期待値を作ること（期待値は設計書から手で求めた値を直書きする）
- `@Disabled` の放置（無効化するなら理由と質問票番号を必ず書く)
- テストの実行順序への依存
