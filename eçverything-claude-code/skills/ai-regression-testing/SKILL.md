---
name: ai-regression-testing
description: AI支援開発のための回帰テスト戦略。データベース依存のないsandbox-mode APIテスト、自動bug-checkワークフロー、同じモデルがコードを書いてレビューする際のAIの盲点を捉えるパターン。
origin: ECC
---

# AI回帰テスト

AI支援開発向けに特化して設計されたテストパターンです。同じモデルがコードを書き、それをレビューすることで、automated testsでしか捕捉できない体系的な盲点が生まれます。

## いつ有効化するか

- AI agent（Claude Code、Cursor、Codex）がAPI routesまたはbackend logicを変更した
- バグが見つかって修正され、再導入を防ぐ必要がある
- プロジェクトにDBなしテストへ活用できるsandbox/mock modeがある
- コード変更後に`/bug-check`や類似のレビューコマンドを実行している
- 複数のコードパスが存在する（sandbox vs production、feature flagsなど）

## 中核となる問題

AIがコードを書き、その後で自分の作業をレビューすると、同じ前提を両方のステップに持ち込みます。これにより、予測可能な失敗パターンが生まれます:

```
AIがfixを書く → AIがfixをreviewする → AIが「looks correct」と言う → Bugがまだ存在する
```

**実例**（productionで観測）:

```
Fix 1: notification_settingsをAPI responseへ追加
  → SELECT queryへの追加を忘れた
  → AIがreviewしたが見逃した（同じblind spot）

Fix 2: SELECT queryへ追加
  → TypeScript build error（columnがgenerated typesにない）
  → AIはFix 1をreviewしたがSELECT issueを捕捉しなかった

Fix 3: SELECT *へ変更
  → production pathは修正したが、sandbox pathを忘れた
  → AIがreviewし、また見逃した（4回目）

Fix 4: Testが初回runで即座に捕捉した
```

このパターン: **sandbox/production path inconsistency**は、AIが導入する回帰の第1位です。

## Sandbox-Mode APIテスト

AI-friendlyなアーキテクチャを持つほとんどのプロジェクトには、sandbox/mock modeがあります。これが高速でDB不要なAPI testingの鍵です。

### セットアップ（Vitest + Next.js App Router）

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["__tests__/**/*.test.ts"],
    setupFiles: ["__tests__/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

```typescript
// __tests__/setup.ts
// sandbox modeを強制する — databaseは不要
process.env.SANDBOX_MODE = "true";
process.env.NEXT_PUBLIC_SUPABASE_URL = "";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";
```

### Next.js API Routes用のテストヘルパー

```typescript
// __tests__/helpers.ts
import { NextRequest } from "next/server";

export function createTestRequest(
  url: string,
  options?: {
    method?: string;
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
    sandboxUserId?: string;
  },
): NextRequest {
  const { method = "GET", body, headers = {}, sandboxUserId } = options || {};
  const fullUrl = url.startsWith("http") ? url : `http://localhost:3000${url}`;
  const reqHeaders: Record<string, string> = { ...headers };

  if (sandboxUserId) {
    reqHeaders["x-sandbox-user-id"] = sandboxUserId;
  }

  const init: { method: string; headers: Record<string, string>; body?: string } = {
    method,
    headers: reqHeaders,
  };

  if (body) {
    init.body = JSON.stringify(body);
    reqHeaders["content-type"] = "application/json";
  }

  return new NextRequest(fullUrl, init);
}

export async function parseResponse(response: Response) {
  const json = await response.json();
  return { status: response.status, json };
}
```

### 回帰テストを書く

重要な原則: **動いているコードではなく、見つかったバグに対してテストを書く**。

```typescript
// __tests__/api/user/profile.test.ts
import { describe, it, expect } from "vitest";
import { createTestRequest, parseResponse } from "../../helpers";
import { GET, PATCH } from "@/app/api/user/profile/route";

