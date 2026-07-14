<#
.SYNOPSIS
  detail-design-workflow-skill v3.1.0 の機械照合スクリプト（verify）。

.DESCRIPTION
  runs/{機能ID}/10-json/ 配下の J-* JSON と、spec/ 配下の Markdown 成果物を突き合わせ、
  「機械的に判定できる壊れ方」だけを検出する。意味照合（条件・否定・例外の欠落など）は
  /03-check（Copilot 側）の責務であり、本スクリプトは行わない。

  BRIEF v3.1.0 §9 の7チェックを実装する:
    1. JSON 構造         : パース可能・必須キー非空・recordId 一意・enum 値の妥当性
    2. ルーティング整合   : 各レコードの責務に対応する spec/ ファイルが存在する
    3. トレース照合       : 全 recordId が spec/ 配下（trace 含む）に出現する
    4. リンク実在         : spec/ 内の相対リンク先ファイルが存在する
    5. lint               : front-matter 必須キー・仕様表の必須列（Record ID / 出典）
    6. 矛盾検出           : db/ 同一テーブルの同一カラムに型・桁の矛盾がないか
    7. 逆引きマップ生成   : recordId→spec ファイル / テーブル→機能ID を 20-check/reverse-map.md に出力

  FAIL / WARN の区別（BRIEF §9・決定#7）:
    FAIL = 機械的に壊れている   → JSON パース不能・必須キー欠落・recordId 重複・enum 逸脱・トレース欠落
    WARN = 人間の判断に委ねる   → ルーティング未生成・リンク切れ・lint 指摘・矛盾検出
  終了コード: 0 = OK（WARN のみ含む） / 1 = FAIL あり。

.PARAMETER RunDir
  対象 run のルート（例: runs/FUNC0123）。配下に 10-json/ と 20-check/ を持つ。

.PARAMETER SpecDir
  最終出力の spec/ ルート（例: spec）。front/back/batch/db/common/rules/trace を持つ。

.PARAMETER Report
  指定すると、レコード単位の詳細（各 recordId の出現 spec ファイル一覧）もコンソールへ出力する。
  既定は要約表示のみ。いずれの場合も verify-result.md / reverse-map.md は必ず生成する。

.NOTES
  PowerShell 5.1 互換（Windows 標準環境で追加インストール不要）。ConvertFrom-Json /
  Get-ChildItem / Select-String / .NET 正規表現などの標準機能のみを使用する。
  日本語のファイル名は扱わない前提（spec/ 配下のファイル名は ASCII: BRIEF §4）。
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $RunDir,

    [Parameter(Mandatory = $true)]
    [string] $SpecDir,

    [switch] $Report
)

# エラーで即停止せず、可能な範囲で検査を継続する（部分縮退）。
$ErrorActionPreference = 'Continue'

# =====================================================================================
# 正本ミラー: recordType -> 出力先（責務）ルーティング表
#   正本は spec-format/routing-table.md（BRIEF §6）。変更時は両方を必ず更新すること。
#   ここでは verify が「レコードの責務からあるべき spec ファイル」を機械導出するために保持する。
#
#   Kind の意味:
#     front / back / batch : spec/<Area>/<ID>/<File> （<ID> は recordId の接頭辞）
#     db                   : spec/db/<テーブル物理名>.md （テーブル名はレコード内フィールドから解決）
#     er                   : spec/db/_er-overview.md（全体定義書がある場合のみ存在）
#     perm                 : spec/common/permissions/ 配下のいずれか
#     common               : spec/common/naming.md または spec/common/codes/*.md
#     rules                : spec/rules/BR-*.md
#     asset                : runs/<ID>/00-input/assets/（spec 外）
#
#   ※ business_rule / asset は BRIEF §6 が日本語ラベル（業務ルール / アセット）で示す行に対応する
#     推定トークン。実データの recordType 値が異なる場合は本表と routing-table.md を更新すること
#     （成果物末尾「BRIEF疑義」参照）。
# =====================================================================================
$Routing = @{
    'screen_item'              = @{ Kind = 'front'; File = 'items.md' }
    'display_mode'             = @{ Kind = 'front'; File = 'items.md' }
    'parameter_definition'     = @{ Kind = 'front'; File = 'items.md' }
    'layout_reference'         = @{ Kind = 'front'; File = 'layout.md' }
    'validation_rule'          = @{ Kind = 'front'; File = 'validation.md' }
    'item_control'             = @{ Kind = 'front'; File = 'validation.md' }
    'correlation_validation'   = @{ Kind = 'front'; File = 'validation.md' }
    'message_rule'             = @{ Kind = 'front'; File = 'validation.md' }
    'ui_event'                 = @{ Kind = 'back'; File = 'methods.md' }
    # 処理概要=methods / 業務ロジック本文=logic のどちらでも可
    'process_section'          = @{ Kind = 'back'; File = 'methods.md|logic.md' }
    'search_requirement'       = @{ Kind = 'back'; File = 'queries.md' }
    'update_requirement'       = @{ Kind = 'back'; File = 'queries.md' }
    'select_constraint'        = @{ Kind = 'back'; File = 'queries.md' }
    'item_db_mapping'          = @{ Kind = 'back'; File = 'queries.md' }
    'batch_control'            = @{ Kind = 'batch'; File = 'control.md' }
    # バッチ文脈=batch/<ID>/io.md、画面文脈=back/<ID>/methods.md（layers で判定）
    'external_interface'       = @{ Kind = 'io-context'; File = '' }
    'entity_field'             = @{ Kind = 'db'; File = '' }
    'attribute_definition'     = @{ Kind = 'db'; File = '' }
    'view_definition'          = @{ Kind = 'db'; File = '' }
    'view_query_block'         = @{ Kind = 'db'; File = '' }
    'entity_relation'          = @{ Kind = 'er'; File = '_er-overview.md' }
    'screen_action_permission' = @{ Kind = 'perm'; File = '' }
    'case_reference_permission'= @{ Kind = 'perm'; File = '' }
    'role_hierarchy'           = @{ Kind = 'perm'; File = '' }
    'common_rule'              = @{ Kind = 'common'; File = '' }
    'business_rule'            = @{ Kind = 'rules'; File = '' }   # 推定トークン（BRIEF疑義）
    'asset'                    = @{ Kind = 'asset'; File = '' }   # 推定トークン（BRIEF疑義）
}

