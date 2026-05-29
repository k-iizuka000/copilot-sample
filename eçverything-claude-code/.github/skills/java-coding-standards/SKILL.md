---
name: java-coding-standards
description: Java 17+とSpring Bootサービスで、読みやすく型安全で保守しやすいコードを書くまたはレビューするときに使う。
---

# Java Coding Standards

Java code は clever さより、読みやすさ、型安全性、明示的な error handling を優先します。

## Related assets

- 主な入口 prompts: `code-review`, `quality-gate`, `verify`
- 主な agents: `java-reviewer`, `code-reviewer`
- 関連 instructions: `java-spring`, `testing`

## 原則

- 明確さを最優先する。
- shared mutable state を減らす。
- domain error は意味のある例外にする。
- `Optional`、record、final field を適切に使う。
- logging は構造化し、機密情報を出さない。

## Naming

- class / record: `PascalCase`
- method / field: `camelCase`
- constant: `UPPER_SNAKE_CASE`
- package: 小文字、domain / layer が分かる名前

## Optional

- repository の `find*` は `Optional<T>` を返す。
- `Optional.get()` を避け、`map`、`orElseThrow` を使う。
- field や parameter に `Optional` を乱用しない。

## Exception

- domain 固有の例外を作る。
- `catch (Exception)` は boundary 以外で避ける。
- 技術例外は context を付けて wrap する。
- HTTP 変換は controller advice など境界で行う。

## Stream

- 短い変換に使う。
- nested stream が読みにくい場合は loop を選ぶ。
- side effect を stream pipeline に混ぜない。

## Project layout

```text
src/main/java/com/example/app/
  config/
  controller/
  service/
  repository/
  domain/
  dto/
  exception/
```

## Review checklist

- [ ] public method の責務が1つに近い
- [ ] null handling が明示されている
- [ ] validation が boundary で行われている
- [ ] log に token、password、PII が出ない
- [ ] test が behavior を見ている
