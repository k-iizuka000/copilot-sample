---
name: prompt-optimizer
description: >-
  生のプロンプトを分析し、意図と不足を特定し、ECCコンポーネント
  （skills/commands/agents/hooks）に対応付け、すぐ貼り付けて使える
  最適化済みプロンプトを出力する。助言役のみ — タスク自体は決して実行しない。
  起動条件: ユーザーが "optimize prompt"、"improve my prompt"、
  "how to write a prompt for"、"help me prompt"、"rewrite this prompt" と言う、
  またはプロンプト品質の向上を明示的に依頼する。中国語の同等表現
  "优化prompt"、"改进prompt"、"怎么写prompt"、"帮我优化这个指令" でも起動。
  起動しない条件: ユーザーがタスクの直接実行を望む場合、または
  "just do it" / "直接做" と言う場合。"优化代码"、
  "优化性能"、"optimize performance"、"optimize this code" の場合も起動しない —
  それらはリファクタリング/パフォーマンスタスクであり、プロンプト最適化ではない。
origin: community
metadata:
  author: YannJY02
  version: "1.0.0"
---

# プロンプト最適化

下書きプロンプトを分析・批評し、ECCエコシステムのコンポーネントに対応付け、ユーザーが貼り付けて実行できる完全な最適化済みプロンプトを出力します。

## 使用するタイミング

- ユーザーが "optimize this prompt"、"improve my prompt"、"rewrite this prompt" と言う
- ユーザーが "help me write a better prompt for..." と言う
- ユーザーが "what's the best way to ask Claude Code to..." と言う
- ユーザーが "优化prompt"、"改进prompt"、"怎么写prompt"、"帮我优化这个指令" と言う
- ユーザーが下書きプロンプトを貼り付け、フィードバックまたは改善を求める
- ユーザーが "I don't know how to prompt for this" と言う
- ユーザーが "how should I use ECC for..." と言う
- ユーザーが明示的に `/prompt-optimize` を呼び出す

### 使用しないタイミング

- ユーザーがタスクの直接実行を望んでいる（そのまま実行してほしい）
- ユーザーが "优化代码"、"优化性能"、"optimize this code"、"optimize performance" と言う — これらはリファクタリングタスクであり、プロンプト最適化ではない
- ユーザーがECC設定について質問している（代わりに `configure-ecc` を使用）
- ユーザーがskillインベントリを求めている（代わりに `skill-stocktake` を使用）
- ユーザーが "just do it" または "直接做" と言う

## 仕組み

**助言のみ — ユーザーのタスクを実行しない。**

コードを書いたり、ファイルを作成したり、コマンドを実行したり、実装アクションを取ったりしてはいけません。唯一の出力は、分析と最適化済みプロンプトです。

ユーザーが "just do it"、"直接做"、または "don't optimize, just execute" と言った場合、このスキル内で実装モードに切り替えてはいけません。このスキルは最適化済みプロンプトのみを生成すると伝え、実行を望む場合は通常のタスク依頼をするよう案内してください。

この6フェーズのパイプラインを順番に実行します。結果は下記の出力フォーマットで提示します。

### 分析パイプライン

### フェーズ0: プロジェクト検出

プロンプトを分析する前に、現在のプロジェクトコンテキストを検出します。

1. 作業ディレクトリに `CLAUDE.md` が存在するか確認 — プロジェクト規約を読む
2. プロジェクトファイルから技術スタックを検出:
   - `package.json` → Node.js / TypeScript / React / Next.js
   - `go.mod` → Go
   - `pyproject.toml` / `requirements.txt` → Python
   - `Cargo.toml` → Rust
   - `build.gradle` / `pom.xml` → Java / Kotlin / Spring Boot
   - `Package.swift` → Swift
   - `Gemfile` → Ruby
   - `composer.json` → PHP
   - `*.csproj` / `*.sln` → .NET
   - `Makefile` / `CMakeLists.txt` → C / C++
   - `cpanfile` / `Makefile.PL` → Perl