# layers の enum（BRIEF §5）。正本は copilot-instructions.md の説明だが、機械照合用にミラーする。
$ValidLayers = @('frontend', 'backend', 'db', 'batch', 'integration', 'authorization', 'common')

# =====================================================================================
# 検出結果の蓄積
#   各 finding = @{ Check; Severity('OK'|'WARN'|'FAIL'); Message }
# =====================================================================================
$script:Findings = New-Object System.Collections.Generic.List[object]

function Write-Head {
    param([string] $Text)
    Write-Host ""
    Write-Host ("=== " + $Text + " ===") -ForegroundColor Cyan
}

function Add-Finding {
    param(
        [string] $Check,
        [ValidateSet('OK', 'WARN', 'FAIL')] [string] $Severity,
        [string] $Message
    )
    $script:Findings.Add([pscustomobject]@{ Check = $Check; Severity = $Severity; Message = $Message }) | Out-Null
    switch ($Severity) {
        'OK'   { Write-Host ("  [OK]   " + $Message) -ForegroundColor Green }
        'WARN' { Write-Host ("  [WARN] " + $Message) -ForegroundColor Yellow }
        'FAIL' { Write-Host ("  [FAIL] " + $Message) -ForegroundColor Red }
    }
}

# PSCustomObject に指定プロパティが存在するか
function Test-Prop {
    param($Obj, [string] $Name)
    if ($null -eq $Obj) { return $false }
    if ($null -eq $Obj.PSObject) { return $false }
    return ($Obj.PSObject.Properties.Name -contains $Name)
}

# 候補プロパティ名のうち最初に見つかった値を返す（テーブル名などの緩やかな解決に使う）
function Get-FirstProp {
    param($Obj, [string[]] $Names)
    foreach ($n in $Names) {
        if (Test-Prop $Obj $n) {
            $v = $Obj.$n
            if ($null -ne $v -and ("" + $v).Trim() -ne "") { return ("" + $v).Trim() }
        }
    }
    return $null
}

# ConvertFrom-Json の結果から「レコード配列」を取り出す。
#   1) トップレベルが配列        -> 各要素のうち recordId を持つもの
#   2) .records を持つ           -> その配列
#   3) 自身が recordId を持つ    -> 単一レコード
#   4) それ以外                   -> 配列プロパティを走査し recordId を持つ要素を集める
function Get-JsonRecords {
    param($Parsed)
    $out = New-Object System.Collections.Generic.List[object]
    if ($null -eq $Parsed) { return $out }

    if ($Parsed -is [System.Array]) {
        foreach ($el in $Parsed) { if (Test-Prop $el 'recordId') { $out.Add($el) | Out-Null } }
        return $out
    }
    if (Test-Prop $Parsed 'records') {
        foreach ($el in @($Parsed.records)) { if (Test-Prop $el 'recordId') { $out.Add($el) | Out-Null } }
        return $out
    }
    if (Test-Prop $Parsed 'recordId') {
        $out.Add($Parsed) | Out-Null
        return $out
    }
    foreach ($p in $Parsed.PSObject.Properties) {
        if ($p.Value -is [System.Array]) {
            foreach ($el in $p.Value) { if (Test-Prop $el 'recordId') { $out.Add($el) | Out-Null } }
        }
    }
    return $out
}

# recordId の接頭辞（{機能ID or 画面ID}）を取り出す。形式: {ID}-{略号}-{連番3桁}。
# ID 自体にハイフンを含む場合（例: SCR-001-ITEM-012）があるため、末尾2セグメント（略号・連番）を
# 落とした残りを ID とみなす。セグメントが3未満なら先頭要素を返す（防御的）。
function Get-RecordPrefix {
    param([string] $RecordId)
    if ([string]::IsNullOrWhiteSpace($RecordId)) { return "" }
    $parts = $RecordId.Split('-')
    if ($parts.Count -ge 3) { return ($parts[0..($parts.Count - 3)] -join '-') }
    if ($parts.Count -ge 1) { return $parts[0] }
    return $RecordId
}

# SpecDir を基準にした表示用相対パス（先頭に 'spec/' を付ける）
function Get-SpecRelPath {
    param([string] $FullPath, [string] $SpecRootFull)
    $rel = $FullPath
    if ($FullPath.StartsWith($SpecRootFull)) {
        $rel = $FullPath.Substring($SpecRootFull.Length)
    }
    $rel = $rel.TrimStart('\', '/')
    return ('spec/' + ($rel -replace '\\', '/'))
}

# =====================================================================================
# 入口: 引数の健全性チェック
# =====================================================================================
Write-Head "verify.ps1 (detail-design-workflow v3.1.0)"

if (-not (Test-Path -LiteralPath $RunDir -PathType Container)) {
    Write-Host ("エラー: -RunDir が見つかりません: " + $RunDir) -ForegroundColor Red
    Write-Host "  runs/{機能ID} を指定してください（例: verify.ps1 -RunDir runs\FUNC0123 -SpecDir spec）。" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path -LiteralPath $SpecDir -PathType Container)) {
    Write-Host ("エラー: -SpecDir が見つかりません: " + $SpecDir) -ForegroundColor Red
    Write-Host "  spec/ ルートを指定してください（例: verify.ps1 -RunDir runs\FUNC0123 -SpecDir spec）。" -ForegroundColor Red
    exit 1
}

