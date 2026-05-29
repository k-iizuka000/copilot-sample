---
name: springboot-tdd
description: Spring BootでJUnit 5、Mockito、MockMvc、DataJpaTest、Testcontainersを使ってTDDで実装するときに使う。
---

# Spring Boot TDD

Spring Boot の TDD では、service、web、repository、integration の各層に合ったテストを選びます。

## Related assets

- 主な入口 prompts: `tdd`, `test-coverage`
- 主な agents: `tdd-guide`
- 関連 instructions: `testing`, `java-spring`, `database`

## 使うタイミング

- endpoint や use case を追加する
- bug fix を regression test で固定する
- repository query や security rule を追加する
- refactoring の安全網を作る

## Loop

1. 期待挙動を test name にする。
2. 失敗するテストを書く。
3. 最小実装で通す。
4. green のまま refactor する。
5. 関連 suite と coverage を確認する。

## Test種類

- Unit: service / domain logic。JUnit 5、AssertJ、Mockito。
- Web: controller contract。`@WebMvcTest` と MockMvc。
- Persistence: repository / mapping。`@DataJpaTest` と Testcontainers。
- Integration: 主要 flow。`@SpringBootTest` と test profile。

## Test data

- fixture は読みやすい builder にする。
- random data は必要な場合だけ使い、seed を固定する。
- external time は clock injection で制御する。
- DB test は cleanup と isolation を明確にする。

## Coverage

- 80% は目安であり、重要 domain / security / migration 周辺はより厚くする。
- getter / generated code で coverage を稼がない。
- bug fix では、bug が再発したら落ちる assertion を必ず入れる。

## Commands

```bash
mvn test
mvn verify
./gradlew test
./gradlew test jacocoTestReport
```

## 完了条件

- 追加テストが修正前に落ちることを確認した、または確認できない理由を明記
- 修正後に関連テストが通る
- integration が必要な箇所を unit test だけで済ませていない
