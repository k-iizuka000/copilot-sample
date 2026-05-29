#!/usr/bin/env bash
# quick-diff.sh — skillファイルのmtimeをresults.jsonのevaluated_atと比較する
# 使用法: quick-diff.sh RESULTS_JSON [CWD_SKILLS_DIR]
# 出力: 変更/新規ファイルのJSON配列をstdoutへ出力（変更なしなら空の[]）
#
# CWD_SKILLS_DIRが省略された場合は$PWD/.claude/skillsをデフォルトにし、
# 呼び出し側に依存せずプロジェクトレベルのskillsを必ず拾う。
#
# 環境変数:
#   SKILL_STOCKTAKE_GLOBAL_DIR   ~/.claude/skillsを上書き（テスト専用。
#                                本番では設定しない — batsテスト向け）
#   SKILL_STOCKTAKE_PROJECT_DIR  プロジェクトディレクトリ検出を上書き（テスト専用）

set -euo pipefail

RESULTS_JSON="${1:-}"
CWD_SKILLS_DIR="${SKILL_STOCKTAKE_PROJECT_DIR:-${2:-$PWD/.claude/skills}}"
GLOBAL_DIR="${SKILL_STOCKTAKE_GLOBAL_DIR:-$HOME/.claude/skills}"

if [[ -z "$RESULTS_JSON" || ! -f "$RESULTS_JSON" ]]; then
  echo "エラー: RESULTS_JSONが見つかりません: ${RESULTS_JSON:-<empty>}" >&2
  exit 1
fi

# CWD_SKILLS_DIRが.claude/skillsパスらしいことを検証する（多層防御）。
# パスが存在する場合のみ警告する — 存在しないパスにはトラバーサルリスクがない。
if [[ -n "$CWD_SKILLS_DIR" && -d "$CWD_SKILLS_DIR" && "$CWD_SKILLS_DIR" != */.claude/skills* ]]; then
  echo "警告: CWD_SKILLS_DIRが.claude/skillsパスに見えません: $CWD_SKILLS_DIR" >&2
fi

evaluated_at=$(jq -r '.evaluated_at' "$RESULTS_JSON")

# evaluated_atが欠落または不正な形式の場合は早期失敗する。
# "null"とのISO 8601文字列比較で予測不能な結果を出さないため。
if [[ ! "$evaluated_at" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]]; then
  echo "エラー: $RESULTS_JSON の evaluated_at が不正または欠落しています: $evaluated_at" >&2
  exit 1
fi

# results.jsonから既知パスを一度だけ事前抽出する（ファイルごとにO(n*m)ではなくO(1)参照）
known_paths=$(jq -r '.skills[].path' "$RESULTS_JSON" 2>/dev/null)

tmpdir=$(mktemp -d)
# $tmpdirをクォート文字列に埋め込まないよう関数を使う（TMPDIRにシェルメタ文字が
# 含まれるよう細工された場合のインジェクションを防ぐ）。
_cleanup() { rm -rf "$tmpdir"; }
trap _cleanup EXIT

# process_dir呼び出し間で共有するカウンタ — 意図的にlocalではない
i=0

process_dir() {
  local dir="$1"
  while IFS= read -r file; do
    local mtime dp is_new
    mtime=$(date -u -r "$file" +%Y-%m-%dT%H:%M:%SZ)
    dp="${file/#$HOME/~}"

    # このファイルがresults.jsonに存在するか確認する（完全な行一致により、
    # 例: "python-patterns"が"python-patterns-v2"に一致するような部分一致の誤検出を避ける）。
    if echo "$known_paths" | grep -qxF "$dp"; then
      is_new="false"
      # 既知ファイル: mtimeが変わった場合のみ出力（ISO 8601文字列比較は安全）
      [[ "$mtime" > "$evaluated_at" ]] || continue
    else
      is_new="true"
      # 新規ファイル: mtimeに関係なく常に出力
    fi

    jq -n \
      --arg path "$dp" \
      --arg mtime "$mtime" \
      --argjson is_new "$is_new" \
      '{path:$path,mtime:$mtime,is_new:$is_new}' \
      > "$tmpdir/$i.json"
    i=$((i+1))
  done < <(find "$dir" -name "*.md" -type f 2>/dev/null | sort)
}

[[ -d "$GLOBAL_DIR" ]] && process_dir "$GLOBAL_DIR"
[[ -n "$CWD_SKILLS_DIR" && -d "$CWD_SKILLS_DIR" ]] && process_dir "$CWD_SKILLS_DIR"

if [[ $i -eq 0 ]]; then
  echo "[]"
else
  jq -s '.' "$tmpdir"/*.json
fi