$RunDirFull  = (Resolve-Path -LiteralPath $RunDir).Path
$SpecDirFull = (Resolve-Path -LiteralPath $SpecDir).Path
$RunId       = Split-Path -Leaf $RunDirFull
$JsonDir     = Join-Path $RunDirFull '10-json'
$CheckDir    = Join-Path $RunDirFull '20-check'

Write-Host ("  RunDir : " + $RunDirFull)
Write-Host ("  SpecDir: " + $SpecDirFull)
Write-Host ("  RunId  : " + $RunId)

# 20-check/ は出力先。無ければ作る。
if (-not (Test-Path -LiteralPath $CheckDir -PathType Container)) {
    New-Item -ItemType Directory -Path $CheckDir -Force | Out-Null
}

# =====================================================================================
# JSON 読み込み（全 J-* ファイル）
# =====================================================================================
Write-Head "1. JSON 構造チェック"

$allRecords = New-Object System.Collections.Generic.List[object]   # @{ Id; Type; Layers; Prefix; SourceFile; Obj }
$recordIdSeen = @{}   # recordId -> 最初に出現したファイル（重複検出用）

if (-not (Test-Path -LiteralPath $JsonDir -PathType Container)) {
    Add-Finding '1.JSON' 'WARN' ("10-json/ ディレクトリが見つかりません: " + $JsonDir + "（棚卸し未実施の可能性）")
    $jsonFiles = @()
} else {
    $jsonFiles = @(Get-ChildItem -LiteralPath $JsonDir -Filter 'J-*.json' -File -ErrorAction SilentlyContinue)
    if ($jsonFiles.Count -eq 0) {
        Add-Finding '1.JSON' 'WARN' "10-json/ 配下に J-*.json が見つかりません（抽出がまだ実行されていません）。"
    }
}

foreach ($jf in $jsonFiles) {
    $raw = Get-Content -LiteralPath $jf.FullName -Raw -ErrorAction SilentlyContinue
    if ([string]::IsNullOrWhiteSpace($raw)) {
        Add-Finding '1.JSON' 'FAIL' ($jf.Name + ": ファイルが空です。")
        continue
    }
    $parsed = $null
    try {
        $parsed = $raw | ConvertFrom-Json
    } catch {
        Add-Finding '1.JSON' 'FAIL' ($jf.Name + ": JSON パースに失敗しました（" + $_.Exception.Message + "）。")
        continue
    }

    $records = Get-JsonRecords $parsed
    if ($records.Count -eq 0) {
        # J-01（routingPlan のみ）等、レコードを持たない JSON は正常。件数のみ通知。
        Add-Finding '1.JSON' 'OK' ($jf.Name + ": レコード0件（routingPlan 等の構成ファイルとして扱います）。")
        continue
    }

    $fileFail = 0
    foreach ($rec in $records) {
        # --- 必須キーの存在・非空 ---
        $rid   = if (Test-Prop $rec 'recordId')   { ("" + $rec.recordId).Trim() }   else { "" }
        $rtype = if (Test-Prop $rec 'recordType') { ("" + $rec.recordType).Trim() } else { "" }
        $missing = @()
        if ([string]::IsNullOrWhiteSpace($rid))   { $missing += 'recordId' }
        if ([string]::IsNullOrWhiteSpace($rtype)) { $missing += 'recordType' }
        if (-not (Test-Prop $rec 'layers'))       { $missing += 'layers' }

        $layersArr = @()
        if (Test-Prop $rec 'layers') { $layersArr = @(@($rec.layers) | Where-Object { $null -ne $_ -and ("" + $_).Trim() -ne "" }) }
        if ($layersArr.Count -eq 0 -and (Test-Prop $rec 'layers')) { $missing += 'layers(空)' }

        $srCount = 0
        if (Test-Prop $rec 'sourceRefs') { $srCount = @($rec.sourceRefs | Where-Object { $null -ne $_ }).Count }
        if ($srCount -lt 1) { $missing += 'sourceRefs(minItems:1)' }

        $label = if ([string]::IsNullOrWhiteSpace($rid)) { '(recordId 不明)' } else { $rid }

        if ($missing.Count -gt 0) {
            Add-Finding '1.JSON' 'FAIL' ($jf.Name + " / " + $label + ": 必須キー欠落または空 -> " + ($missing -join ', '))
            $fileFail++
        }

        # --- recordId の一意性 ---
        if (-not [string]::IsNullOrWhiteSpace($rid)) {
            if ($recordIdSeen.ContainsKey($rid)) {
                Add-Finding '1.JSON' 'FAIL' ("recordId 重複: " + $rid + "（" + $recordIdSeen[$rid] + " と " + $jf.Name + "）")
                $fileFail++
            } else {
                $recordIdSeen[$rid] = $jf.Name
            }
        }

        # --- enum 妥当性（recordType / layers）---
        if (-not [string]::IsNullOrWhiteSpace($rtype) -and -not $Routing.ContainsKey($rtype)) {
            Add-Finding '1.JSON' 'FAIL' ($jf.Name + " / " + $label + ": 未知の recordType '" + $rtype + "'（routing-table.md に定義がありません）。")
            $fileFail++
        }
        foreach ($ly in $layersArr) {
            $lyv = ("" + $ly).Trim()
            if ($ValidLayers -notcontains $lyv) {
                Add-Finding '1.JSON' 'FAIL' ($jf.Name + " / " + $label + ": 未知の layers 値 '" + $lyv + "'。")
                $fileFail++
            }
        }

        # 後続チェック用に集約（recordId が取れたものだけ）
        if (-not [string]::IsNullOrWhiteSpace($rid)) {
            $allRecords.Add([pscustomobject]@{
                Id         = $rid
                Type       = $rtype
                Layers     = $layersArr
                Prefix     = (Get-RecordPrefix $rid)
                SourceFile = $jf.Name
                Obj        = $rec
            }) | Out-Null
        }
    }

    if ($fileFail -eq 0) {
        Add-Finding '1.JSON' 'OK' ($jf.Name + ": レコード " + $records.Count + " 件、必須キー・一意性・enum すべて妥当。")
    }
}

