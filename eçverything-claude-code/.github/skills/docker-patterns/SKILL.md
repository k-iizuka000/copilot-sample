---
name: docker-patterns
description: Dockerfile、Docker Compose、container security、networking、volume、multi-service local developmentを設計またはレビューするときに使う。
---

# Docker Patterns

Docker は local development と production parity を上げる一方で、image size、権限、secret、volume、networking の事故を起こしやすい領域です。

## 使うタイミング

- Dockerfile / Compose を追加または修正する
- local dev stack を構築する
- container の build size や起動速度を改善する
- container security をレビューする
- service 間 network / volume 問題を調査する

## Dockerfile原則

- multi-stage build を使う。
- dependency install と source copy の順序を cache-friendly にする。
- production image は runtime に必要なものだけ含める。
- root user で実行しない。
- healthcheck を持たせる。
- secret を image layer に焼き込まない。

## Compose原則

- service name で service discovery する。
- DB / Redis は healthcheck を定義する。
- app は `depends_on.condition` を使って起動順を明示する。
- source bind mount と dependency volume を分ける。
- production と local override を混ぜない。

## Security checklist

- [ ] `USER` が root 以外
- [ ] `.dockerignore` に `.git`、build output、secret file がある
- [ ] image に `.env` や private key が含まれない
- [ ] base image がサポート中
- [ ] package manager cache を残さない
- [ ] container scan を CI で実行する

## Troubleshooting

- `docker compose ps` で state と health を見る。
- `docker compose logs <service>` で startup failure を確認する。
- container 内の env、DNS、port binding、volume mount を順に確認する。
- DB 接続文字列は host ではなく compose service 名を使う。

## Java / Spring Boot注意点

- layered jar または buildpack を検討する。
- JVM memory は container limit を前提に設定する。
- readiness endpoint と graceful shutdown を有効にする。