3. フェーズ3とフェーズ4で使うため、検出した技術スタックを記録

プロジェクトファイルが見つからない場合（例: プロンプトが抽象的、または新規プロジェクト向け）、検出をスキップし、フェーズ4で「技術スタック不明」と明示します。

### フェーズ1: 意図検出

ユーザーのタスクを1つ以上のカテゴリに分類します。

| カテゴリ | シグナル語 | 例 |
|----------|-------------|---------|
| 新機能 | build, create, add, implement, 创建, 实现, 添加 | "ログインページを作って" |
| バグ修正 | fix, broken, not working, error, 修复, 报错 | "認証フローを直して" |
| リファクタリング | refactor, clean up, restructure, 重构, 整理 | "APIレイヤーをリファクタリングして" |
| 調査 | how to, what is, explore, investigate, 怎么, 如何 | "SSOの追加方法を調べて" |
| テスト | test, coverage, verify, 测试, 覆盖率 | "カートのテストを追加して" |
| レビュー | review, audit, check, 审查, 检查 | "PRをレビューして" |
| ドキュメント | document, update docs, 文档 | "APIドキュメントを更新して" |
| インフラ | deploy, CI, docker, database, 部署, 数据库 | "CI/CDパイプラインを設定して" |
| 設計 | design, architecture, plan, 设计, 架构 | "データモデルを設計して" |

### フェーズ2: スコープ評価

フェーズ0でプロジェクトを検出した場合は、コードベースの規模をシグナルとして使用します。それ以外の場合は、プロンプトの説明だけから推定し、その推定が不確実であることを明示します。

| スコープ | ヒューリスティック | オーケストレーション |
|-------|-----------|---------------|
| TRIVIAL | 単一ファイル、50行未満 | 直接実行 |
| LOW | 単一コンポーネントまたはモジュール | 単一commandまたはskill |
| MEDIUM | 複数コンポーネント、同一ドメイン | commandチェーン + /verify |
| HIGH | ドメイン横断、5ファイル以上 | 最初に /plan、その後フェーズ分割実行 |
| EPIC | 複数セッション、複数PR、アーキテクチャ変更 | 複数セッション計画にblueprint skillを使用 |

### フェーズ3: ECCコンポーネント対応付け

意図 + スコープ + 技術スタック（フェーズ0由来）を具体的なECCコンポーネントへ対応付けます。

#### 意図タイプ別

| 意図 | Commands | Skills | Agents |
|--------|----------|--------|--------|
| 新機能 | /plan, /tdd, /code-review, /verify | tdd-workflow, verification-loop | planner, tdd-guide, code-reviewer |
| バグ修正 | /tdd, /build-fix, /verify | tdd-workflow | tdd-guide, build-error-resolver |
| リファクタリング | /refactor-clean, /code-review, /verify | verification-loop | refactor-cleaner, code-reviewer |
| 調査 | /plan | search-first, iterative-retrieval | — |
| テスト | /tdd, /e2e, /test-coverage | tdd-workflow, e2e-testing | tdd-guide, e2e-runner |
| レビュー | /code-review | security-review | code-reviewer, security-reviewer |
| ドキュメント | /update-docs, /update-codemaps | — | doc-updater |
| インフラ | /plan, /verify | docker-patterns, deployment-patterns, database-migrations | architect |
| 設計 (MEDIUM-HIGH) | /plan | — | planner, architect |
| 設計 (EPIC) | — | blueprint（skillとして呼び出す） | planner, architect |

#### 技術スタック別