Write-Host ("  -> 有効レコード総数: " + $allRecords.Count) -ForegroundColor Gray

# =====================================================================================
# spec/ の Markdown を1回だけ読み込み、以降のチェックで共有する
# =====================================================================================
$specFiles   = @(Get-ChildItem -LiteralPath $SpecDirFull -Recurse -Filter '*.md' -File -ErrorAction SilentlyContinue)
$specContent = @{}   # FullName -> content
foreach ($sf in $specFiles) {
    $c = Get-Content -LiteralPath $sf.FullName -Raw -ErrorAction SilentlyContinue
    if ($null -eq $c) { $c = "" }
    $specContent[$sf.FullName] = $c
}

# =====================================================================================
# 2. ルーティング整合: 各レコードの責務に対応する spec/ ファイル（またはディレクトリ）が存在するか
# =====================================================================================
Write-Head "2. ルーティング整合チェック"

$reportedRoute = New-Object System.Collections.Generic.HashSet[string]   # 同一 期待先 の重複報告抑止
$routeOk = 0

function Test-AnyFileInDir {
    param([string] $Dir, [string] $Pattern = '*.md', [string] $Exclude = $null)
    if (-not (Test-Path -LiteralPath $Dir -PathType Container)) { return $false }
    $items = @(Get-ChildItem -LiteralPath $Dir -Recurse -Filter $Pattern -File -ErrorAction SilentlyContinue)
    if ($Exclude) { $items = @($items | Where-Object { $_.Name -ne $Exclude }) }
    return ($items.Count -gt 0)
}

foreach ($r in $allRecords) {
    if ([string]::IsNullOrWhiteSpace($r.Type) -or -not $Routing.ContainsKey($r.Type)) { continue }
    $route = $Routing[$r.Type]
    $kind  = $route.Kind
    $ok    = $false
    $expectDesc = ""

    switch ($kind) {
        { $_ -in @('front', 'back', 'batch') } {
            $candidates = @()
            foreach ($f in ($route.File -split '\|')) {
                $candidates += (Join-Path (Join-Path (Join-Path $SpecDirFull $kind) $r.Prefix) $f)
            }
            $expectDesc = ($candidates | ForEach-Object { Get-SpecRelPath $_ $SpecDirFull }) -join ' または '
            foreach ($c in $candidates) { if (Test-Path -LiteralPath $c -PathType Leaf) { $ok = $true; break } }
        }
        'io-context' {
            # external_interface: バッチ文脈 -> batch/<ID>/io.md、画面文脈 -> back/<ID>/methods.md
            $isBatch = ($r.Layers -contains 'batch')
            if ($isBatch) {
                $c = Join-Path (Join-Path (Join-Path $SpecDirFull 'batch') $r.Prefix) 'io.md'
            } else {
                $c = Join-Path (Join-Path (Join-Path $SpecDirFull 'back') $r.Prefix) 'methods.md'
            }
            $expectDesc = Get-SpecRelPath $c $SpecDirFull
            $ok = (Test-Path -LiteralPath $c -PathType Leaf)
        }
        'db' {
            # テーブル物理名は recordId 接頭辞では解決できないため、レコード内フィールドから緩やかに解決する。
            $tbl = Get-FirstProp $r.Obj @('table', 'tableName', 'tablePhysicalName', 'physicalName', 'physicalTable', 'entity', 'entityName')
            if ($tbl) {
                $c = Join-Path (Join-Path $SpecDirFull 'db') ($tbl + '.md')
                $expectDesc = Get-SpecRelPath $c $SpecDirFull
                $ok = (Test-Path -LiteralPath $c -PathType Leaf)
            } else {
                # テーブル名不明: db/ にテーブル定義（_er-overview.md 以外）が1つでもあれば OK 扱い
                $expectDesc = 'spec/db/<テーブル物理名>.md'
                $ok = Test-AnyFileInDir (Join-Path $SpecDirFull 'db') '*.md' '_er-overview.md'
            }
        }
        'er' {
            $c = Join-Path (Join-Path $SpecDirFull 'db') '_er-overview.md'
            $expectDesc = Get-SpecRelPath $c $SpecDirFull
            $ok = (Test-Path -LiteralPath $c -PathType Leaf)
        }
        'perm' {
            $expectDesc = 'spec/common/permissions/'
            $ok = Test-AnyFileInDir (Join-Path (Join-Path $SpecDirFull 'common') 'permissions')
        }
        'common' {
            $naming = Join-Path (Join-Path $SpecDirFull 'common') 'naming.md'
            $codes  = Join-Path (Join-Path $SpecDirFull 'common') 'codes'
            $expectDesc = 'spec/common/naming.md または spec/common/codes/*.md'
            $ok = (Test-Path -LiteralPath $naming -PathType Leaf) -or (Test-AnyFileInDir $codes)
        }
        'rules' {
            $expectDesc = 'spec/rules/BR-*.md'
            $ok = Test-AnyFileInDir (Join-Path $SpecDirFull 'rules') 'BR-*.md'
        }
        'asset' {
            # アセットは spec 外（runs/<ID>/00-input/assets/）。RunDir 側を確認する。
            $adir = Join-Path (Join-Path $RunDirFull '00-input') 'assets'
            $expectDesc = 'runs/' + $RunId + '/00-input/assets/'
            $ok = (Test-Path -LiteralPath $adir -PathType Container)
        }
    }

    if ($ok) {
        $routeOk++
    } else {
        $key = $r.Type + '=>' + $expectDesc
        if ($reportedRoute.Add($key)) {
            Add-Finding '2.ROUTE' 'WARN' ("responsibility 未生成: recordType '" + $r.Type + "' の出力先が見つかりません -> " + $expectDesc)
        }
    }
}

