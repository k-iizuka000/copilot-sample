---
name: deployment-patterns
description: CI/CD、deployment strategy、health check、rollback、production readinessを設計またはレビューするときに使う。
---

# Deployment Patterns

deployment は「ビルドを通す」だけではなく、互換性、観測、rollback、失敗時の停止条件まで含めて設計します。

## 使うタイミング

- CI/CD pipeline を作る
- production release 前の readiness を確認する
- blue-green、canary、rolling deploy を選ぶ
- health check や readiness probe を追加する
- rollback 手順を作る

## Strategy選択

- Rolling: 標準。旧 version と新 version が同時に動くため backward compatibility が必須。
- Blue-green: traffic を一括で切り替える。即時 rollback が必要な重要サービス向け。
- Canary: 一部 traffic で観測してから広げる。高リスク変更や高 traffic サービス向け。

## Readiness checklist

- [ ] build artifact が再現可能
- [ ] migration と app deploy の順序が安全
- [ ] health endpoint が依存先を適切に反映
- [ ] startup / readiness / liveness の違いが整理されている
- [ ] rollback 手順が手順書化されている
- [ ] log、metrics、alert がリリース後確認に使える
- [ ] secret / environment variable が本番で設定済み

## CI/CD gate

- compile / build
- unit test
- integration test
- static analysis
- dependency scan
- container scan
- migration dry-run または staging apply
- smoke test

## Health endpoint

- `GET /health/live`: process が生きているか
- `GET /health/ready`: request を受けてよいか
- `GET /health/startup`: 初期化が完了したか

DB や外部 API を readiness に含める場合、timeout と degraded mode を設計します。

## Release report

```text
Release:
- version:
- strategy:
- migrations:
- verification:
- rollback:
- monitoring:
- unresolved risk:
```