| 技術スタック | 追加するSkills | Agent |
|------------|--------------|-------|
| Python / Django | django-patterns, django-tdd, django-security, django-verification, python-patterns, python-testing | python-reviewer |
| Go | golang-patterns, golang-testing | go-reviewer, go-build-resolver |
| Spring Boot / Java | springboot-patterns, springboot-tdd, springboot-security, springboot-verification, java-coding-standards, jpa-patterns | code-reviewer |
| Kotlin / Android | kotlin-coroutines-flows, compose-multiplatform-patterns, android-clean-architecture | kotlin-reviewer |
| TypeScript / React | frontend-patterns, backend-patterns, coding-standards | code-reviewer |
| Swift / iOS | swiftui-patterns, swift-concurrency-6-2, swift-actor-persistence, swift-protocol-di-testing | code-reviewer |
| PostgreSQL | postgres-patterns, database-migrations | database-reviewer |
| Perl | perl-patterns, perl-testing, perl-security | code-reviewer |
| C++ | cpp-coding-standards, cpp-testing | code-reviewer |
| その他 / 未掲載 | coding-standards（汎用） | code-reviewer |

### フェーズ4: 不足コンテキスト検出

プロンプトに重要情報の不足がないかスキャンします。各項目を確認し、フェーズ0で自動検出されたか、ユーザーが提供する必要があるかを記録します。

- [ ] **技術スタック** — フェーズ0で検出済みか、ユーザー指定が必要か
- [ ] **対象スコープ** — ファイル、ディレクトリ、モジュールが言及されているか
- [ ] **受け入れ基準** — タスク完了をどう判断するか
- [ ] **エラー処理** — エッジケースと失敗モードが扱われているか
- [ ] **セキュリティ要件** — 認証、入力検証、シークレット
- [ ] **テスト期待値** — ユニット、統合、E2E
- [ ] **パフォーマンス制約** — 負荷、レイテンシ、リソース制限
- [ ] **UI/UX要件** — デザイン仕様、レスポンシブ、a11y（フロントエンドの場合）
- [ ] **データベース変更** — スキーマ、マイグレーション、インデックス（データ層の場合）
- [ ] **既存パターン** — 従うべき参照ファイルや規約
- [ ] **スコープ境界** — 何をしないか

**重要項目が3つ以上不足している場合**、最適化済みプロンプトを生成する前に、最大3つの確認質問をユーザーに尋ねます。その後、回答を最適化済みプロンプトに組み込みます。

### フェーズ5: ワークフローとモデル推奨

このプロンプトが開発ライフサイクルのどこに位置するかを判断します。

```
Research → Plan → Implement (TDD) → Review → Verify → Commit
```

MEDIUM以上のタスクでは必ず /plan から始めます。EPICタスクではblueprint skillを使用します。

**モデル推奨**（出力に含める）:

| スコープ | 推奨モデル | 根拠 |
|-------|------------------|-----------|
| TRIVIAL-LOW | Sonnet 4.6 | 単純なタスクに高速で費用対効果が高い |
| MEDIUM | Sonnet 4.6 | 標準的な作業に最適なコーディングモデル |
| HIGH | Sonnet 4.6 (main) + Opus 4.6 (planning) | アーキテクチャにはOpus、実装にはSonnet |
| EPIC | Opus 4.6 (blueprint) + Sonnet 4.6 (execution) | 複数セッション計画のための深い推論 |

**複数プロンプトへの分割**（HIGH/EPICスコープ向け）:

単一セッションを超えるタスクでは、順次プロンプトに分割します。
- Prompt 1: 調査 + 計画（search-first skillを使用し、その後 /plan）
- Prompt 2-N: プロンプトごとに1フェーズを実装（各プロンプトは /verify で終える）
- Final Prompt: 全フェーズ横断の統合テスト + /code-review
- セッション間のコンテキスト保持に /save-session と /resume-session を使用

---

## 出力フォーマット

以下の正確な構造で分析を提示します。ユーザー入力と同じ言語で応答します。

### セクション1: プロンプト診断

**強み:** 元のプロンプトがうまくできている点を列挙。

**問題:**

| 問題 | 影響 | 推奨修正 |
|-------|--------|---------------|
| (問題) | (影響) | (修正方法) |