if ($allRecords.Count -gt 0 -and $reportedRoute.Count -eq 0) {
    Add-Finding '2.ROUTE' 'OK' ("全レコードの責務に対応する spec/ 出力先が存在します（" + $routeOk + " 件）。")
} elseif ($allRecords.Count -eq 0) {
    Add-Finding '2.ROUTE' 'OK' "対象レコードがないためスキップします。"
}

# =====================================================================================
# 3. トレース照合: 全 recordId が spec/ 配下（trace 含む）に出現するか（件数照合の機械化）
#    決定#3: 数え上げをモデルにやらせない。ここで機械的に照合する。
# =====================================================================================
Write-Head "3. トレース照合チェック"

$recordIdToFiles = @{}   # recordId -> [表示用相対パス...]
foreach ($r in $allRecords) { $recordIdToFiles[$r.Id] = New-Object System.Collections.Generic.List[string] }

foreach ($sf in $specFiles) {
    $content = $specContent[$sf.FullName]
    if ([string]::IsNullOrEmpty($content)) { continue }
    $rel = Get-SpecRelPath $sf.FullName $SpecDirFull
    foreach ($r in $allRecords) {
        if ($content.Contains($r.Id)) { $recordIdToFiles[$r.Id].Add($rel) | Out-Null }
    }
}

$traceMissing = 0
foreach ($r in $allRecords) {
    if ($recordIdToFiles[$r.Id].Count -eq 0) {
        Add-Finding '3.TRACE' 'FAIL' ("トレース欠落: recordId '" + $r.Id + "'（" + $r.SourceFile + "）が spec/ のどこにも出現しません。")
        $traceMissing++
    }
}
if ($allRecords.Count -gt 0 -and $traceMissing -eq 0) {
    Add-Finding '3.TRACE' 'OK' ("全 " + $allRecords.Count + " 件の recordId が spec/ 配下に出現します。")
} elseif ($allRecords.Count -eq 0) {
    Add-Finding '3.TRACE' 'OK' "対象レコードがないためスキップします。"
}

# =====================================================================================
# 4. リンク実在: spec/ 内の相対リンク先（Markdown リンク・画像）が実在するか
# =====================================================================================
Write-Head "4. リンク実在チェック"

$linkRegex = [regex]'\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)'
$linkBroken = 0
$linkChecked = 0

foreach ($sf in $specFiles) {
    $content = $specContent[$sf.FullName]
    if ([string]::IsNullOrEmpty($content)) { continue }
    $rel = Get-SpecRelPath $sf.FullName $SpecDirFull
    $linkMatches = $linkRegex.Matches($content)
    foreach ($m in $linkMatches) {
        $target = $m.Groups[1].Value.Trim()
        if ([string]::IsNullOrWhiteSpace($target)) { continue }
        # 外部URL・アンカーのみ・メールはスキップ
        if ($target -match '^(https?:|mailto:|#|data:|tel:)') { continue }
        # アンカー部を除去
        $path = ($target -split '#', 2)[0]
        if ([string]::IsNullOrWhiteSpace($path)) { continue }
        $linkChecked++
        $resolved = Join-Path (Split-Path -Parent $sf.FullName) $path
        if (-not (Test-Path -LiteralPath $resolved)) {
            Add-Finding '4.LINK' 'WARN' ("リンク切れ: " + $rel + " -> '" + $target + "'（解決先が存在しません）。")
            $linkBroken++
        }
    }
}
if ($linkChecked -eq 0) {
    Add-Finding '4.LINK' 'OK' "検査対象の相対リンクはありません。"
} elseif ($linkBroken -eq 0) {
    Add-Finding '4.LINK' 'OK' ("相対リンク " + $linkChecked + " 件すべて実在します。")
}

# =====================================================================================
# 5. lint: front-matter 必須キー / 仕様表の必須列（Record ID・出典）
#    テンプレート個別の必須セクション一覧は contracts/markdown/T-*.template.md 側が正本のため、
#    ここでは全 spec 共通で機械判定できる項目（front-matter・仕様表の必須列）に限定する。
# =====================================================================================
Write-Head "5. lint チェック"

$fmRequired = @('id', 'generatedFrom', 'generatedAt', 'model', 'provisional')
# 「仕様表（Record ID・出典 列が必須）」を持つべき spec ファイル名（BRIEF §7）
$specTableFiles = @('items.md', 'validation.md', 'queries.md', 'methods.md', 'logic.md', 'control.md', 'io.md')
$lintIssues = 0

