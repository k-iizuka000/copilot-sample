---
name: database-migrations
description: PostgreSQL、MySQL、一般的なORM（Prisma、Drizzle、Django、TypeORM、golang-migrate）にまたがるschema changes、data migrations、rollbacks、zero-downtime deploymentsのためのDatabase migrationベストプラクティス。
origin: ECC
---

# データベースマイグレーションパターン

production systems向けの安全で可逆的なdatabase schema changes。

## いつ有効化するか

- database tablesを作成または変更するとき
- columnsまたはindexesを追加/削除するとき
- data migrations（backfill、transform）を実行するとき
- zero-downtime schema changesを計画するとき
- 新規プロジェクトでmigration toolingをセットアップするとき

## コア原則

1. **すべての変更はmigrationである** - production databasesを手動で変更しない
2. **productionでのmigrationsはforward-only** - rollbacksには新しいforward migrationsを使う
3. **Schemaとdata migrationsは分離する** - 1つのmigrationでDDLとDMLを混在させない
4. **production規模のdataに対してmigrationsをテストする** - 100行で動くmigrationが10M行ではlockすることがある
5. **デプロイ済みのmigrationsはimmutable** - productionで実行済みのmigrationを編集しない

## Migration Safetyチェックリスト

migrationを適用する前に:

- [ ] MigrationにUPとDOWNの両方がある（またはirreversibleとして明示されている）
- [ ] 大きなtablesでfull table locksがない（concurrent operationsを使う）
- [ ] 新しいcolumnsにdefaultsがあるかnullableである（defaultなしでNOT NULLを追加しない）
- [ ] Indexesがconcurrentlyに作成されている（既存tablesではCREATE TABLE内にinlineしない）
- [ ] Data backfillがschema changeとは別のmigrationである
- [ ] production dataのコピーに対してテスト済み
- [ ] Rollback planが文書化されている

## PostgreSQLパターン

### Columnを安全に追加する

```sql
-- 良い例: Nullable column、lockなし
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- 良い例: default付きcolumn（Postgres 11+では即時、rewriteなし）
ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- 悪い例: 既存tableにdefaultなしでNOT NULL（full rewriteが必要）
ALTER TABLE users ADD COLUMN role TEXT NOT NULL;
-- これはtableをlockし、すべてのrowを書き換える
```

### DowntimeなしでIndexを追加する

```sql
-- 悪い例: 大きなtablesでwritesをblockする
CREATE INDEX idx_users_email ON users (email);

-- 良い例: Non-blockingでconcurrent writesを許可する
CREATE INDEX CONCURRENTLY idx_users_email ON users (email);

-- 注意: CONCURRENTLYはtransaction block内では実行できない
-- ほとんどのmigration toolsでは、このための特別な扱いが必要
```

### ColumnのRename（Zero-Downtime）

productionで直接renameしないでください。expand-contract patternを使用します:

```sql
-- Step 1: 新しいcolumnを追加する（migration 001）
ALTER TABLE users ADD COLUMN display_name TEXT;

-- Step 2: dataをbackfillする（migration 002、data migration）
UPDATE users SET display_name = username WHERE display_name IS NULL;

-- Step 3: 両方のcolumnsをread/writeするようにapplication codeを更新する
-- application changesをdeployする

-- Step 4: 古いcolumnへのwriteを止め、dropする（migration 003）
ALTER TABLE users DROP COLUMN username;
```

### Columnを安全に削除する

```sql
-- Step 1: columnへのapplication referencesをすべて削除する
-- Step 2: column referenceなしのapplicationをdeployする
-- Step 3: 次のmigrationでcolumnをdropする
ALTER TABLE orders DROP COLUMN legacy_status;

-- Djangoの場合: SeparateDatabaseAndStateを使い、DROP COLUMNを生成せずにmodelから削除する
-- （その後、次のmigrationでdropする）
```

### 大規模Data Migrations

```sql
-- 悪い例: 1つのtransactionですべてのrowsを更新する（tableをlockする）
UPDATE users SET normalized_email = LOWER(email);

-- 良い例: progress付きのbatch update
DO $$
DECLARE
  batch_size INT := 10000;
  rows_updated INT;
BEGIN
  LOOP
    UPDATE users
    SET normalized_email = LOWER(email)
    WHERE id IN (
      SELECT id FROM users
      WHERE normalized_email IS NULL
      LIMIT batch_size
      FOR UPDATE SKIP LOCKED
    );
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % rows', rows_updated;
    EXIT WHEN rows_updated = 0;
    COMMIT;
  END LOOP;
END $$;
```

## Prisma (TypeScript/Node.js)

### ワークフロー

```bash
# schema changesからmigrationを作成する
npx prisma migrate dev --name add_user_avatar

# productionでpending migrationsを適用する
npx prisma migrate deploy

# databaseをresetする（devのみ）
npx prisma migrate reset

# schema changes後にclientを生成する
npx prisma generate
```

