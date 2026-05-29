---
name: deployment-patterns
description: Web applications向けのデプロイワークフロー、CI/CD pipeline patterns、Docker containerization、health checks、rollback strategies、production readiness checklists。
origin: ECC
---

# デプロイメントパターン

Production deployment workflowsとCI/CDのベストプラクティス。

## いつ有効化するか

- CI/CD pipelinesをセットアップするとき
- applicationをDocker化するとき
- deployment strategy（blue-green、canary、rolling）を計画するとき
- health checksとreadiness probesを実装するとき
- production releaseの準備をするとき
- environment-specific settingsを設定するとき

## デプロイメント戦略

### Rolling Deployment（デフォルト）

instancesを段階的に置き換えます。rollout中は旧versionと新versionが同時に実行されます。

```
Instance 1: v1 → v2  (最初にupdate)
Instance 2: v1        (まだv1を実行中)
Instance 3: v1        (まだv1を実行中)

Instance 1: v2
Instance 2: v1 → v2  (次にupdate)
Instance 3: v1

Instance 1: v2
Instance 2: v2
Instance 3: v1 → v2  (最後にupdate)
```

**長所:** Zero downtime、段階的なrollout
**短所:** 2つのversionsが同時に実行されるため、backward-compatible changesが必要
**使用する場面:** 標準deployments、backward-compatible changes

### Blue-Green Deployment

2つの同一environmentsを実行し、trafficをatomicに切り替えます。

```
Blue  (v1) ← traffic
Green (v2)   idle、新versionを実行中

# verification後:
Blue  (v1)   idle（standbyになる）
Green (v2) ← traffic
```

**長所:** Instant rollback（blueへ戻す）、clean cutover
**短所:** deployment中に2倍のinfrastructureが必要
**使用する場面:** Critical services、問題を許容できない場合

### Canary Deployment

まずtrafficの小さな割合を新versionへrouteします。

```
v1: trafficの95%
v2: trafficの 5%  (canary)

# metricsが良好なら:
v1: trafficの50%
v2: trafficの50%

# 最終状態:
v2: trafficの100%
```

**長所:** full rollout前にreal trafficで問題を捕捉できる
**短所:** traffic splitting infrastructureとmonitoringが必要
**使用する場面:** High-traffic services、リスクの高いchanges、feature flags

## Docker

### Multi-Stage Dockerfile (Node.js)

```dockerfile
# Stage 1: dependenciesをinstallする
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production=false

# Stage 2: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --production

# Stage 3: Production image
FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001
USER appuser

COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/package.json ./

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
```

### Multi-Stage Dockerfile (Go)

```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /server ./cmd/server

FROM alpine:3.19 AS runner
RUN apk --no-cache add ca-certificates
RUN adduser -D -u 1001 appuser
USER appuser

COPY --from=builder /server /server

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:8080/health || exit 1
CMD ["/server"]
```

### Multi-Stage Dockerfile (Python/Django)

```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
RUN pip install --no-cache-dir uv
COPY requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

FROM python:3.12-slim AS runner
WORKDIR /app

RUN useradd -r -u 1001 appuser
USER appuser

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health/')" || exit 1
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]
```

### Dockerベストプラクティス

```
# 良いpractice
- specific version tagsを使う（node:22-alpine、node:latestではない）
- Multi-stage buildsでimage sizeを最小化する
- non-root userとして実行する
- dependency filesを先にcopyする（layer caching）
- .dockerignoreでnode_modules、.git、testsを除外する
- HEALTHCHECK instructionを追加する
- docker-composeまたはk8sでresource limitsを設定する

# 悪いpractice
- rootとして実行する
- :latest tagsを使う
- repo全体を1つのCOPY layerでcopyする
- production imageにdev dependenciesをinstallする
- secretsをimageに保存する（env varsまたはsecrets managerを使う）
```

## CI/CD Pipeline

### GitHub Actions（標準Pipeline）

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --coverage
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: coverage/

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Deploy to production
        run: |
          # platform固有のdeployment command
          # Railway: railway up
          # Vercel: vercel --prod
          # K8s: kubectl set image deployment/app app=ghcr.io/${{ github.repository }}:${{ github.sha }}
          echo "Deploying ${{ github.sha }}"
