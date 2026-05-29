---
name: springboot-security
description: Spring Boot / Spring Securityで認証、認可、CSRF、headers、rate limit、secret、dependency securityを扱うときに使う。
---

# Spring Boot Security

Spring Security は deny by default、最小権限、明示的な boundary validation を基本にします。

## 使うタイミング

- login、JWT、session、OAuth2 を実装する
- endpoint authorization を追加する
- CSRF / CORS / security headers を設定する
- file upload や admin API を作る
- dependency CVE や secret handling を確認する

## Authentication

- JWT は issuer、audience、expiry、signature を検証する。
- session cookie は `HttpOnly`、`Secure`、`SameSite` を設定する。
- browser session か pure API かで CSRF 方針を分ける。
- token を log に出さない。

## Authorization

- `@EnableMethodSecurity` を有効にする。
- `@PreAuthorize` で method-level guard を置く。
- role だけでなく object-level authorization を確認する。
- default permit を避け、必要な path だけ許可する。

## Input / output

- controller DTO に Bean Validation を付ける。
- HTML を扱う場合は sanitize する。
- error response に stack trace や内部 ID を出さない。

## Headers / CORS / CSRF

- CORS origin は allowlist にする。
- browser cookie session では CSRF を有効にする。
- Bearer token only API では stateless 設計と合わせて CSRF 無効化を検討する。
- CSP、frame options、referrer policy を設定する。

## Dependency / operation

- OWASP Dependency Check などを CI で実行する。
- Spring Boot / Spring Security をサポート中の version に保つ。
- auth failure と admin action を監査 log に残す。
- high-cost endpoint に rate limit を付ける。

## Pre-release checklist

- [ ] sensitive path が認証必須
- [ ] object-level authorization がある
- [ ] CSRF / CORS が app type に合う
- [ ] SQL injection 対策がある
- [ ] secret が外部化されている
- [ ] dependency scan を実行した