foreach ($sf in $specFiles) {
    $content = $specContent[$sf.FullName]
    $rel = Get-SpecRelPath $sf.FullName $SpecDirFull

    # --- front-matter 抽出（先頭の --- ... --- ブロック）---
    $fm = ""
    $fmMatch = [regex]::Match($content, '(?s)\A\uFEFF?---\r?\n(.*?)\r?\n---\r?\n')
    if ($fmMatch.Success) { $fm = $fmMatch.Groups[1].Value }

    if (-not $fmMatch.Success) {
        Add-Finding '5.LINT' 'WARN' ($rel + ": front-matter（--- で囲む YAML）が見つかりません。")
        $lintIssues++
    } else {
        $miss = @()
        foreach ($k in $fmRequired) {
            if (-not [regex]::IsMatch($fm, ('(?m)^\s*' + [regex]::Escape($k) + '\s*:'))) { $miss += $k }
        }
        if ($miss.Count -gt 0) {
            Add-Finding '5.LINT' 'WARN' ($rel + ": front-matter 必須キー欠落 -> " + ($miss -join ', '))
            $lintIssues++
        }
    }

    # --- 仕様表の必須列（Record ID / 出典）---
    $base = Split-Path -Leaf $sf.FullName
    $isDbTable = ($rel -match '/db/' -and $base -ne '_er-overview.md')
    if ($specTableFiles -contains $base -or $isDbTable) {
        # テンプレートは半角/全角スペースゆらぎがありうるため緩めに判定
        $hasRecordIdCol = ($content -match 'Record\s*ID') -or ($content.Contains('RecordID'))
        $hasSourceCol   = $content.Contains('出典')
        if (-not $hasRecordIdCol -or -not $hasSourceCol) {
            $lack = @()
            if (-not $hasRecordIdCol) { $lack += 'Record ID 列' }
            if (-not $hasSourceCol)   { $lack += '出典 列' }
            Add-Finding '5.LINT' 'WARN' ($rel + ": 仕様表の必須列が見当たりません -> " + ($lack -join ', '))
            $lintIssues++
        }
    }
}
if ($specFiles.Count -eq 0) {
    Add-Finding '5.LINT' 'WARN' "spec/ 配下に *.md がありません（生成前の可能性）。"
} elseif ($lintIssues -eq 0) {
    Add-Finding '5.LINT' 'OK' ("front-matter・仕様表の必須列すべて妥当（" + $specFiles.Count + " ファイル）。")
}

# =====================================================================================
# 6. 矛盾検出: db/{テーブル物理名}.md の同一カラム物理名に、型・桁の矛盾がないか
#    共有領域（db/）の両論併記を機械的に拾い、人間の判断へ回す（BRIEF §6）。
# =====================================================================================
Write-Head "6. 矛盾検出チェック（db/ 型・桁）"

$dbDir = Join-Path $SpecDirFull 'db'
$contradictions = 0
if (Test-Path -LiteralPath $dbDir -PathType Container) {
    $dbFiles = @(Get-ChildItem -LiteralPath $dbDir -Filter '*.md' -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne '_er-overview.md' })
    foreach ($db in $dbFiles) {
        $content = $specContent[$db.FullName]
        if ([string]::IsNullOrEmpty($content)) { continue }
        $rel = Get-SpecRelPath $db.FullName $SpecDirFull

        # Markdown 表を走査し、ヘッダに「物理名」「型」を含む表を対象にする（カラム定義表）。
        $lines = $content -split '\r?\n'
        $colMap = @{}   # 物理名 -> [ @{型;桁;line} ... ]
        $inTable = $false
        $idxName = -1; $idxType = -1; $idxLen = -1
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]
            if ($line -match '^\s*\|' -and $line -match '\|.*\|') {
                $cells = @(($line.Trim().Trim('|')) -split '\|' | ForEach-Object { $_.Trim() })
                # 区切り行（---）はスキップ
                if (($cells -join '') -match '^[:\-\s]*$') { continue }
                if (-not $inTable) {
                    # ヘッダ行の可能性: 物理名 と 型 を含むか
                    $idxName = -1; $idxType = -1; $idxLen = -1
                    for ($c = 0; $c -lt $cells.Count; $c++) {
                        if ($cells[$c] -match '物理名') { $idxName = $c }
                        elseif ($cells[$c] -match '^型$' -or $cells[$c] -match 'データ型' -or $cells[$c] -eq '型') { if ($idxType -lt 0) { $idxType = $c } }
                        elseif ($cells[$c] -match '桁' -or $cells[$c] -match '長') { if ($idxLen -lt 0) { $idxLen = $c } }
                    }
                    if ($idxName -ge 0 -and $idxType -ge 0) { $inTable = $true }
                    continue
                } else {
                    # データ行
                    if ($idxName -lt $cells.Count) {
                        $name = $cells[$idxName]
                        if ([string]::IsNullOrWhiteSpace($name) -or $name -match '^\{\{') { continue }  # テンプレのプレースホルダ除外
                        $type = if ($idxType -ge 0 -and $idxType -lt $cells.Count) { $cells[$idxType] } else { "" }
                        $len  = if ($idxLen -ge 0 -and $idxLen -lt $cells.Count) { $cells[$idxLen] } else { "" }
                        if (-not $colMap.ContainsKey($name)) { $colMap[$name] = New-Object System.Collections.Generic.List[object] }
                        $colMap[$name].Add([pscustomobject]@{ Type = $type; Len = $len }) | Out-Null
                    }
                }
            } else {
                $inTable = $false   # 表の外に出た
            }
        }

        foreach ($name in $colMap.Keys) {
            $defs = $colMap[$name]
            $types = @($defs | ForEach-Object { $_.Type } | Where-Object { $_ -ne "" -and $_ -notmatch '^\{\{' } | Select-Object -Unique)
            $lens  = @($defs | ForEach-Object { $_.Len }  | Where-Object { $_ -ne "" -and $_ -notmatch '^\{\{' } | Select-Object -Unique)
            if ($types.Count -gt 1 -or $lens.Count -gt 1) {
                $desc = ""
                if ($types.Count -gt 1) { $desc += ("型=[" + ($types -join ' / ') + "] ") }
                if ($lens.Count -gt 1)  { $desc += ("桁=[" + ($lens -join ' / ') + "]") }
                Add-Finding '6.CONFLICT' 'WARN' ($rel + ": カラム '" + $name + "' の定義が矛盾しています（" + $desc.Trim() + "）。両論併記のまま人間が確認してください。")
                $contradictions++
            }
        }
    }
    if ($contradictions -eq 0) {
        Add-Finding '6.CONFLICT' 'OK' "db/ の同一カラム型・桁に矛盾は検出されませんでした。"
    }
} else {
    Add-Finding '6.CONFLICT' 'OK' "spec/db/ が存在しないためスキップします。"
}