// contractを定義する — responseに必ず含めるfields
const REQUIRED_FIELDS = [
  "id",
  "email",
  "full_name",
  "phone",
  "role",
  "created_at",
  "avatar_url",
  "notification_settings",  // ← bugでmissingが見つかった後に追加
];

describe("GET /api/user/profile", () => {
  it("returns all required fields", async () => {
    const req = createTestRequest("/api/user/profile");
    const res = await GET(req);
    const { status, json } = await parseResponse(res);

    expect(status).toBe(200);
    for (const field of REQUIRED_FIELDS) {
      expect(json.data).toHaveProperty(field);
    }
  });

  // Regression test — この正確なbugはAIにより4回導入された
  it("notification_settings is not undefined (BUG-R1 regression)", async () => {
    const req = createTestRequest("/api/user/profile");
    const res = await GET(req);
    const { json } = await parseResponse(res);

    expect("notification_settings" in json.data).toBe(true);
    const ns = json.data.notification_settings;
    expect(ns === null || typeof ns === "object").toBe(true);
  });
});
```

### Sandbox/Production Parityをテストする

最も一般的なAI回帰: production pathを修正したがsandbox pathを忘れる（またはその逆）。

```typescript
// sandbox responsesがexpected contractに一致することをtestする
describe("GET /api/user/messages (conversation list)", () => {
  it("includes partner_name in sandbox mode", async () => {
    const req = createTestRequest("/api/user/messages", {
      sandboxUserId: "user-001",
    });
    const res = await GET(req);
    const { json } = await parseResponse(res);

    // partner_nameがproduction pathにだけ追加され、
    // sandbox pathには追加されなかったbugをこれで捕捉した
    if (json.data.length > 0) {
      for (const conv of json.data) {
        expect("partner_name" in conv).toBe(true);
      }
    }
  });
});
```

## Bug-Checkワークフローへテストを統合する

### カスタムコマンド定義

```markdown
<!-- .claude/commands/bug-check.md -->
# バグチェック

## ステップ1: 自動テスト（必須、skip不可）

code reviewの前に、まずこれらのcommandsを実行する:

    npm run test       # Vitest test suite
    npm run build      # TypeScript type check + build

- testsがfailした場合 → 最優先のbugとしてreportする
- buildがfailした場合 → type errorsを最優先としてreportする
- 両方passした場合のみステップ2へ進む

## ステップ2: コードレビュー（AI review）

1. Sandbox / production pathの一貫性
2. API response shapeがfrontend expectationsと一致する
3. SELECT clauseの完全性
4. rollback付きerror handling
5. optimistic updateのrace conditions

## ステップ3: 修正した各bugについてregression testを提案する
```

### ワークフロー

```
User: "バグチェックして" (or "/bug-check")
  │
  ├─ ステップ1: npm run test
  │   ├─ FAIL → bugをmechanicallyに発見（AI judgment不要）
  │   └─ PASS → 続行
  │
  ├─ ステップ2: npm run build
  │   ├─ FAIL → type errorをmechanicallyに発見
  │   └─ PASS → 続行
  │
  ├─ ステップ3: AI code review（known blind spotsを意識する）
  │   └─ findingsをreportする
  │
  └─ ステップ4: 各fixについてregression testを書く
      └─ fixが壊れた場合、次のbug-checkで捕捉する
```

## よくあるAI回帰パターン

### パターン1: Sandbox/Production Path Mismatch

**頻度**: 最も一般的（4件中3件の回帰で観測）

```typescript
// ❌ AIがproduction pathにだけfieldを追加する
if (isSandboxMode()) {
  return { data: { id, email, name } };  // new fieldがmissing
}
// Production path
return { data: { id, email, name, notification_settings } };

