---
name: springboot-patterns
description: Spring Bootのcontroller、service、repository、DTO、validation、caching、async、loggingの設計とレビューに使う。
---

# Spring Boot Patterns

Spring Boot では、controller は薄く、service は transaction と business rule を持ち、repository は永続化に集中させます。

## Related assets

- 主な入口 prompts: `plan`, `code-review`, `update-docs`
- 主な agents: `architect`, `java-reviewer`
- 関連 instructions: `java-spring`, `testing`

## 使うタイミング

- REST API を追加する
- service / repository の責務を整理する
- validation、exception handling、logging を設計する
- caching や async 処理を追加する

## Layering

- Controller: HTTP request / response、validation、status code
- Service: use case、transaction、domain rule
- Repository: data access
- DTO: API contract
- Domain: business concept と invariant

## Controller

- `@Validated` と `@Valid` を使う。
- entity を直接返さない。
- `ResponseEntity` で status を明示する。
- pagination parameter には default と upper bound を設ける。

## Service

- write use case は `@Transactional`。
- read use case は `@Transactional(readOnly = true)`。
- 外部 API 呼び出しを DB transaction 内で長く保持しない。
- domain exception を投げ、controller advice で HTTP に変換する。

## Configuration

- environment 固有値は `application.yml` に直書きせず property 化する。
- `@ConfigurationProperties` で型付き設定にする。
- secret は環境変数または secret manager から読む。

## Observability

- SLF4J の structured logging を使う。
- request id / correlation id を伝播する。
- PII、token、password を log に出さない。
- metrics と health endpoint を用意する。

## Review checklist

- [ ] controller が business logic を持ちすぎていない
- [ ] validation が boundary にある
- [ ] transaction 境界が service にある
- [ ] exception が一貫した API error に変換される
- [ ] config と secret の扱いが安全
