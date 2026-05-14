---
name: reverse-engineering-harness
description: 既存 project を snapshot から verified report まで段階的に解析する reverse-engineering harness。
allowed-tools: ["read", "search", "execute", "agent"]
---

# Reverse Engineering Harness

既存 project を理解したい、動き方を復元したい、development environment を再構築
したい場合にこの skill を使います。

この harness は、context waste と premature conclusions を避けるために段階化
されています。

## Stage 1: Snapshot（概要把握）

compact な surface map を作ります。

- repository root
- top-level directories
- important manifests and configs
- likely languages and frameworks
- scripts、Makefiles、CI、Docker などの command surface

この段階では deep implementation files を読みません。

## Stage 2: Manifest（環境根拠）

source-controlled environment evidence を確認します。

- language manifests
- lockfiles
- version files
- CI workflows
- containers and devcontainers
- framework config

README は supporting evidence としてのみ使います。

## Stage 3: Dependency（依存関係）

次を推定します。

- package manager
- runtime versions
- workspace または monorepo layout
- internal package boundaries
- external services または local infrastructure

各 inference の根拠となる file path を記録します。

## Stage 4: Runtime（実行経路）

commands を順番に復元します。

- prerequisite tools
- dependency installation
- build or typecheck
- lint
- test
- local run
- smoke check

CI または project scripts で既に使われている commands を優先します。

## Stage 5: Verification（検証）

ユーザーの task に必要な verification だけを実行します。低コストな順に進めます。

1. tool availability and versions
2. dependency checks or locked install
3. build or typecheck
4. focused tests
5. runtime smoke

意味のある failure で止まります。近くの config、source、log から診断します。

## Stage 6: Report（報告）

この構造で返します。

```text
目的:

repo surface:

environment reconstruction:

architecture notes:

実行した commands:

検証済み:

未検証:

残る不確実性:

次の最も安全な action:
```

## Agent の使い方

custom agents が利用できる場合:

- source map と execution flow には `code-cartographer` を使う。
- dependency と command inference には `environment-reconstructor` を使う。
- command execution と smoke checks には `runtime-verifier` を使う。
- 大きな investigation の統合には `reverse-engineering-orchestrator` を使う。

各 delegated task は narrow に保ち、結果には evidence paths を求めます。
