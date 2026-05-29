---
name: postgres-patterns
description: PostgreSQLのschema、index、query、RLS、timeout、pooling、migration safetyを設計またはレビューするときに使う。
---

# PostgreSQL Patterns

PostgreSQL では、query pattern に合った schema と index、適切な timeout、最小権限が production 安定性を支えます。

## Related assets

- 主な入口 prompts: `code-review`, `plan`, `verify`
- 主な agents: `database-reviewer`, `architect`
- 関連 instructions: `database`, `security`

## 使うタイミング

- schema / migration を設計する
- slow query を調査する
- index を追加する
- RLS や権限を設計する
- connection pooling や timeout を調整する

## Data type

- ID: `bigint` または要件に合う UUID
- 文字列: 原則 `text`
- 時刻: `timestamptz`
- 金額: `numeric`
- flag: `boolean`

## Index

- equality 条件を先、range / sort 条件を後にする。
- `WHERE deleted_at IS NULL` などには partial index を検討する。
- JSONB 検索には GIN index を検討する。
- 時系列巨大 table には BRIN index を検討する。
- 追加前に `EXPLAIN (ANALYZE, BUFFERS)` で効果を確認する。

## Query pattern

- offset pagination は大きな page で遅くなるため cursor pagination を検討する。
- queue 処理には `FOR UPDATE SKIP LOCKED` を使う。
- `SELECT *` を避け、必要な列だけ取る。
- transaction を短くし、idle transaction を残さない。

## Security / operation

- application user は最小権限にする。
- `public` schema の default 権限を見直す。
- statement timeout と idle transaction timeout を設定する。
- `pg_stat_statements` で slow query を観測する。
- backup / restore を実際に検証する。

## Review checklist

- [ ] migration が lock と data size を考慮している
- [ ] 外部キーに必要な index がある
- [ ] query plan を確認した
- [ ] timeout が設定されている
- [ ] secret / credential が安全に管理されている