### Schema例

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatarUrl String?  @map("avatar_url")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  orders    Order[]

  @@map("users")
  @@index([email])
}
```

### Custom SQL Migration

Prismaで表現できない操作（concurrent indexes、data backfills）の場合:

```bash
# 空のmigrationを作成し、その後SQLを手動編集する
npx prisma migrate dev --create-only --name add_email_index
```

```sql
-- migrations/20240115_add_email_index/migration.sql
-- PrismaはCONCURRENTLYを生成できないため、手動で書く
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users (email);
```

## Drizzle (TypeScript/Node.js)

### ワークフロー

```bash
# schema changesからmigrationを生成する
npx drizzle-kit generate

# migrationsを適用する
npx drizzle-kit migrate

# schemaを直接pushする（devのみ、migration fileなし）
npx drizzle-kit push
```

### Schema例

```typescript
import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

## Django (Python)

### ワークフロー

```bash
# model changesからmigrationを生成する
python manage.py makemigrations

# migrationsを適用する
python manage.py migrate

# migration statusを表示する
python manage.py showmigrations

# custom SQL用に空のmigrationを生成する
python manage.py makemigrations --empty app_name -n description
```

### Data Migration

```python
from django.db import migrations

def backfill_display_names(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    batch_size = 5000
    users = User.objects.filter(display_name="")
    while users.exists():
        batch = list(users[:batch_size])
        for user in batch:
            user.display_name = user.username
        User.objects.bulk_update(batch, ["display_name"], batch_size=batch_size)

def reverse_backfill(apps, schema_editor):
    pass  # Data migrationのためreverseは不要

class Migration(migrations.Migration):
    dependencies = [("accounts", "0015_add_display_name")]

    operations = [
        migrations.RunPython(backfill_display_names, reverse_backfill),
    ]
```

### SeparateDatabaseAndState

Django modelからcolumnを削除しつつ、databaseからはすぐにdropしない:

```python
class Migration(migrations.Migration):
    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.RemoveField(model_name="user", name="legacy_field"),
            ],
            database_operations=[],  # まだDBには触れない
        ),
    ]
```

## golang-migrate (Go)

### ワークフロー

```bash
# migration pairを作成する
migrate create -ext sql -dir migrations -seq add_user_avatar

# すべてのpending migrationsを適用する
migrate -path migrations -database "$DATABASE_URL" up

# 最後のmigrationをrollbackする
migrate -path migrations -database "$DATABASE_URL" down 1

# versionを強制する（dirty stateの修正）
migrate -path migrations -database "$DATABASE_URL" force VERSION
```

### Migration Files

```sql
-- migrations/000003_add_user_avatar.up.sql
ALTER TABLE users ADD COLUMN avatar_url TEXT;
CREATE INDEX CONCURRENTLY idx_users_avatar ON users (avatar_url) WHERE avatar_url IS NOT NULL;

-- migrations/000003_add_user_avatar.down.sql
DROP INDEX IF EXISTS idx_users_avatar;
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
```

## Zero-Downtime Migration戦略

重要なproduction changesでは、expand-contract patternに従います:

```
Phase 1: EXPAND
  - 新しいcolumn/tableを追加する（nullableまたはdefault付き）
  - Deploy: appがoldとnewの両方にwriteする
  - 既存dataをbackfillする

Phase 2: MIGRATE
  - Deploy: appがNEWからreadし、BOTHへwriteする
  - data consistencyをverifyする

Phase 3: CONTRACT
  - Deploy: appがNEWのみを使う
  - 別のmigrationで古いcolumn/tableをdropする
```

### Timeline例

```
Day 1: Migrationでnew_status columnを追加する（nullable）
Day 1: app v2をdeployする — statusとnew_statusの両方にwriteする
Day 2: 既存rows向けにbackfill migrationを実行する
Day 3: app v3をdeployする — new_statusのみからreadする
Day 7: Migrationで古いstatus columnをdropする
```

## アンチパターン

| アンチパターン | 失敗する理由 | より良いアプローチ |
|-------------|-------------|-----------------|
| productionでのManual SQL | audit trailがなく、再現不能 | 常にmigration filesを使用する |
| deployed migrationsの編集 | environments間のdriftを引き起こす | 代わりに新しいmigrationを作成する |
| defaultなしのNOT NULL | tableをlockし、全行を書き換える | nullableを追加し、backfillしてからconstraintを追加する |
| 大きなtableでのInline index | build中にwritesをblockする | CREATE INDEX CONCURRENTLY |
| 1つのmigrationでSchema + data | rollbackが難しく、transactionsが長い | migrationsを分離する |
| code削除前のcolumn drop | missing columnでapplication errors | 先にcodeを削除し、次のdeployでcolumnをdropする |
