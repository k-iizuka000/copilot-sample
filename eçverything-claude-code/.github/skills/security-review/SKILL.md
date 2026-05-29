---
name: security-review
description: 認証、認可、入力検証、secret、API、依存関係、cloud/CI設定を追加または変更するときにセキュリティ観点でレビューする。
---

# Security Review

security review は最後の儀式ではなく、設計、実装、検証の各段階で行います。

## 使うタイミング

- 認証 / 認可を変更する
- user input、file upload、external callback を扱う
- API endpoint を追加する
- secret、token、credential を扱う
- payment、個人情報、管理者機能を実装する
- CI/CD、cloud IAM、network、logging を変更する

## Checklist

### Secret

- [ ] source code、test fixture、log に secret がない
- [ ] environment variable または secret manager から読む
- [ ] `.env` 系ファイルが commit されない
- [ ] rotation と失効手順がある

### Input validation

- [ ] boundary で schema / Bean Validation を使う
- [ ] file は size、content type、extension、保存先を制限する
- [ ] error message が内部情報を漏らさない
- [ ] allowlist を優先する

### Authn / Authz

- [ ] 未認証と権限不足を分ける
- [ ] sensitive endpoint は deny by default
- [ ] object-level authorization を確認する
- [ ] token expiry、revocation、audience / issuer を検証する

### Injection

- [ ] SQL 文字列連結がない
- [ ] ORM / query builder の parameter binding を使う
- [ ] command injection、path traversal、template injection を確認する

### Web security

- [ ] CSRF 方針が app type に合っている
- [ ] cookie は `HttpOnly`、`Secure`、`SameSite` を設定する
- [ ] security headers を設定する
- [ ] CORS は必要な origin だけ許可する

### Dependency / supply chain

- [ ] dependency scan を実行する
- [ ] lockfile を使う
- [ ] CI token permissions は最小権限
- [ ] artifact の出所と署名を確認する

### Cloud / infra

- [ ] IAM は最小権限
- [ ] database は public access 不可
- [ ] admin action と auth failure を監査 log に残す
- [ ] backup と restore が検証されている

## 報告形式

```text
Security review:
- critical:
- high:
- medium:
- low:
- verified checks:
- not verified:
```