```

### Pipeline Stages

```
PRが開かれた:
  lint → typecheck → unit tests → integration tests → preview deploy

mainへmergeされた:
  lint → typecheck → unit tests → integration tests → build image → deploy staging → smoke tests → deploy production
```

## Health Checks

### Health Check Endpoint

```typescript
// シンプルなhealth check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// 詳細なhealth check（internal monitoring用）
app.get("/health/detailed", async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    externalApi: await checkExternalApi(),
  };

  const allHealthy = Object.values(checks).every(c => c.status === "ok");

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || "unknown",
    uptime: process.uptime(),
    checks,
  });
});

async function checkDatabase(): Promise<HealthCheck> {
  try {
    await db.query("SELECT 1");
    return { status: "ok", latency_ms: 2 };
  } catch (err) {
    return { status: "error", message: "Database unreachable" };
  }
}
```

### Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 30
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 2

startupProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 0
  periodSeconds: 5
  failureThreshold: 30    # 30 * 5s = 150s max startup time
```

## Environment Configuration

### Twelve-Factor App Pattern

```bash
# すべてのconfigはenvironment variables経由にする — codeには絶対に置かない
DATABASE_URL=postgres://user:pass@host:5432/db
REDIS_URL=redis://host:6379/0
API_KEY=${API_KEY}           # secrets managerからinjected
LOG_LEVEL=info
PORT=3000

# environment-specific behavior
NODE_ENV=production          # またはstaging、development
APP_ENV=production           # 明示的なapp environment
```

### Configuration Validation

```typescript
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

// startup時にvalidateする — configが間違っていればfail fastする
export const env = envSchema.parse(process.env);
```

## Rollback Strategy

### Instant Rollback

```bash
# Docker/Kubernetes: previous imageを指す
kubectl rollout undo deployment/app

# Vercel: previous deploymentをpromoteする
vercel rollback

# Railway: previous commitをredeployする
railway up --commit <previous-sha>

# Database: migrationをrollbackする（reversibleな場合）
npx prisma migrate resolve --rolled-back <migration-name>
```

### Rollbackチェックリスト

- [ ] Previous image/artifactが利用可能でtaggedされている
- [ ] Database migrationsがbackward-compatibleである（destructive changesなし）
- [ ] Feature flagsでdeployなしに新機能を無効化できる
- [ ] error rate spikesに対するmonitoring alertsが設定されている
- [ ] production release前にstagingでrollbackをテスト済み

## Production Readinessチェックリスト

production deploymentの前に:

### Application
- [ ] すべてのtestsがpassしている（unit、integration、E2E）
- [ ] codeまたはconfig filesにhardcoded secretsがない
- [ ] Error handlingがすべてのedge casesをカバーしている
- [ ] Loggingがstructured（JSON）でPIIを含まない
- [ ] Health check endpointが意味のあるstatusを返す

### Infrastructure
- [ ] Docker imageが再現可能にbuildされる（pinned versions）
- [ ] Environment variablesが文書化され、startup時にvalidatedされる
- [ ] Resource limitsが設定されている（CPU、memory）
- [ ] Horizontal scalingが設定されている（min/max instances）
- [ ] すべてのendpointsでSSL/TLSが有効

### Monitoring
- [ ] Application metricsがexportされている（request rate、latency、errors）
- [ ] error rate > thresholdに対するalertsが設定されている
- [ ] Log aggregationがセットアップされている（structured logs、searchable）
- [ ] health endpointでUptime monitoringがある

### Security
- [ ] DependenciesがCVEsについてscanされている
- [ ] CORSがallowed originsのみに設定されている
- [ ] public endpointsでRate limitingが有効
- [ ] Authenticationとauthorizationがverifiedされている
- [ ] Security headersが設定されている（CSP、HSTS、X-Frame-Options）

### Operations
- [ ] Rollback planが文書化され、テスト済み
- [ ] Database migrationがproduction-sized dataに対してテスト済み
- [ ] common failure scenarios用のrunbookがある
- [ ] On-call rotationとescalation pathが定義されている
