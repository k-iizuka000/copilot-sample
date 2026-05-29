---
name: springboot-verification
description: Spring BootプロジェクトでPR前またはリリース前にbuild、static analysis、test、coverage、security scan、diff reviewを行う。
---

# Spring Boot Verification

Spring Boot の変更後は、build だけでなく、静的解析、テスト、セキュリティ、差分意図をまとめて確認します。

## 使うタイミング

- PR 前
- release 前
- migration、security、API contract を変えた後
- 大きな refactor 後

## Verification phases

1. Build
2. Static analysis
3. Test and coverage
4. Security scan
5. Migration / runtime smoke
6. Diff review

## Commands

Maven:

```bash
mvn -T 4 clean verify
mvn -T 4 test
mvn jacoco:report
mvn org.owasp:dependency-check-maven:check
```

Gradle:

```bash
./gradlew clean build
./gradlew test jacocoTestReport
./gradlew dependencyCheckAnalyze
```

設定されている場合:

```bash
mvn spotless:check
mvn spotbugs:check pmd:check checkstyle:check
./gradlew checkstyleMain pmdMain spotbugsMain
```

## Diff review

- 意図しない file が変わっていないか
- debug log や temporary code がないか
- migration と entity / DTO / repository が揃っているか
- API status と error response が contract に合っているか
- config / secret / environment の変更が文書化されているか

## Report

```text
検証レポート
Build:
Static analysis:
Tests:
Coverage:
Security:
Runtime smoke:
Diff review:
Not verified:
Overall:
```

## 失敗時

- 失敗した phase、command、代表エラーを記録する。
- 直せるものは直して同じ command を再実行する。
- 環境依存で実行不能な場合は、代替検証と残る不確実性を明記する。
