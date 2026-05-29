---
name: jpa-patterns
description: Spring BootでJPA/Hibernateのentity、repository、transaction、query performance、N+1、Testcontainers検証を扱うときに使う。
---

# JPA / Hibernate Patterns

JPA は便利ですが、entity design、fetch strategy、transaction boundary を曖昧にすると production で性能と整合性の問題になります。

## 使うタイミング

- entity / relationship を追加する
- repository query を作る
- N+1 や遅い query を調査する
- transaction 境界を決める
- migration と JPA mapping を同期する

## Entity設計

- table / column 名を明示する。
- `EnumType.STRING` を使う。
- collection は原則 lazy にする。
- entity を API response に直接返さず DTO へ変換する。
- auditing は `@CreatedDate` / `@LastModifiedDate` を使う。

## Repository

- derived query は簡単な条件に限定する。
- 複雑な read path は `@Query`、projection、DTO query を使う。
- pagination には安定した sort を付ける。
- 大量一覧で entity graph を不用意に広げない。

## N+1対策

- 必要な read path だけ `JOIN FETCH` または entity graph を使う。
- 一覧では DTO projection を優先する。
- SQL log と query count で検証する。

## Transaction

- service layer に transaction boundary を置く。
- read path には `@Transactional(readOnly = true)` を付ける。
- 長時間 transaction、外部 API 呼び出しを含む transaction を避ける。
- lazy entity を transaction 外へ漏らさない。

## Test

- repository は `@DataJpaTest` を使う。
- production DB が PostgreSQL なら Testcontainers で近い環境にする。
- migration、entity mapping、repository query を同じ test path で検証する。

## Review checklist

- [ ] entity と migration が一致
- [ ] collection fetch が過剰でない
- [ ] N+1 の検証がある
- [ ] transaction が service boundary にある
- [ ] index が query pattern に合っている
