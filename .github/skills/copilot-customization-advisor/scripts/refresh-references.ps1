# references/manifest.txt に列挙した公式ドキュメントの raw Markdown を取得し直す (Windows 用)。
# 使い方: pwsh -File .github/skills/copilot-customization-advisor/scripts/refresh-references.ps1
# 依存: PowerShell 5.1 以上。取得日と出典 URL は references/SNAPSHOT.md に書き出す。
$ErrorActionPreference = "Stop"

$skillDir = Split-Path -Parent $PSScriptRoot
$refDir = Join-Path $skillDir "references"
$manifest = Join-Path $refDir "manifest.txt"
$snapshot = Join-Path $refDir "SNAPSHOT.md"
$today = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd")

$lines = @(
  "# スナップショット取得記録",
  "",
  "取得日 (UTC): $today",
  "",
  "| 保存先 | 出典 (raw URL) | 結果 |",
  "| --- | --- | --- |"
)
$ok = 0
$ng = 0

foreach ($raw in Get-Content $manifest) {
  $line = $raw.Trim()
  if ($line -eq "" -or $line.StartsWith("#")) { continue }
  $parts = $line -split "\s+"
  if ($parts.Count -lt 4) { continue }
  $dest, $repo, $branch, $path = $parts[0], $parts[1], $parts[2], $parts[3]
  $url = "https://raw.githubusercontent.com/$repo/$branch/$path"
  $name = Split-Path -Leaf $path
  $outDir = Join-Path $refDir $dest
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
  $out = Join-Path $outDir $name
  try {
    Invoke-WebRequest -Uri $url -OutFile "$out.tmp" -UseBasicParsing
    Move-Item -Force "$out.tmp" $out
    $lines += "| $dest/$name | $url | ok |"
    $ok++
  } catch {
    Remove-Item -Force "$out.tmp" -ErrorAction SilentlyContinue
    $lines += "| $dest/$name | $url | 取得失敗 (前回分を保持) |"
    $ng++
  }
}

Set-Content -Path $snapshot -Value $lines -Encoding UTF8
Write-Host "取得完了: ok=$ok 失敗=$ng 記録=$snapshot"
if ($ng -gt 0) { exit 1 }