**確認が必要:** ユーザーが答えるべき質問の番号付きリスト。フェーズ0で回答を自動検出した場合は、質問する代わりにそれを記載。

### セクション2: 推奨ECCコンポーネント

| 種別 | コンポーネント | 目的 |
|------|-----------|---------|
| Command | /plan | コーディング前にアーキテクチャを計画 |
| Skill | tdd-workflow | TDD方法論のガイダンス |
| Agent | code-reviewer | 実装後レビュー |
| Model | Sonnet 4.6 | このスコープに推奨 |

### セクション3: 最適化済みプロンプト — 完全版

完全な最適化済みプロンプトを単一のfenced code block内に提示します。プロンプトは自己完結しており、そのままコピー&ペーストできる必要があります。以下を含めます。
- コンテキスト付きの明確なタスク説明
- 技術スタック（検出または指定）
- 適切なワークフローステージでの /command 呼び出し
- 受け入れ基準
- 検証手順
- スコープ境界（何をしないか）

blueprintに言及する項目では、"Use the blueprint skill to..." と書きます（blueprintはcommandではなくskillなので、`/blueprint` とは書かない）。

### セクション4: 最適化済みプロンプト — 簡易版

経験豊富なECCユーザー向けのコンパクト版。意図タイプに応じて変えます。

| 意図 | 簡易パターン |
|--------|--------------|
| 新機能 | `/plan [feature]. /tdd で実装. /code-review. /verify.` |
| バグ修正 | `/tdd — [bug] の失敗テストを書く。グリーンまで修正。/verify.` |
| リファクタリング | `/refactor-clean [scope]. /code-review. /verify.` |
| 調査 | `[topic] にsearch-first skillを使用。調査結果に基づき /plan.` |
| テスト | `/tdd [module]. 重要フローに /e2e. /test-coverage.` |
| レビュー | `/code-review. その後security-reviewer agentを使用.` |
| ドキュメント | `/update-docs. /update-codemaps.` |
| EPIC | `"[objective]" にblueprint skillを使用。/verifyゲート付きでフェーズ実行.` |

### セクション5: 改善理由

| 改善 | 理由 |
|-------------|--------|
| (追加したもの) | (重要な理由) |

### フッター

> 必要なものと違う場合は、調整点を教えてください。プロンプト最適化ではなく実行を望む場合は、通常のタスク依頼をしてください。

---

## 例

### 起動例

- "このプロンプトをECC向けに最適化して"
- "Claude Codeが正しいcommandsを使うよう、このプロンプトを書き直して"
- "帮我优化这个指令"
- "このタスクではECCにどうプロンプトすべき?"

### 例1: あいまいな中国語プロンプト（プロジェクト検出済み）

**ユーザー入力:**
```
帮我写一个用户登录页面
```

**フェーズ0の検出:** Next.js 15、TypeScript、Tailwind CSSを含む `package.json`

**最適化済みプロンプト（完全版）:**
```
使用项目现有技术栈（Next.js 15 + TypeScript + Tailwind CSS）实现用户登录页面。

技术要求：
- 沿用项目现有的组件结构和路由约定
- 表单验证使用项目中已有的验证方案（检查是否已用 Zod/Yup/其他）
- 认证方式：沿用项目现有认证方案（如无，默认 JWT）
- 包含：邮箱/密码登录表单、表单验证、错误提示、加载状态、响应式布局

工作流：
1. /plan 先规划组件结构和认证流程，参考现有页面的模式
2. /tdd 测试先行：编写登录表单的单元测试和认证流程的集成测试
3. 实现登录页面和认证逻辑
4. /code-review 审查实现
5. /verify 验证所有测试通过且页面正常渲染

安全要求：
- 密码不明文传输
- 防止暴力破解（rate limiting）
- XSS 防护
- CSRF token

验收标准：
- 所有测试通过，覆盖率 80%+
- 页面在移动端和桌面端正常渲染
- 登录成功跳转到 dashboard，失败显示错误信息

不要做：
- 不要实现注册页面
- 不要实现忘记密码功能
- 不要修改现有的路由结构
```

