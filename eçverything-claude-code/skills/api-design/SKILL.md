---
name: api-design
description: production APIs向けのresource naming、status codes、pagination、filtering、error responses、versioning、rate limitingを含むREST API設計パターン。
origin: ECC
---

# API設計パターン

一貫性があり、開発者に優しいREST APIsを設計するための規約とベストプラクティス。

## いつ有効化するか

- 新しいAPI endpointsを設計するとき
- 既存のAPI contractsをレビューするとき
- pagination、filtering、sortingを追加するとき
- APIsのerror handlingを実装するとき
- API versioning strategyを計画するとき
- publicまたはpartner-facing APIsを構築するとき

## リソース設計

### URL構造

```
# resourcesは名詞、plural、lowercase、kebab-caseにする
GET    /api/v1/users
GET    /api/v1/users/:id
POST   /api/v1/users
PUT    /api/v1/users/:id
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id

# relationships用のsub-resources
GET    /api/v1/users/:id/orders
POST   /api/v1/users/:id/orders

# CRUDに対応しないactions（verbsは控えめに使う）
POST   /api/v1/orders/:id/cancel
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
```

### 命名ルール

```
# 良い例
/api/v1/team-members          # multi-word resourcesにはkebab-case
/api/v1/orders?status=active  # filteringにはquery params
/api/v1/users/123/orders      # ownershipにはnested resources

# 悪い例
/api/v1/getUsers              # URLにverbがある
/api/v1/user                  # singular（pluralを使う）
/api/v1/team_members          # URLにsnake_caseがある
/api/v1/users/123/getOrders   # nested resourceにverbがある
```

## HTTP MethodsとStatus Codes

### Method Semantics

| Method | 冪等 | Safe | 用途 |
|--------|-----------|------|---------|
| GET | はい | はい | resourcesの取得 |
| POST | いいえ | いいえ | resourcesの作成、actionsのトリガー |
| PUT | はい | いいえ | resourceの完全置換 |
| PATCH | いいえ* | いいえ | resourceの部分更新 |
| DELETE | はい | いいえ | resourceの削除 |

*PATCHは適切な実装によりidempotentにできます

### Status Codeリファレンス

```
# Success
200 OK                    — GET、PUT、PATCH（response bodyあり）
201 Created               — POST（Location headerを含める）
204 No Content            — DELETE、PUT（response bodyなし）

# Client Errors
400 Bad Request           — validation failure、malformed JSON
401 Unauthorized          — authenticationがmissingまたはinvalid
403 Forbidden             — authenticatedだがauthorizedではない
404 Not Found             — resourceが存在しない
409 Conflict              — duplicate entry、state conflict
422 Unprocessable Entity  — semantically invalid（valid JSONだがbad data）
429 Too Many Requests     — rate limit exceeded

# Server Errors
500 Internal Server Error — unexpected failure（detailsは絶対に露出しない）
502 Bad Gateway           — upstream service failed
503 Service Unavailable   — temporary overload、Retry-Afterを含める
```

### よくあるミス

```
# 悪い例: すべてに200を返す
{ "status": 200, "success": false, "error": "Not found" }

# 良い例: HTTP status codesを意味に沿って使う
HTTP/1.1 404 Not Found
{ "error": { "code": "not_found", "message": "User not found" } }

# 悪い例: validation errorsに500を返す
# 良い例: field-level details付きで400または422を返す

# 悪い例: created resourcesに200を返す
# 良い例: Location header付きで201を返す
HTTP/1.1 201 Created
Location: /api/v1/users/abc-123
```

## Response Format

### Success Response

```json
{
  "data": {
    "id": "abc-123",
    "email": "alice@example.com",
    "name": "Alice",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

### Collection Response（Pagination付き）

```json
{
  "data": [
    { "id": "abc-123", "name": "Alice" },
    { "id": "def-456", "name": "Bob" }
  ],
  "meta": {
    "total": 142,
    "page": 1,
    "per_page": 20,
    "total_pages": 8
  },
  "links": {
    "self": "/api/v1/users?page=1&per_page=20",
    "next": "/api/v1/users?page=2&per_page=20",
    "last": "/api/v1/users?page=8&per_page=20"
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address",
        "code": "invalid_format"
      },
      {
        "field": "age",
        "message": "Must be between 0 and 150",
        "code": "out_of_range"
      }
    ]
  }
}
```

### Response Envelopeのバリエーション

```typescript
// Option A: data wrapper付きEnvelope（public APIsに推奨）
interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  links?: PaginationLinks;
}

