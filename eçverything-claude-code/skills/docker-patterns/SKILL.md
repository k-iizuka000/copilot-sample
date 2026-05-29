---
name: docker-patterns
description: local development、container security、networking、volume strategies、multi-service orchestrationのためのDockerとDocker Composeパターン。
origin: ECC
---

# Dockerパターン

containerized development向けのDockerとDocker Composeベストプラクティス。

## いつ有効化するか

- local development向けにDocker Composeをセットアップするとき
- multi-container architecturesを設計するとき
- container networkingまたはvolume issuesをトラブルシュートするとき
- securityとsizeの観点でDockerfilesをレビューするとき
- local devからcontainerized workflowへ移行するとき

## Local Development用Docker Compose

### 標準Web App Stack

```yaml
# docker-compose.yml
services:
  app:
    build:
      context: .
      target: dev                     # multi-stage Dockerfileのdev stageを使う
    ports:
      - "3000:3000"
    volumes:
      - .:/app                        # hot reload用のbind mount
      - /app/node_modules             # anonymous volume -- container depsを保持する
    environment:
      - DATABASE_URL=postgres://postgres:postgres@db:5432/app_dev
      - REDIS_URL=redis://redis:6379/0
      - NODE_ENV=development
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    command: npm run dev

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app_dev
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data

  mailpit:                            # local email testing
    image: axllent/mailpit
    ports:
      - "8025:8025"                   # Web UI
      - "1025:1025"                   # SMTP

volumes:
  pgdata:
  redisdata:
```

### DevelopmentとProductionのDockerfile

```dockerfile
# Stage: dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage: dev（hot reload、debug tools）
FROM node:22-alpine AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Stage: build
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && npm prune --production

# Stage: production（minimal image）
FROM node:22-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001
USER appuser
COPY --from=build --chown=appuser:appgroup /app/dist ./dist
COPY --from=build --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/package.json ./
ENV NODE_ENV=production
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/server.js"]
```

### Override Files

```yaml
# docker-compose.override.yml（auto-loaded、dev-only settings）
services:
  app:
    environment:
      - DEBUG=app:*
      - LOG_LEVEL=debug
    ports:
      - "9229:9229"                   # Node.js debugger

# docker-compose.prod.yml（production用に明示）
services:
  app:
    build:
      target: production
    restart: always
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
```

```bash
# Development（overrideを自動load）
docker compose up

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Networking

### Service Discovery

同じCompose network内のservicesはservice nameで解決されます:
```
# "app" containerから:
postgres://postgres:postgres@db:5432/app_dev    # "db"はdb containerに解決される
redis://redis:6379/0                             # "redis"はredis containerに解決される
```

### Custom Networks

```yaml
services:
  frontend:
    networks:
      - frontend-net

  api:
    networks:
      - frontend-net
      - backend-net

  db:
    networks:
      - backend-net              # apiからのみ到達可能、frontendからは不可

networks:
  frontend-net:
  backend-net:
```

### 必要なものだけを公開する

```yaml
services:
  db:
    ports:
      - "127.0.0.1:5432:5432"   # hostからのみaccess可能、networkからは不可
    # productionではportsを完全に省略する -- Docker network内からのみaccess可能
```

## Volume Strategies

```yaml
volumes:
  # Named volume: container restartをまたいで永続化し、Dockerが管理する
  pgdata:

  # Bind mount: host directoryをcontainerへmapする（development用）
  # - ./src:/app/src

  # Anonymous volume: bind mount overrideからcontainer-generated contentを保持する
  # - /app/node_modules
```

### よくあるパターン

```yaml
services:
  app:
    volumes:
      - .:/app                   # source code（hot reload用のbind mount）
      - /app/node_modules        # containerのnode_modulesをhostから保護する
      - /app/.next               # build cacheを保護する

  db:
    volumes:
      - pgdata:/var/lib/postgresql/data          # persistent data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql  # init scripts
```

## Container Security

### Dockerfile Hardening

```dockerfile
# 1. specific tagsを使う（:latestは使わない）
FROM node:22.12-alpine3.20

# 2. non-rootとして実行する
RUN addgroup -g 1001 -S app && adduser -S app -u 1001
USER app

# 3. capabilitiesをdropする（composeで）
# 4. 可能な場合はread-only root filesystemにする
# 5. image layersにsecretsを置かない
```

### Compose Security

```yaml
services:
  app:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
      - /app/.cache
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE          # 1024未満のportsへbindする場合のみ
```

### Secret Management

```yaml
# 良い例: environment variablesを使う（runtimeでinjected）
services:
  app:
    env_file:
      - .env                     # .envは絶対にgitへcommitしない
    environment:
      - API_KEY                  # host environmentから継承する

# 良い例: Docker secrets（Swarm mode）
secrets:
  db_password:
    file: ./secrets/db_password.txt

services:
  db:
    secrets:
      - db_password

# 悪い例: imageにhardcodeする
# ENV API_KEY=sk-proj-xxxxx      # 絶対にしない
```

## .dockerignore

```
node_modules
.git
.env
.env.*
dist
coverage
*.log
.next
.cache
docker-compose*.yml
Dockerfile*
README.md
tests/
```

## Debugging

### よくあるコマンド

```bash
# logsを見る
docker compose logs -f app           # app logsをfollowする
docker compose logs --tail=50 db     # dbの最後の50行

# 実行中containerでcommandsを実行する
docker compose exec app sh           # appへshellで入る
docker compose exec db psql -U postgres  # postgresへconnectする

# Inspect
docker compose ps                     # running services
docker compose top                    # 各container内のprocesses
docker stats                          # resource usage

# Rebuild
docker compose up --build             # imagesをrebuildする
docker compose build --no-cache app   # full rebuildを強制する

# clean up
docker compose down                   # containersを停止して削除する
docker compose down -v                # volumesも削除する（破壊的）
docker system prune                   # 未使用のimages/containersを削除する
```

### Network Issuesのデバッグ

```bash
# container内のDNS resolutionを確認する
docker compose exec app nslookup db

# connectivityを確認する
docker compose exec app wget -qO- http://api:3000/health

# networkをinspectする
docker network ls
docker network inspect <project>_default
```

## アンチパターン

```
# 悪い例: orchestrationなしでproductionにdocker composeを使う
# productionのmulti-container workloadsにはKubernetes、ECS、またはDocker Swarmを使う

# 悪い例: volumesなしでcontainersにdataを保存する
# containersはephemeral -- volumesがないとrestart時にすべてのdataが失われる

# 悪い例: rootとして実行する
# 常にnon-root userを作成して使用する

# 悪い例: :latest tagを使う
# reproducible buildsのためspecific versionsへpinする

# 悪い例: すべてのservicesを1つの巨大なcontainerに入れる
# concernsを分離する: 1 containerにつき1 process

# 悪い例: secretsをdocker-compose.ymlに置く
# .env files（gitignored）またはDocker secretsを使う
```
