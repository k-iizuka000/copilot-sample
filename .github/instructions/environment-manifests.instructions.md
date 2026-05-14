---
applyTo: "**/package.json,**/pnpm-lock.yaml,**/yarn.lock,**/package-lock.json,**/bun.lock,**/bun.lockb,**/pyproject.toml,**/uv.lock,**/poetry.lock,**/requirements*.txt,**/go.mod,**/Cargo.toml,**/Gemfile,**/pom.xml,**/build.gradle,**/build.gradle.kts,**/composer.json,**/Package.swift,**/Dockerfile,**/docker-compose*.yml,**/docker-compose*.yaml,**/.devcontainer/**,**/.github/workflows/**"
---

# Environment Manifest Instructions

environment manifests を編集または解釈するとき:

- lockfile が示す package manager を維持する。
- scripts または CI に既に存在する commands を優先する。
- ユーザーの明示的な承認なしに package manager を変更しない。
- version files、engines、wrappers、CI、containers から runtime version evidence を
  記録する。
- install、build、lint、test、run commands を分ける。
- command が verified ではなく inferred の場合は、inferred と明示する。

setup reports では、各 command の根拠となる manifest または workflow path を
引用する。
