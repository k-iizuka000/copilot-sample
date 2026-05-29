# Copilot skill set

このディレクトリは、Java / Spring Boot を中心にした AI-driven development と agent harness 構築に使う、GitHub Copilot 向けの curated skill set です。

## 収録方針

- `SKILL.md` はオンデマンドで読む手順に限定する
- 常時適用したい規約や品質ゲートは skill ではなく instructions 側へ置く
- Java / Spring Boot / PostgreSQL / API / Docker / deployment / verification に直結するものを優先する
- 旧環境固有のインストールパス、hook lifecycle、専用 tool 名、model 名、subagent 実行前提は持ち込まない

## Included

- `ai-first-engineering`: AI が実装量を増やすチームの運用、レビュー、品質設計
- `agentic-engineering`: agentic な作業分解、eval-first、検証単位の設計
- `agent-harness-construction`: agent tool / observation / recovery contract の設計
- `ai-regression-testing`: AI 生成変更に多い regression をテストで固定する手順
- `api-design`: REST API contract、status code、pagination、error response
- `database-migrations`: production database migration と expand-contract pattern
- `deployment-patterns`: CI/CD、health check、rollback、release readiness
- `docker-patterns`: Dockerfile / Compose / container security の実務パターン
- `e2e-testing`: Playwright を中心にした E2E 設計と flaky 対策
- `java-coding-standards`: Java 17+ / Spring Boot の読みやすさ、型安全性、例外、logging
- `jpa-patterns`: JPA / Hibernate の entity、query、transaction、N+1 対策
- `postgres-patterns`: PostgreSQL schema、index、query、RLS、運用設定
- `security-review`: 認証、認可、入力検証、secret、dependency、infra security の review
- `springboot-patterns`: Spring Boot の controller / service / repository / config pattern
- `springboot-security`: Spring Security、CSRF、headers、rate limit、PII logging
- `springboot-tdd`: JUnit 5、Mockito、MockMvc、Testcontainers の TDD
- `springboot-verification`: Spring Boot PR / release 前の build、test、security scan
- `tdd-workflow`: 技術非依存の TDD loop と coverage discipline
- `verification-loop`: 変更後の一般的な build、lint、test、security、diff review

## Omitted

以下は legacy source material には残しますが、この Copilot pack には含めません。

- `skill-stocktake`: 旧環境の skill 棚卸しと script 実行前提が強く、Copilot の reusable skill としては重い
- `team-builder`: 専用 subagent 編成の前提が強く、Copilot skill より instructions / project process に置く内容
- `eval-harness`: 価値はあるが、大きな harness 実装前提が強いため、今回は `ai-regression-testing` と `agent-harness-construction` に実務要素を吸収
- `prompt-optimizer`: model / prompt 実験の運用色が強く、Java / Spring Boot starter pack の優先度から外す
- `iterative-retrieval`: retrieval loop の専用運用であり、今回の portable development skill set からは外す
- `project-guidelines-example`: example project 固有の常時規約に近く、skill ではなく instructions 化が適切