# =====================================================================================
# 7. 逆引きマップ生成: recordId->spec ファイル / テーブル->機能ID を 20-check/reverse-map.md へ
# =====================================================================================
Write-Head "7. 逆引きマップ生成"

# テーブル -> 機能ID（接頭辞）の集約
$tableToFeatures = @{}
function Add-TableFeature {
    param([string] $Table, [string] $Feature)
    if ([string]::IsNullOrWhiteSpace($Table)) { return }
    if (-not $tableToFeatures.ContainsKey($Table)) { $tableToFeatures[$Table] = New-Object System.Collections.Generic.HashSet[string] }
    if (-not [string]::IsNullOrWhiteSpace($Feature)) { $tableToFeatures[$Table].Add($Feature) | Out-Null }
}
foreach ($r in $allRecords) {
    if (-not $Routing.ContainsKey($r.Type)) { continue }
    $kind = $Routing[$r.Type].Kind
    if ($kind -eq 'db') {
        $tbl = Get-FirstProp $r.Obj @('table', 'tableName', 'tablePhysicalName', 'physicalName', 'physicalTable', 'entity', 'entityName')
        if ($tbl) { Add-TableFeature $tbl $r.Prefix }
    } elseif ($r.Type -eq 'entity_relation') {
        $lt = Get-FirstProp $r.Obj @('leftTable')
        $rt = Get-FirstProp $r.Obj @('rightTable')
        Add-TableFeature $lt $r.Prefix
        Add-TableFeature $rt $r.Prefix
    }
}

$rmLines = New-Object System.Collections.Generic.List[string]
$rmLines.Add('# 逆引きマップ（' + $RunId + '）') | Out-Null
$rmLines.Add('') | Out-Null
$rmLines.Add('> verify.ps1 が自動生成。手で編集しないこと（再実行で上書きされます）。生成日時: ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')) | Out-Null
$rmLines.Add('') | Out-Null
$rmLines.Add('## 1. recordId → spec ファイル') | Out-Null
$rmLines.Add('') | Out-Null
$rmLines.Add('| recordId | recordType | 出現 spec ファイル |') | Out-Null
$rmLines.Add('|---|---|---|') | Out-Null
foreach ($r in ($allRecords | Sort-Object Id)) {
    $files = $recordIdToFiles[$r.Id]
    $filesText = if ($files.Count -gt 0) { ($files | Select-Object -Unique) -join '<br>' } else { '（出現なし）' }
    $rmLines.Add('| ' + $r.Id + ' | ' + $r.Type + ' | ' + $filesText + ' |') | Out-Null
}
$rmLines.Add('') | Out-Null
$rmLines.Add('## 2. テーブル → 機能ID') | Out-Null
$rmLines.Add('') | Out-Null
if ($tableToFeatures.Count -eq 0) {
    $rmLines.Add('（db 系レコード・entity_relation からテーブル名を解決できませんでした。設計書側のテーブル名フィールドを確認してください。）') | Out-Null
} else {
    $rmLines.Add('| テーブル物理名 | 参照している機能ID |') | Out-Null
    $rmLines.Add('|---|---|') | Out-Null
    foreach ($t in ($tableToFeatures.Keys | Sort-Object)) {
        $feat = (@($tableToFeatures[$t]) | Sort-Object) -join ', '
        $rmLines.Add('| ' + $t + ' | ' + $feat + ' |') | Out-Null
    }
}
$reverseMapPath = Join-Path $CheckDir 'reverse-map.md'
try {
    Set-Content -LiteralPath $reverseMapPath -Value ($rmLines -join [Environment]::NewLine) -Encoding UTF8
    Add-Finding '7.REVMAP' 'OK' ("逆引きマップを生成しました: " + $reverseMapPath)
} catch {
    Add-Finding '7.REVMAP' 'WARN' ("逆引きマップの書き込みに失敗しました: " + $_.Exception.Message)
}

# =====================================================================================
# 集計・出力
# =====================================================================================
$failCount = @($script:Findings | Where-Object { $_.Severity -eq 'FAIL' }).Count
$warnCount = @($script:Findings | Where-Object { $_.Severity -eq 'WARN' }).Count
$okCount   = @($script:Findings | Where-Object { $_.Severity -eq 'OK' }).Count

Write-Head "結果サマリ"
Write-Host ("  OK  : " + $okCount) -ForegroundColor Green
Write-Host ("  WARN: " + $warnCount) -ForegroundColor Yellow
Write-Host ("  FAIL: " + $failCount) -ForegroundColor Red

# --- -Report 指定時: recordId ごとの出現 spec ファイルを詳細表示 ---
if ($Report) {
    Write-Head "詳細レポート（-Report）"
    foreach ($r in ($allRecords | Sort-Object Id)) {
        $files = $recordIdToFiles[$r.Id]
        $filesText = if ($files.Count -gt 0) { ($files | Select-Object -Unique) -join ', ' } else { '(出現なし)' }
        $color = if ($files.Count -gt 0) { 'Gray' } else { 'Red' }
        Write-Host ("  " + $r.Id + " [" + $r.Type + "] -> " + $filesText) -ForegroundColor $color
    }
}

