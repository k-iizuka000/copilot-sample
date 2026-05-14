---
name: source-first-env-reconstruction
description: 大きな file を読む前に manifest を token-efficient に scan し、source から setup を復元する skill。
allowed-tools: ["read", "search", "execute"]
---

# Source-First Environment Reconstruction

未知の project environment の setup、build、test、run、理解を依頼された場合に
この skill を使います。

目的は、context をできるだけ使わずに、source-controlled evidence から環境を
再構築することです。

## まず script から始める

この skill directory から、helper script を target repository root に対して
実行します。host で script path を直接利用できない場合は、`rg --files`、`find`、
targeted reads で同じ動きを再現します。

```sh
sh scripts/repo-surface.sh /path/to/target/repo
sh scripts/manifest-scan.sh /path/to/target/repo
```

target repo が current workspace の場合は、target path に `$PWD` を使います。

## 根拠の優先順位

次の順に evidence を優先します。

1. Lockfiles と package-manager-specific metadata。
2. Language manifests と version files。
3. CI workflows と scripted build/test commands。
4. Dockerfiles、compose files、devcontainers。
5. Entrypoints と framework config。
6. README と prose docs。

README は intent の確認には使えますが、source と CI evidence を上書きしません。

## Package Manager の推定

- Node: `pnpm-lock.yaml`、`yarn.lock`、`package-lock.json`、`bun.lock` または
  `bun.lockb`、`package.json` scripts の順に優先する。
- Python: `pyproject.toml`、`uv.lock`、`poetry.lock`、`requirements*.txt`、
  `setup.py`、`Pipfile`、version files を確認する。
- Go: `go.mod`、`go.sum`、Makefile または CI commands を確認する。
- Rust: `Cargo.toml`、`Cargo.lock`、workspace members を確認する。
- Ruby: `Gemfile`、`Gemfile.lock`、`.ruby-version`、binstubs を確認する。
- Java/Kotlin: `pom.xml`、`build.gradle*`、`gradlew`、wrapper properties を
  確認する。
- .NET: `*.sln`、`*.csproj`、`global.json`、test projects を確認する。
- PHP: `composer.json`、`composer.lock`、framework CLI scripts を確認する。
- Swift/iOS: `Package.swift`、`*.xcodeproj`、`*.xcworkspace`、scheme references を
  確認する。
- Containers: Dockerfiles、compose files、`.devcontainer` を確認する。

## ワークフロー

1. repo surface summary を作る。
2. manifests、lockfiles、version files、CI files、container files、command scripts を
   すべて列挙する。
3. evidence から stack と package manager を推定する。
4. command order を復元する。
   - prerequisites
   - dependency install
   - build or typecheck
   - lint
   - test
   - run or smoke check
5. task に必要な command だけを実行する。cheap verification を先に行う。
6. 意味のある failure で止まり、最も近い config、source、log slice から診断する。

## 出力テンプレート

```text
検出した stack:
- ...

evidence files:
- ...

復元した commands:
- prerequisites:
- install:
- build/typecheck:
- lint:
- test:
- run/smoke:

実際に実行した commands:
- ...

検証済み:
- ...

未検証:
- ...

残る不確実性:
- ...
```
