---
name: verification-loop
description: 変更後やPR前に、build、type/static check、lint、test、security、diff reviewを順に行い、検証済み事項と未検証事項を分けて報告する。
---

# Verification Loop

変更が完了したように見えても、検証が終わるまでは完了ではありません。実行した command と未検証事項を明確に分けます。

## 使うタイミング

- 機能実装や bug fix の後
- PR 作成前
- refactor 後
- release 前

## Phases

1. Build
2. Type check または static analysis
3. Lint / format check
4. Unit / integration test
5. Security scan
6. Runtime smoke または realistic flow
7. Diff review

## Command選択

プロジェクトの package manager と build tool に合わせて選びます。

```bash
npm run build
npm test
npm run lint
mvn verify
./gradlew build
```

security scan は、設定済みの tool があれば使います。

```bash
npm audit
mvn org.owasp:dependency-check-maven:check
./gradlew dependencyCheckAnalyze
```

## Diff review

- 変更ファイルが意図した範囲か
- temporary log / debug code が残っていないか
- generated file や lockfile の変更が説明できるか
- migration、config、documentation が必要なら揃っているか

## Report

```text
検証レポート
Build:
Static/type check:
Lint:
Tests:
Security:
Runtime smoke:
Diff:
Verified:
Not verified:
Remaining uncertainty:
```

## 失敗した場合

- command と代表エラーを記録する。
- 修正可能なら修正して同じ command を再実行する。
- 環境や依存サービスが理由で実行できない場合、代替検証と残る不確実性を明記する。
