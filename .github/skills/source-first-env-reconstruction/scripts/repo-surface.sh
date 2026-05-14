#!/bin/sh
set -eu

ROOT="${1:-.}"

if [ ! -d "$ROOT" ]; then
  echo "エラー: 対象がディレクトリではありません: $ROOT" >&2
  exit 2
fi

cd "$ROOT"

pruned_find() {
  find . \
    \( -path './.git' -o -path './node_modules' -o -path './vendor' \
       -o -path './dist' -o -path './build' -o -path './target' \
       -o -path './.next' -o -path './.venv' -o -path './venv' \
       -o -path './DerivedData' -o -path './.gradle' \) -prune \
    -o "$@"
}

echo "== リポジトリルート =="
pwd

echo
echo "== トップレベル項目 =="
find . -maxdepth 1 -mindepth 1 -print | sed 's#^\./##' | sort | head -200

echo
echo "== ディレクトリ概要 (最大深さ 2) =="
pruned_find -maxdepth 2 -type d -print | sed 's#^\./##' | sort | head -200

echo
echo "== 重要ファイル (最大深さ 4) =="
pruned_find -maxdepth 4 -type f -print \
  | sed 's#^\./##' \
  | grep -E '(^|/)(README[^/]*|CHANGELOG[^/]*|CONTRIBUTING[^/]*|LICENSE[^/]*|AGENTS\.md|CLAUDE\.md|GEMINI\.md|Makefile|justfile|Taskfile|package.json|pnpm-lock.yaml|yarn.lock|package-lock.json|bun.lockb?|pyproject.toml|uv.lock|poetry.lock|requirements[^/]*\.txt|setup.py|Pipfile|go.mod|Cargo.toml|Gemfile|pom.xml|build.gradle|build.gradle.kts|gradlew|composer.json|Package.swift|Dockerfile|docker-compose[^/]*\.ya?ml|\.tool-versions|\.node-version|\.nvmrc|\.python-version|runtime.txt)$|(^|/)\.github/workflows/|(^|/)\.devcontainer/' \
  | sort \
  | head -300

echo
echo "== 拡張子別件数 (サンプル、生成ディレクトリは除外) =="
pruned_find -type f -print \
  | sed 's#^\./##' \
  | awk '
      {
        n=$0
        sub(/^.*\//, "", n)
        if (n !~ /\./) ext="[no-ext]"
        else {
          ext=n
          sub(/^.*\./, ".", ext)
        }
        count[ext]++
      }
      END {
        for (ext in count) print count[ext], ext
      }
    ' \
  | sort -rn \
  | head -40