interface ApiError {
  error: {
    code: string;
    message: string;
    details?: FieldError[];
  };
}

// Option B: Flat response（よりsimple、internal APIsで一般的）
// Success: resourceを直接返す
// Error: error objectを返す
// HTTP status codeで区別する
```

## Pagination

### Offset-Based（シンプル）

```
GET /api/v1/users?page=2&per_page=20

# 実装
SELECT * FROM users
ORDER BY created_at DESC
LIMIT 20 OFFSET 20;
```

**Pros:** 実装が簡単で、「page Nへジャンプ」をサポートする
**Cons:** 大きなoffset（OFFSET 100000）では遅く、concurrent insertsと一貫しない

### Cursor-Based（スケーラブル）

```
GET /api/v1/users?cursor=eyJpZCI6MTIzfQ&limit=20

# 実装
SELECT * FROM users
WHERE id > :cursor_id
ORDER BY id ASC
LIMIT 21;  -- has_nextを判定するため1件多くfetchする
```

```json
{
  "data": [...],
  "meta": {
    "has_next": true,
    "next_cursor": "eyJpZCI6MTQzfQ"
  }
}
```

**Pros:** 位置に関係なく一貫したパフォーマンスで、concurrent insertsに対して安定
**Cons:** 任意のページへジャンプできず、cursorは不透明

### どちらをいつ使うか

| 用途 | Pagination Type |
|----------|----------------|
| Admin dashboards、小さなdatasets（<10K） | Offset |
| Infinite scroll、feeds、大きなdatasets | Cursor |
| Public APIs | Cursor（default）with offset（optional） |
| Search results | Offset（ユーザーはページ番号を期待する） |

## Filtering、Sorting、Search

### Filtering

```
# simple equality
GET /api/v1/orders?status=active&customer_id=abc-123

# comparison operators（bracket notationを使う）
GET /api/v1/products?price[gte]=10&price[lte]=100
GET /api/v1/orders?created_at[after]=2025-01-01

# multiple values（comma-separated）
GET /api/v1/products?category=electronics,clothing

# nested fields（dot notation）
GET /api/v1/orders?customer.country=US
```

### Sorting

```
# single field（descendingにはprefix -）
GET /api/v1/products?sort=-created_at

# multiple fields（comma-separated）
GET /api/v1/products?sort=-featured,price,-created_at
```

### Full-Text Search

```
# search query parameter
GET /api/v1/products?q=wireless+headphones

# field-specific search
GET /api/v1/users?email=alice
```

### Sparse Fieldsets

```
# 指定されたfieldsのみ返す（payloadを削減する）
GET /api/v1/users?fields=id,name,email
GET /api/v1/orders?fields=id,total,status&include=customer.name
```

## 認証と認可

### Token-Based Auth

```
# Authorization headerのBearer token
GET /api/v1/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

# API key（server-to-server用）
GET /api/v1/data
X-API-Key: sk_live_abc123
```

### Authorization Patterns

```typescript
// Resource-level: ownershipをcheckする
app.get("/api/v1/orders/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: { code: "not_found" } });
  if (order.userId !== req.user.id) return res.status(403).json({ error: { code: "forbidden" } });
  return res.json({ data: order });
});

// Role-based: permissionsをcheckする
app.delete("/api/v1/users/:id", requireRole("admin"), async (req, res) => {
  await User.delete(req.params.id);
  return res.status(204).send();
});
```

## Rate Limiting

### Headers

```
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000

