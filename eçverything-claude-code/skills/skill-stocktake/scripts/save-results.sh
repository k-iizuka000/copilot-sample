#!/usr/bin/env bash
# save-results.sh — 評価済みskillsを正しいUTCタイムスタンプ付きでresults.jsonへマージする
# 使用法: save-results.sh RESULTS_JSON <<< "$EVAL_JSON"
#
# stdin形式:
#   { "skills": {...}, "mode"?: "full"|"quick", "batch_progress"?: {...} }
#
# `date -u`でevaluated_atを常に現在UTC時刻に設定する。
# stdinの.skillsを既存results.jsonへマージする（新しいエントリが古いものを上書き）。
# stdinに存在する場合は.modeと.batch_progressも更新する。

set -euo pipefail

RESULTS_JSON="${1:-}"

if [[ -z "$RESULTS_JSON" ]]; then
  echo "エラー: RESULTS_JSON引数が必要です" >&2
  echo "使用法: save-results.sh RESULTS_JSON <<< \"\$EVAL_JSON\"" >&2
  exit 1
fi

EVALUATED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# resultsファイルに触れる前に、stdinから評価結果を読み取りJSONを検証する
input_json=$(cat)
if ! echo "$input_json" | jq empty 2>/dev/null; then
  echo "エラー: stdinが有効なJSONではありません" >&2
  exit 1
fi

if [[ ! -f "$RESULTS_JSON" ]]; then
  # ブートストラップ: stdin JSON + 現在UTCタイムスタンプから新しいresults.jsonを作成
  echo "$input_json" | jq --arg ea "$EVALUATED_AT" \
    '. + { evaluated_at: $ea }' > "$RESULTS_JSON"
  exit 0
fi

# マージ: 新しい.skillsが既存を上書きし、input_jsonにない古いskillsは保持する。
# 指定されている場合は.modeと.batch_progressも更新する。
#
# 衝突しにくい一時ファイルのためmktempを使う（同じRESULTS_JSONに対する同時実行は
# 予測可能な".tmp"サフィックスで競合するため、ランダムサフィックスで静かな上書きを防ぐ）。
tmp=$(mktemp "${RESULTS_JSON}.XXXXXX")
trap 'rm -f "$tmp"' EXIT

jq -s \
  --arg ea "$EVALUATED_AT" \
  '.[0] as $existing | .[1] as $new |
   $existing |
   .evaluated_at = $ea |
   .skills = ($existing.skills + ($new.skills // {})) |
   if ($new | has("mode")) then .mode = $new.mode else . end |
   if ($new | has("batch_progress")) then .batch_progress = $new.batch_progress else . end' \
  "$RESULTS_JSON" <(echo "$input_json") > "$tmp"

mv "$tmp" "$RESULTS_JSON"