### 例2: 中程度の日本語プロンプト

**ユーザー入力:**
```
検証付きでユーザープロフィール更新用のREST APIエンドポイントを追加して
```

**フェーズ0の検出:** Go 1.22、Chi routerを含む `go.mod`

**最適化済みプロンプト（完全版）:**
```
ユーザープロフィール更新用のREST APIエンドポイント（PATCH /api/users/:id）を追加してください。

技術スタック: Go 1.22 + Chi router（プロジェクトから検出）

要件:
- PATCH /api/users/:id — ユーザープロフィールの部分更新
- フィールドの入力検証: name, email, avatar_url, bio
- Auth: 有効なトークンを必須にし、ユーザーは自分のプロフィールのみ更新可能
- 成功時は更新済みユーザーとともに200を返す
- 無効な入力では検証エラーとともに400を返す
- 認証/認可失敗では401/403を返す
- コードベース内の既存APIパターンに従う

ワークフロー:
1. /plan でエンドポイント構造、ミドルウェアチェーン、検証ロジックを計画する
2. /tdd — 成功、検証失敗、認証失敗、not-foundのテーブル駆動テストを書く
3. 既存ハンドラーパターンに従って実装する
4. /go-review
5. /verify — フルテストスイートを実行し、リグレッションがないことを確認する

やらないこと:
- 既存エンドポイントを変更しない
- データベーススキーマを変更しない（既存のuserテーブルを使用）
- 既存のものを確認せずに新しい依存関係を追加しない（search-first skillを使用）
```

### 例3: EPICプロジェクト

**ユーザー入力:**
```
モノリスをマイクロサービスへ移行して
```

**最適化済みプロンプト（完全版）:**
```
blueprint skillを使って計画してください: "モノリスをマイクロサービスアーキテクチャへ移行する"

実行前に、blueprint内で次の質問に答えてください:
1. 現在のモノリスにはどのドメイン境界があるか
2. 最初に抽出すべきサービスはどれか（結合度が最も低いもの）
3. 通信パターン: REST APIs、gRPC、またはイベント駆動（Kafka/RabbitMQ）か
4. データベース戦略: 最初は共有DBか、最初からdatabase-per-serviceか
5. デプロイ先: Kubernetes、Docker Compose、serverlessのどれか

blueprintでは次のようなフェーズを作成してください:
- Phase 1: サービス境界を特定し、ドメインマップを作成
- Phase 2: インフラをセットアップ（API gateway、service mesh、サービスごとのCI/CD）
- Phase 3: 最初のサービスを抽出（strangler fig pattern）
- Phase 4: 統合テストで検証し、次のサービスを抽出
- Phase N: モノリスを廃止

各フェーズ = 1 PRとし、フェーズ間に /verify ゲートを置く。
フェーズ間では /save-session を使う。継続には /resume-session を使う。
依存関係が許す場合は、並列サービス抽出にgit worktreesを使う。

推奨: blueprint計画にはOpus 4.6、フェーズ実行にはSonnet 4.6。
```

---

## 関連コンポーネント

| コンポーネント | 参照するタイミング |
|-----------|------------------|
| `configure-ecc` | ユーザーがまだECCをセットアップしていない |
| `skill-stocktake` | インストール済みコンポーネントを監査する（ハードコードされたカタログの代わりに使用） |
| `search-first` | 最適化済みプロンプト内の調査フェーズ |
| `blueprint` | EPICスコープの最適化済みプロンプト（commandではなくskillとして呼び出す） |
| `strategic-compact` | 長いセッションのコンテキスト管理 |
| `cost-aware-llm-pipeline` | トークン最適化の推奨 |
