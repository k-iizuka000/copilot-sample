---
name: api-design
description: REST APIのresource設計、HTTP status、pagination、filtering、error response、versioningを設計またはレビューするときに使う。
---

# API Design

API は実装都合ではなく、resource、contract、error semantics を中心に設計します。

## 使うタイミング

- 新しい endpoint を設計する
- 既存 API の contract を変更する
- pagination、filtering、sorting を追加する
- error handling や versioning を見直す

## Resource設計

- URL は名詞、plural、lowercase、kebab-case にする。
- action は最小限にし、CRUD で表せない操作だけ使う。
- relationship は sub-resource として表す。

```text
GET    /api/v1/users
GET    /api/v1/users/{id}
POST   /api/v1/users
PATCH  /api/v1/users/{id}
DELETE /api/v1/users/{id}
GET    /api/v1/users/{id}/orders
POST   /api/v1/orders/{id}/cancel
```

## HTTP status

- `200 OK`: 通常の成功
- `201 Created`: 作成成功。可能なら `Location` header を返す
- `204 No Content`: body なしの成功
- `400 Bad Request`: malformed request
- `401 Unauthorized`: 未認証
- `403 Forbidden`: 認証済みだが権限なし
- `404 Not Found`: resource なし
- `409 Conflict`: 状態競合や重複
- `422 Unprocessable Entity`: 形式は正しいが業務的に不正
- `429 Too Many Requests`: rate limit
- `500`: 想定外。内部詳細は返さない

## Response形式

```json
{
  "data": {
    "id": "abc-123",
    "name": "Alice"
  }
}
```

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed",
    "details": [
      { "field": "email", "message": "must be a valid email" }
    ]
  }
}
```

## Pagination

- 小規模一覧は page / size でもよい。
- 大量データや更新頻度が高い一覧は cursor pagination を優先する。
- response に `meta` と `links` を含める。

## Review checklist

- [ ] endpoint 名が resource として自然
- [ ] method と status が semantics に合っている
- [ ] validation error が field 単位で返る
- [ ] permission failure が 401 / 403 に分かれている
- [ ] pagination と sorting が安定順序を持つ
- [ ] versioning / backward compatibility が説明されている
