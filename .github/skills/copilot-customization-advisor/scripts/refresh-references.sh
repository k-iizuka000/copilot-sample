#!/usr/bin/env bash
# references/manifest.txt に列挙した公式ドキュメントの raw Markdown を取得し直す。
# 使い方: bash .github/skills/copilot-customization-advisor/scripts/refresh-references.sh
# 依存: curl のみ。取得日と出典 URL は references/SNAPSHOT.md に書き出す。
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REF_DIR="$SKILL_DIR/references"
MANIFEST="$REF_DIR/manifest.txt"
SNAPSHOT="$REF_DIR/SNAPSHOT.md"
TODAY="$(date -u +%Y-%m-%d)"

ok=0
ng=0
{
  echo "# スナップショット取得記録"
  echo
  echo "取得日 (UTC): $TODAY"
  echo
  echo "| 保存先 | 出典 (raw URL) | 結果 |"
  echo "| --- | --- | --- |"
} > "$SNAPSHOT.tmp"

while read -r dest repo branch path; do
  case "$dest" in ''|'#'*) continue ;; esac
  url="https://raw.githubusercontent.com/$repo/$branch/$path"
  out="$REF_DIR/$dest/$(basename "$path")"
  mkdir -p "$REF_DIR/$dest"
  if curl -fsSL --retry 2 -o "$out.tmp" "$url"; then
    mv "$out.tmp" "$out"
    echo "| $dest/$(basename "$path") | $url | ok |" >> "$SNAPSHOT.tmp"
    ok=$((ok + 1))
  else
    rm -f "$out.tmp"
    echo "| $dest/$(basename "$path") | $url | 取得失敗 (前回分を保持) |" >> "$SNAPSHOT.tmp"
    ng=$((ng + 1))
  fi
done < "$MANIFEST"

mv "$SNAPSHOT.tmp" "$SNAPSHOT"
echo "取得完了: ok=$ok 失敗=$ng 記録=$SNAPSHOT"
[ "$ng" -eq 0 ]