# 超過した場合
HTTP/1.1 429 Too Many Requests
Retry-After: 60
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Rate limit exceeded. Try again in 60 seconds."
  }
}
```

### Rate Limit Tiers

| Tier | Limit | Window | 用途 |
|------|-------|--------|----------|
| Anonymous | 30/min | Per IP | Public endpoints |
| Authenticated | 100/min | Per user | 標準API access |
| Premium | 1000/min | Per API key | 有料API plans |
| Internal | 10000/min | Per service | Service-to-service |

## Versioning

### URL Path Versioning（推奨）

```
/api/v1/users
/api/v2/users
```

**Pros:** 明示的で、routeしやすく、cacheable
**Cons:** versions間でURLが変わる

### Header Versioning

```
GET /api/users
Accept: application/vnd.myapp.v2+json
```

**Pros:** Clean URLs
**Cons:** テストしにくく、忘れやすい

### Versioning Strategy

```
1. /api/v1/ から始める — 必要になるまでversioningしない
2. active versionsは最大2つ（current + previous）に保つ
3. Deprecation timeline:
   - deprecationをannounceする（public APIsでは6か月前notice）
   - Sunset headerを追加する: Sunset: Sat, 01 Jan 2026 00:00:00 GMT
   - sunset date後は410 Goneを返す
4. Non-breaking changesには新versionは不要:
   - responsesへnew fieldsを追加する
   - new optional query parametersを追加する
   - new endpointsを追加する
5. Breaking changesには新versionが必要:
   - fieldsを削除またはrenameする
   - field typesを変更する
   - URL structureを変更する
   - authentication methodを変更する
```

## 実装パターン

### TypeScript (Next.js API Route)

```typescript
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({
      error: {
        code: "validation_error",
        message: "Request validation failed",
        details: parsed.error.issues.map(i => ({
          field: i.path.join("."),
          message: i.message,
          code: i.code,
        })),
      },
    }, { status: 422 });
  }

  const user = await createUser(parsed.data);

  return NextResponse.json(
    { data: user },
    {
      status: 201,
      headers: { Location: `/api/v1/users/${user.id}` },
    },
  );
}
```

### Python（Django REST Framework）

```python
from rest_framework import serializers, viewsets, status
from rest_framework.response import Response

class CreateUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField(max_length=100)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "name", "created_at"]

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return CreateUserSerializer
        return UserSerializer

    def create(self, request):
        serializer = CreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = UserService.create(**serializer.validated_data)
        return Response(
            {"data": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
            headers={"Location": f"/api/v1/users/{user.id}"},
        )
```

### Go (net/http)

```go
func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
    var req CreateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeError(w, http.StatusBadRequest, "invalid_json", "Invalid request body")
        return
    }

    if err := req.Validate(); err != nil {
        writeError(w, http.StatusUnprocessableEntity, "validation_error", err.Error())
        return
    }

    user, err := h.service.Create(r.Context(), req)
    if err != nil {
        switch {
        case errors.Is(err, domain.ErrEmailTaken):
            writeError(w, http.StatusConflict, "email_taken", "Email already registered")
        default:
            writeError(w, http.StatusInternalServerError, "internal_error", "Internal error")
        }
        return
    }

    w.Header().Set("Location", fmt.Sprintf("/api/v1/users/%s", user.ID))
    writeJSON(w, http.StatusCreated, map[string]any{"data": user})
}
```

## API Designチェックリスト

新しいendpointを出荷する前に:

- [ ] Resource URLが命名規約に従っている（plural、kebab-case、verbsなし）
- [ ] 正しいHTTP methodを使用している（readsにはGET、createsにはPOSTなど）
- [ ] 適切なstatus codesを返している（すべてを200にしない）
- [ ] 入力がschemaで検証されている（Zod、Pydantic、Bean Validation）
- [ ] Error responsesがcodesとmessagesを含む標準formatに従っている
- [ ] list endpointsにpaginationが実装されている（cursorまたはoffset）
- [ ] Authenticationが必須になっている（またはpublicとして明示されている）
- [ ] Authorizationがチェックされている（ユーザーは自分のresourcesだけにアクセスできる）
- [ ] Rate limitingが設定されている
- [ ] Responseが内部詳細を漏らさない（stack traces、SQL errors）
- [ ] 既存endpointsと命名が一貫している（camelCase vs snake_case）
- [ ] 文書化されている（OpenAPI/Swagger spec updated）