// ✅ 両方のpathsが同じshapeを返す必要がある
if (isSandboxMode()) {
  return { data: { id, email, name, notification_settings: null } };
}
return { data: { id, email, name, notification_settings } };
```

**これを捕捉するテスト**:

```typescript
it("sandbox and production return same fields", async () => {
  // test envではsandbox modeがONに強制される
  const res = await GET(createTestRequest("/api/user/profile"));
  const { json } = await parseResponse(res);

  for (const field of REQUIRED_FIELDS) {
    expect(json.data).toHaveProperty(field);
  }
});
```

### パターン2: SELECT句の漏れ

**頻度**: Supabase/Prismaで新しいカラムを追加するときによくある

```typescript
// ❌ new columnをresponseへ追加したがSELECTには追加していない
const { data } = await supabase
  .from("users")
  .select("id, email, name")  // notification_settingsがここにない
  .single();

return { data: { ...data, notification_settings: data.notification_settings } };
// → notification_settings is always undefined

// ✅ SELECT *を使うかnew columnsを明示的に含める
const { data } = await supabase
  .from("users")
  .select("*")
  .single();
```

### パターン3: Error State Leakage

**頻度**: 中程度。既存コンポーネントへエラーハンドリングを追加するときに起きる

```typescript
// ❌ error stateはsetしたがold dataをclearしていない
catch (err) {
  setError("Failed to load");
  // reservationsにはprevious tabのdataがまだ表示される
}

// ✅ error時にrelated stateをclearする
catch (err) {
  setReservations([]);  // stale dataをclearする
  setError("Failed to load");
}
```

### パターン4: 適切なRollbackのないOptimistic Update

```typescript
// ❌ failure時のrollbackがない
const handleRemove = async (id: string) => {
  setItems(prev => prev.filter(i => i.id !== id));
  await fetch(`/api/items/${id}`, { method: "DELETE" });
  // APIがfailすると、itemはUIから消えるがDBには残る
};

// ✅ previous stateをcaptureし、failure時にrollbackする
const handleRemove = async (id: string) => {
  const prevItems = [...items];
  setItems(prev => prev.filter(i => i.id !== id));
  try {
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("API error");
  } catch {
    setItems(prevItems);  // rollback
    alert("削除に失敗しました");
  }
};
```

## 戦略: バグが見つかった場所をテストする

100% coverageを目指さないでください。代わりに:

```
Bug found in /api/user/profile     → profile API向けtestを書く
Bug found in /api/user/messages    → messages API向けtestを書く
Bug found in /api/user/favorites   → favorites API向けtestを書く
No bug in /api/user/notifications  → まだtestを書かない
```

**これがAI開発で機能する理由:**

1. AIは**同じカテゴリのミス**を繰り返しがち
2. バグは複雑な領域（auth、multi-path logic、state management）に集中する
3. 一度テストされると、その正確な回帰は**二度と起こせない**
4. テスト数はバグ修正とともに自然に増えるため、無駄な労力がない

## クイックリファレンス

| AI回帰パターン | テスト戦略 | 優先度 |
|---|---|---|
| Sandbox/production mismatch | sandbox modeで同じresponse shapeをassertする | 🔴 High |
| SELECT clause omission | responseにすべてのrequired fieldsがあることをassertする | 🔴 High |
| Error state leakage | error時のstate cleanupをassertする | 🟡 Medium |
| Missing rollback | API failure時にstateが復元されることをassertする | 🟡 Medium |
| Type cast masking null | fieldがundefinedでないことをassertする | 🟡 Medium |

## DO / DON'T

**DO:**
- バグを見つけた直後にテストを書く（可能なら修正前）
- 実装ではなくAPI response shapeをテストする
- すべてのbug-checkの最初のステップとしてテストを実行する
- テストを高速に保つ（sandbox modeで合計1秒未満）
- 防止するバグにちなんでテスト名を付ける（例: "BUG-R1 regression"）

**DON'T:**
- まだバグが出たことのないコードにテストを書く
- automated testsの代わりとしてAI self-reviewを信頼する
- 「ただのmock dataだから」とsandbox path testingを省略する
- unit testsで十分なときにintegration testsを書く
- coverage percentageを目標にする。regression preventionを目標にする
