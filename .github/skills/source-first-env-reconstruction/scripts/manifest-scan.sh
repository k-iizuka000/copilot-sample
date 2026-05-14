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

section() {
  echo
  echo "== $1 =="
}

list_matching() {
  pattern="$1"
  pruned_find -type f -print \
    | sed 's#^\./##' \
    | grep -E "$pattern" \
    | sort \
    | head -300 || true
}

section "バージョンファイル"
list_matching '(^|/)(\.tool-versions|\.node-version|\.nvmrc|\.python-version|\.ruby-version|runtime.txt|global.json|go.env)$'

section "Node manifest"
list_matching '(^|/)(package.json|pnpm-lock.yaml|yarn.lock|package-lock.json|npm-shrinkwrap.json|bun.lock|bun.lockb|\.yarnrc.yml)$'

section "Python manifest"
list_matching '(^|/)(pyproject.toml|uv.lock|poetry.lock|requirements[^/]*\.txt|setup.py|setup.cfg|Pipfile|Pipfile.lock|tox.ini|noxfile.py)$'

section "Go manifest"
list_matching '(^|/)(go.mod|go.sum|go.work|go.work.sum)$'

section "Rust manifest"
list_matching '(^|/)(Cargo.toml|Cargo.lock)$'

section "Ruby manifest"
list_matching '(^|/)(Gemfile|Gemfile.lock|\.ruby-version|\.bundle/config)$'

section "Java/Kotlin manifest"
list_matching '(^|/)(pom.xml|build.gradle|build.gradle.kts|settings.gradle|settings.gradle.kts|gradlew|gradlew.bat|gradle-wrapper.properties)$'

section ".NET manifest"
list_matching '(^|/)([^/]+\.sln|[^/]+\.csproj|[^/]+\.fsproj|global.json|Directory.Build.props|Directory.Packages.props)$'

section "PHP manifest"
list_matching '(^|/)(composer.json|composer.lock|artisan)$'

section "Swift/Apple manifest"
list_matching '(^|/)(Package.swift|[^/]+\.xcodeproj|[^/]+\.xcworkspace|[^/]+\.podspec|Podfile|Podfile.lock|Cartfile|Cartfile.resolved)$'

section "コンテナと開発環境"
list_matching '(^|/)(Dockerfile|Containerfile|docker-compose[^/]*\.ya?ml|compose[^/]*\.ya?ml|devcontainer.json)$|(^|/)\.devcontainer/'

section "CI workflow"
list_matching '(^|/)(\.github/workflows/[^/]+\.ya?ml|\.gitlab-ci\.ya?ml|Jenkinsfile|azure-pipelines\.ya?ml|circle\.yml)$'

section "コマンド surface"
list_matching '(^|/)(Makefile|justfile|Taskfile\.ya?ml|Taskfile\.yml|Rakefile|Procfile)$|(^|/)(scripts|bin)/[^/]+$'
