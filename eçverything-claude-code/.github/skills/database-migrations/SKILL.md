---
name: database-migrations
description: production databaseのschema change、data migration、rollback、zero-downtime deploymentを設計またはレビューするときに使う。
---

# Database Migrations

production database の変更は、アプリケーション deploy と同じくらい慎重に扱います。実行済み migration は編集せず、forward-only で修正します。

## Related assets

- 主な入口 prompts: `plan`, `code-review`, `verify`, `orchestrate`
- 主な agents: `database-reviewer`, `architect`
- 関連 instructions: `database`, `security`, `testing`

## 使うタイミング

- table、column、index を追加または削除する
- backfill や data transform を行う
- JPA entity と schema を同期する
- zero-downtime deploy が必要

## 原則

- すべての DB 変更は migration として管理する。
- schema migration と data migration を分ける。
- production 実行済み migration は immutable。
- 大きい table では lock と rewrite を事前に確認する。
- rollback は原則、新しい forward migration と operational rollback で扱う。

## 安全チェック

- [ ] 既存 table への `NOT NULL` 追加に安全な手順がある
- [ ] 大きな index は non-blocking な方法で作る
- [ ] column rename / drop は expand-contract pattern にしている
- [ ] backfill は batch 化され、途中再開できる
- [ ] application code と migration の順序が明確
- [ ] staging または production 相当データで検証した

## Expand-contract pattern

1. 新しい column / table を追加する。
2. app を dual write / compatible read にする。
3. data を backfill する。
4. read path を新 schema に切り替える。
5. 古い write を止める。
6. 十分に観測してから古い schema を削除する。

## PostgreSQL注意点

- 既存大規模 table に index を作るときは `CREATE INDEX CONCURRENTLY` を検討する。
- `CREATE INDEX CONCURRENTLY` は transaction block 内で実行できない。
- `DROP COLUMN` は app deploy 後に別 migration にする。
- 長い transaction、full table scan、batch なし backfill を避ける。

## Spring Boot / JPA

- production では Hibernate auto DDL に依存しない。
- Flyway または Liquibase を使う。
- entity 変更、repository query、migration、test fixture を同時に確認する。
- `@DataJpaTest` と Testcontainers で実 schema に近い検証を行う。