# --- verify-result.md 生成 ---
$vrLines = New-Object System.Collections.Generic.List[string]
$vrLines.Add('# verify 結果（' + $RunId + '）') | Out-Null
$vrLines.Add('') | Out-Null
$vrLines.Add('- 生成日時: ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')) | Out-Null
$vrLines.Add('- RunDir: ' + $RunDirFull) | Out-Null
$vrLines.Add('- SpecDir: ' + $SpecDirFull) | Out-Null
$vrLines.Add('- 有効レコード: ' + $allRecords.Count + ' 件 / spec ファイル: ' + $specFiles.Count + ' 件') | Out-Null
$overall = if ($failCount -gt 0) { 'FAIL' } elseif ($warnCount -gt 0) { 'PASS_WITH_WARNINGS' } else { 'OK' }
$vrLines.Add('- 総合判定: **' + $overall + '**（OK ' + $okCount + ' / WARN ' + $warnCount + ' / FAIL ' + $failCount + '）') | Out-Null
$vrLines.Add('') | Out-Null
$vrLines.Add('> FAIL=機械的に壊れている（要修正で /02-run 再実行）。WARN=人間の判断に委ねる（非ブロッキング）。') | Out-Null
$vrLines.Add('') | Out-Null
$vrLines.Add('| チェック | 判定 | 内容 |') | Out-Null
$vrLines.Add('|---|---|---|') | Out-Null
foreach ($f in $script:Findings) {
    $msg = ($f.Message -replace '\|', '\|') -replace '\r?\n', ' '
    $vrLines.Add('| ' + $f.Check + ' | ' + $f.Severity + ' | ' + $msg + ' |') | Out-Null
}
$verifyResultPath = Join-Path $CheckDir 'verify-result.md'
try {
    Set-Content -LiteralPath $verifyResultPath -Value ($vrLines -join [Environment]::NewLine) -Encoding UTF8
    Write-Host ("  verify-result.md を生成: " + $verifyResultPath) -ForegroundColor Gray
} catch {
    Write-Host ("  verify-result.md の書き込みに失敗: " + $_.Exception.Message) -ForegroundColor Yellow
}

# --- warnings.md への追記（未解消の FAIL / WARN）---
$warningsPath = Join-Path $CheckDir 'warnings.md'
$toAppend = @($script:Findings | Where-Object { $_.Severity -eq 'FAIL' -or $_.Severity -eq 'WARN' })
if ($toAppend.Count -gt 0) {
    $existing = ""
    if (Test-Path -LiteralPath $warningsPath -PathType Leaf) {
        $existing = Get-Content -LiteralPath $warningsPath -Raw -ErrorAction SilentlyContinue
        if ($null -eq $existing) { $existing = "" }
    } else {
        # T-warnings 形式で新規作成（BRIEF §7）
        $head = New-Object System.Collections.Generic.List[string]
        $head.Add('---') | Out-Null
        $head.Add('id: "' + $RunId + '"') | Out-Null
        $head.Add('generatedFrom:') | Out-Null
        $head.Add('  - "verify.ps1"') | Out-Null
        $head.Add('generatedAt: "' + (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss') + '"') | Out-Null
        $head.Add('model: "なし（verify.ps1・機械照合）"') | Out-Null
        $head.Add('provisional: false') | Out-Null
        $head.Add('---') | Out-Null
        $head.Add('') | Out-Null
        $head.Add('# 未解消警告一覧（' + $RunId + '）') | Out-Null
        $head.Add('') | Out-Null
        $head.Add('| # | 種別 | 内容 | 発生工程 | 状態 |') | Out-Null
        $head.Add('|---|---|---|---|---|') | Out-Null
        Set-Content -LiteralPath $warningsPath -Value (($head -join [Environment]::NewLine) + [Environment]::NewLine) -Encoding UTF8
        $existing = Get-Content -LiteralPath $warningsPath -Raw -ErrorAction SilentlyContinue
        if ($null -eq $existing) { $existing = "" }
    }

    # 既存の最大連番を求める
    $maxIdx = 0
    foreach ($ml in ($existing -split '\r?\n')) {
        $mm = [regex]::Match($ml, '^\s*\|\s*(\d+)\s*\|')
        if ($mm.Success) {
            $n = [int]$mm.Groups[1].Value
            if ($n -gt $maxIdx) { $maxIdx = $n }
        }
    }

    $appended = 0
    $newRows = New-Object System.Collections.Generic.List[string]
    foreach ($f in $toAppend) {
        # 種別: FAIL・矛盾検出以外の機械 WARN は近い enum が無いため「機械FAIL」を用いる（BRIEF疑義参照）
        $kubun = if ($f.Check -eq '6.CONFLICT') { '矛盾検出' } else { '機械FAIL' }
        $content = ($f.Check + ': ' + $f.Message) -replace '\|', '\|' -replace '\r?\n', ' '
        # 同一内容が未解消で既存にあれば重複追記しない（再実行時のノイズ抑止）
        if ($existing.Contains($content)) { continue }
        $maxIdx++
        $newRows.Add('| ' + $maxIdx + ' | ' + $kubun + ' | ' + $content + ' | verify.ps1 | 未解消 |') | Out-Null
        $appended++
    }
    if ($appended -gt 0) {
        Add-Content -LiteralPath $warningsPath -Value ($newRows -join [Environment]::NewLine) -Encoding UTF8
        Write-Host ("  warnings.md に " + $appended + " 件の未解消警告を追記: " + $warningsPath) -ForegroundColor Gray
    } else {
        Write-Host "  warnings.md への新規追記はありません（既存と重複）。" -ForegroundColor Gray
    }
}

Write-Host ""
if ($failCount -gt 0) {
    Write-Host ("判定: FAIL（機械的な破損が " + $failCount + " 件）。/02-run を再実行して修正してください。") -ForegroundColor Red
    exit 1
} else {
    if ($warnCount -gt 0) {
        Write-Host ("判定: OK（WARN " + $warnCount + " 件は非ブロッキング。warnings.md と /03-check で確認してください）。") -ForegroundColor Yellow
    } else {
        Write-Host "判定: OK（機械照合クリア）。次は /03-check（別チャット）で意味照合を行ってください。" -ForegroundColor Green
    }
    exit 0
}
