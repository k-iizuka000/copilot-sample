#requires -Version 5.0
<#
.SYNOPSIS
  Excel 設計書1冊を解釈ゼロの全量ダンプ（1シート=1 JSON + manifest.json）へ変換する。

.DESCRIPTION
  契約正本: references/dump-contract.md（dumpFormatVersion 1.0.0）
  構造 = 純 OpenXML（ZIP+XML）、表示文字列 = Excel COM の Range.Text。
  対応環境: Windows PowerShell 5.1（PSEdition Desktop）+ デスクトップ版 Excel。
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BookPath,

    [Parameter(Mandatory = $false)]
    [string]$OutDir = '',

    [Parameter(Mandatory = $false)]
    [int]$ShapeWarnThreshold = 10
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:DumpFormatVersion = '1.0.0'
$script:ToolVersion = '0.1.0'
$script:DeclarationSheetName = '_シート役割表'
$script:EnvExclusiveMessage = 'extract.ps1 は Windows PowerShell 5.1 ＋ Excel（COM）環境専用です'
$script:ExitCode = 1
$script:TempDumpDir = $null
$script:FinalDumpDir = $null

# SpreadsheetML / DrawingML / VML / relationships
$script:NsMain = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
$script:NsRelPkg = 'http://schemas.openxmlformats.org/package/2006/relationships'
$script:NsRelOd = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
$script:NsXdr = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing'
$script:NsA = 'http://schemas.openxmlformats.org/drawingml/2006/main'
$script:NsVml = 'urn:schemas-microsoft-com:vml'
$script:NsOffice = 'urn:schemas-microsoft-com:office:office'
$script:NsExcelVml = 'urn:schemas-microsoft-com:office:excel'
$script:NsThreadedComments = 'http://schemas.microsoft.com/office/spreadsheetml/2018/threadedcomments'

$script:ImpactTargets = @(
    'フロント-画面項目',
    'フロント-レイアウト',
    'フロント-入力チェック',
    'バック-処理',
    'バック-検索・更新',
    'バッチ-制御',
    'バッチ-入出力',
    'DB定義',
    '共通・規約',
    '権限',
    '対象外'
)

# 契約 7.2 許可正規表現（空白差のみ許容）
$script:AddressIdiomRegex = '^\s*ADDRESS\(\s*ROW\(\s*(?:''(?<s1>[^'']+)''|(?<s1b>[^''!,()\s]+))!\$?(?<c1>[A-Z]{1,3})\$?(?<r1>[1-9][0-9]{0,6})\s*\)\s*,\s*COLUMN\(\s*(?:''(?<s2>[^'']+)''|(?<s2b>[^''!,()\s]+))!\$?(?<c2>[A-Z]{1,3})\$?(?<r2>[1-9][0-9]{0,6})\s*\)\s*\)\s*&\s*":"\s*&\s*ADDRESS\(\s*ROW\(\s*(?:''(?<s3>[^'']+)''|(?<s3b>[^''!,()\s]+))!\$?(?<c3>[A-Z]{1,3})\$?(?<r3>[1-9][0-9]{0,6})\s*\)\s*,\s*COLUMN\(\s*(?:''(?<s4>[^'']+)''|(?<s4b>[^''!,()\s]+))!\$?(?<c4>[A-Z]{1,3})\$?(?<r4>[1-9][0-9]{0,6})\s*\)\s*\)\s*$'

# =============================================================================
# 共通ユーティリティ
# =============================================================================

function New-ArrayList {
    return New-Object System.Collections.ArrayList
}

function Add-ToList {
    param(
        [Parameter(Mandatory = $true)]
        [System.Collections.ArrayList]$List,
        [Parameter(Mandatory = $true)]
        $Item
    )
    [void]$List.Add($Item)
}

function ConvertTo-ContractJson {
    param(
        [Parameter(Mandatory = $true)]
        $InputObject
    )
    # Depth 10 以上。配列は ArrayList で保持し単一要素の自動アンラップを防ぐ。
    return (ConvertTo-Json -InputObject $InputObject -Depth 20 -Compress:$false)
}

function Write-Utf8NoBomFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Content
    )
    $normalized = $Content -replace "`r`n", "`n" -replace "`r", "`n"
    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $normalized, $encoding)
}

function Get-FileSha256Hex {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $stream = [System.IO.File]::OpenRead($Path)
        try {
            $hash = $sha.ComputeHash($stream)
            $sb = New-Object System.Text.StringBuilder
            foreach ($b in $hash) {
                [void]$sb.Append($b.ToString('x2'))
            }
            return $sb.ToString()
        }
        finally {
            $stream.Dispose()
        }
    }
    finally {
        $sha.Dispose()
    }
}

function ConvertTo-ColumnLetter {
    param(
        [Parameter(Mandatory = $true)]
        [int]$Index1Based
    )
    if ($Index1Based -lt 1) {
        throw "列番号が不正です: $Index1Based"
    }
    $n = $Index1Based
    $chars = New-Object System.Collections.ArrayList
    while ($n -gt 0) {
        $n--
        [void]$chars.Insert(0, [char](65 + ($n % 26)))
        $n = [int][math]::Floor($n / 26)
    }
    return (-join [char[]]@($chars.ToArray()))
}

function ConvertFrom-ColumnLetter {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Letter
    )
    $upper = $Letter.ToUpperInvariant()
    $n = 0
    foreach ($ch in $upper.ToCharArray()) {
        if ($ch -lt 'A' -or $ch -gt 'Z') {
            throw "列レターが不正です: $Letter"
        }
        $n = ($n * 26) + ([int][char]$ch - 64)
    }
    return $n
}

function Split-A1Address {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Address
    )
    if ($Address -notmatch '^\$?([A-Za-z]{1,3})\$?([1-9][0-9]{0,6})$') {
        throw "A1 番地が不正です: $Address"
    }
    return @{
        ColLetter = $Matches[1].ToUpperInvariant()
        ColIndex  = (ConvertFrom-ColumnLetter -Letter $Matches[1])
        RowIndex  = [int]$Matches[2]
    }
}

function Get-SanitizedSheetBaseName {
    param(
        [Parameter(Mandatory = $true)]
        [string]$SheetName
    )
    $invalid = [char[]]@('\', '/', ':', '*', '?', '"', '<', '>', '|')
    $s = $SheetName
    foreach ($ch in $invalid) {
        $s = $s.Replace([string]$ch, '_')
    }
    $sb = New-Object System.Text.StringBuilder
    foreach ($c in $s.ToCharArray()) {
        if ([int][char]$c -lt 32) {
            [void]$sb.Append('_')
        }
        else {
            [void]$sb.Append($c)
        }
    }
    $s = $sb.ToString().TrimEnd([char[]]@(' ', '.'))
    if ($s.Length -gt 50) {
        $s = $s.Substring(0, 50)
    }
    if ([string]::IsNullOrWhiteSpace($s)) {
        $s = 'sheet'
    }
    return $s
}

function Release-ComRef {
    param($ComObject)
    if ($null -eq $ComObject) {
        return
    }
    try {
        [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($ComObject)
    }
    catch {
        # 解放失敗は握りつぶし（finally での後始末優先）
    }
}

function Stop-WithExitCode {
    param(
        [Parameter(Mandatory = $true)]
        [int]$Code,
        [Parameter(Mandatory = $true)]
        [string]$Message
    )
    $script:ExitCode = $Code
    Write-Error -Message $Message -ErrorAction Continue
    throw (New-Object System.Exception("EXIT:$Code"))
}

# =============================================================================
# 1章: 実行環境ガード
# =============================================================================

function Test-SupportedRuntime {
    # #requires -PSEdition は使わない。$PSVersionTable と標準 .NET のみ。
    $platform = [System.Environment]::OSVersion.Platform
    if ($platform -ne [System.PlatformID]::Win32NT) {
        return $false
    }
    $edition = $null
    if ($PSVersionTable.ContainsKey('PSEdition')) {
        $edition = [string]$PSVersionTable['PSEdition']
    }
    if ($edition -ne 'Desktop') {
        return $false
    }
    if ([int]$PSVersionTable.PSVersion.Major -ne 5) {
        return $false
    }
    return $true
}

function Assert-SupportedRuntime {
    if (-not (Test-SupportedRuntime)) {
        Stop-WithExitCode -Code 10 -Message $script:EnvExclusiveMessage
    }
}

function Assert-InputArguments {
    if ([string]::IsNullOrWhiteSpace($BookPath)) {
        Stop-WithExitCode -Code 10 -Message 'BookPath が空です。'
    }
    $resolvedBook = $BookPath
    if (-not [System.IO.Path]::IsPathRooted($resolvedBook)) {
        $resolvedBook = Join-Path -Path (Get-Location).Path -ChildPath $resolvedBook
    }
    $script:ResolvedBookPath = [System.IO.Path]::GetFullPath($resolvedBook)
    if (-not (Test-Path -LiteralPath $script:ResolvedBookPath -PathType Leaf)) {
        Stop-WithExitCode -Code 10 -Message "入力ブックが存在しません: $([System.IO.Path]::GetFileName($script:ResolvedBookPath))"
    }
    $ext = [System.IO.Path]::GetExtension($script:ResolvedBookPath)
    if ($ext -ne '.xlsx') {
        Stop-WithExitCode -Code 10 -Message '入力は .xlsx のみ対応です。'
    }
    if ($ShapeWarnThreshold -lt 1) {
        Stop-WithExitCode -Code 10 -Message 'ShapeWarnThreshold は 1 以上である必要があります。'
    }

    if ([string]::IsNullOrWhiteSpace($OutDir)) {
        $dir = [System.IO.Path]::GetDirectoryName($script:ResolvedBookPath)
        $base = [System.IO.Path]::GetFileNameWithoutExtension($script:ResolvedBookPath)
        $script:FinalDumpDir = Join-Path -Path $dir -ChildPath ($base + '.dump')
    }
    else {
        $resolvedOut = $OutDir
        if (-not [System.IO.Path]::IsPathRooted($resolvedOut)) {
            $resolvedOut = Join-Path -Path (Get-Location).Path -ChildPath $resolvedOut
        }
        $script:FinalDumpDir = [System.IO.Path]::GetFullPath($resolvedOut)
    }

    if (Test-Path -LiteralPath $script:FinalDumpDir) {
        Stop-WithExitCode -Code 10 -Message "出力先ディレクトリが既に存在します: $([System.IO.Path]::GetFileName($script:FinalDumpDir))"
    }
}

# =============================================================================
# OpenXML 読み取り基盤
# =============================================================================

function Open-XlsxArchive {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    return [System.IO.Compression.ZipFile]::OpenRead($Path)
}

function Get-ZipEntryText {
    param(
        [Parameter(Mandatory = $true)]
        [System.IO.Compression.ZipArchive]$Archive,
        [Parameter(Mandatory = $true)]
        [string]$EntryPath
    )
    $normalized = $EntryPath.Replace('\', '/').TrimStart('/')
    $entry = $Archive.GetEntry($normalized)
    if ($null -eq $entry) {
        return $null
    }
    $stream = $entry.Open()
    try {
        $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8, $true)
        try {
            return $reader.ReadToEnd()
        }
        finally {
            $reader.Dispose()
        }
    }
    finally {
        $stream.Dispose()
    }
}

function ConvertTo-XmlDocument {
    param(
        [Parameter(Mandatory = $true)]
        [string]$XmlText
    )
    $doc = New-Object System.Xml.XmlDocument
    $doc.PreserveWhitespace = $false
    $doc.XmlResolver = $null
    $doc.LoadXml($XmlText)
    return $doc
}

function New-XmlNsManager {
    param(
        [Parameter(Mandatory = $true)]
        [System.Xml.XmlDocument]$Document
    )
    $ns = New-Object System.Xml.XmlNamespaceManager($Document.NameTable)
    $ns.AddNamespace('m', $script:NsMain)
    $ns.AddNamespace('r', $script:NsRelOd)
    $ns.AddNamespace('pr', $script:NsRelPkg)
    $ns.AddNamespace('xdr', $script:NsXdr)
    $ns.AddNamespace('a', $script:NsA)
    $ns.AddNamespace('v', $script:NsVml)
    $ns.AddNamespace('o', $script:NsOffice)
    $ns.AddNamespace('x', $script:NsExcelVml)
    $ns.AddNamespace('tc', $script:NsThreadedComments)
    return $ns
}

function Resolve-RelTargetPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BaseDir,
        [Parameter(Mandatory = $true)]
        [string]$Target
    )
    $combined = $Target.Replace('\', '/')
    if ($combined.StartsWith('/')) {
        return $combined.TrimStart('/')
    }
    $base = $BaseDir.Replace('\', '/').TrimEnd('/')
    $parts = New-Object System.Collections.ArrayList
    if (-not [string]::IsNullOrEmpty($base)) {
        foreach ($p in $base.Split('/')) {
            if ($p.Length -gt 0) { [void]$parts.Add($p) }
        }
    }
    foreach ($p in $combined.Split('/')) {
        if ($p -eq '' -or $p -eq '.') { continue }
        if ($p -eq '..') {
            if ($parts.Count -gt 0) { $parts.RemoveAt($parts.Count - 1) }
            continue
        }
        [void]$parts.Add($p)
    }
    return ($parts -join '/')
}

function Get-PackageRelationships {
    param(
        [Parameter(Mandatory = $true)]
        [System.IO.Compression.ZipArchive]$Archive,
        [Parameter(Mandatory = $true)]
        [string]$RelsPath
    )
    $map = @{}
    $text = Get-ZipEntryText -Archive $Archive -EntryPath $RelsPath
    if ($null -eq $text) {
        return $map
    }
    $doc = ConvertTo-XmlDocument -XmlText $text
    $ns = New-XmlNsManager -Document $doc
    $baseDir = ''
    if ($RelsPath -match '^(.*)/_rels/') {
        $baseDir = $Matches[1]
    }
    foreach ($rel in $doc.SelectNodes('//pr:Relationship', $ns)) {
        $id = $rel.GetAttribute('Id')
        $type = $rel.GetAttribute('Type')
        $target = $rel.GetAttribute('Target')
        $mode = $rel.GetAttribute('TargetMode')
        if ($mode -eq 'External') { continue }
        $resolved = Resolve-RelTargetPath -BaseDir $baseDir -Target $target
        $map[$id] = @{
            Id     = $id
            Type   = $type
            Target = $resolved
        }
    }
    return $map
}

function Get-SharedStringList {
    param(
        [Parameter(Mandatory = $true)]
        [System.IO.Compression.ZipArchive]$Archive
    )
    $list = New-ArrayList
    $text = Get-ZipEntryText -Archive $Archive -EntryPath 'xl/sharedStrings.xml'
    if ($null -eq $text) {
        return $list
    }
    $doc = ConvertTo-XmlDocument -XmlText $text
    $ns = New-XmlNsManager -Document $doc
    foreach ($si in $doc.SelectNodes('//m:si', $ns)) {
        # リッチテキストは run（m:r/m:t）を連結。単純 t も対象。
        $parts = New-Object System.Text.StringBuilder
        $tNodes = $si.SelectNodes('.//m:t', $ns)
        if ($tNodes.Count -gt 0) {
            foreach ($t in $tNodes) {
                [void]$parts.Append($t.InnerText)
            }
        }
        Add-ToList -List $list -Item $parts.ToString()
    }
    return $list
}

function Get-InlineStringText {
    param(
        [Parameter(Mandatory = $true)]
        [System.Xml.XmlElement]$CellElement,
        [Parameter(Mandatory = $true)]
        [System.Xml.XmlNamespaceManager]$Ns
    )
    $sb = New-Object System.Text.StringBuilder
    foreach ($t in $CellElement.SelectNodes('./m:is//m:t', $Ns)) {
        [void]$sb.Append($t.InnerText)
    }
    return $sb.ToString()
}

function Get-WorkbookSheetInfos {
    param(
        [Parameter(Mandatory = $true)]
        [System.IO.Compression.ZipArchive]$Archive
    )
    $wbText = Get-ZipEntryText -Archive $Archive -EntryPath 'xl/workbook.xml'
    if ($null -eq $wbText) {
        throw 'xl/workbook.xml がありません。壊れた xlsx の可能性があります。'
    }
    $doc = ConvertTo-XmlDocument -XmlText $wbText
    $ns = New-XmlNsManager -Document $doc
    $rels = Get-PackageRelationships -Archive $Archive -RelsPath 'xl/_rels/workbook.xml.rels'

    $calcMode = 'automatic'
    $fullCalcOnLoad = $false
    $calcPr = $doc.SelectSingleNode('//m:calcPr', $ns)
    if ($null -ne $calcPr) {
        $modeAttr = $calcPr.GetAttribute('calcMode')
        if (-not [string]::IsNullOrEmpty($modeAttr)) {
            switch ($modeAttr) {
                'auto' { $calcMode = 'automatic' }
                'manual' { $calcMode = 'manual' }
                'autoNoTable' { $calcMode = 'automaticExceptTables' }
                default { $calcMode = $modeAttr }
            }
        }
        $fcol = $calcPr.GetAttribute('fullCalcOnLoad')
        if ($fcol -eq '1' -or $fcol -eq 'true') {
            $fullCalcOnLoad = $true
        }
    }

    $sheets = New-ArrayList
    $index = 0
    foreach ($sheetNode in $doc.SelectNodes('//m:sheets/m:sheet', $ns)) {
        $index++
        $name = $sheetNode.GetAttribute('name')
        $state = $sheetNode.GetAttribute('state')
        $visibility = 'visible'
        if ($state -eq 'hidden') { $visibility = 'hidden' }
        elseif ($state -eq 'veryHidden') { $visibility = 'veryHidden' }

        $rid = $sheetNode.GetAttribute('id', $script:NsRelOd)
        if ([string]::IsNullOrEmpty($rid)) {
            $rid = $sheetNode.GetAttribute('r:id')
        }
        if (-not $rels.ContainsKey($rid)) {
            throw "シート関係 '$rid' を解決できません。"
        }
        $target = $rels[$rid].Target
        Add-ToList -List $sheets -Item @{
            Index      = $index
            Name       = $name
            Visibility = $visibility
            Path       = $target
        }
    }

    return @{
        Sheets         = $sheets
        CalculationMode = $calcMode
        FullCalcOnLoad = $fullCalcOnLoad
    }
}

function Get-PersonsMap {
    param(
        [Parameter(Mandatory = $true)]
        [System.IO.Compression.ZipArchive]$Archive
    )
    $map = @{}
    foreach ($candidate in @('xl/persons/person.xml', 'xl/persons.xml')) {
        $text = Get-ZipEntryText -Archive $Archive -EntryPath $candidate
        if ($null -eq $text) { continue }
        $doc = ConvertTo-XmlDocument -XmlText $text
        $ns = New-XmlNsManager -Document $doc
        foreach ($person in $doc.SelectNodes('//tc:person', $ns)) {
            $id = $person.GetAttribute('id')
            $display = $person.GetAttribute('displayName')
            if (-not [string]::IsNullOrEmpty($id)) {
                $map[$id] = $display
            }
        }
    }
    return $map
}

function Read-WorksheetStructure {
    param(
        [Parameter(Mandatory = $true)]
        [System.IO.Compression.ZipArchive]$Archive,
        [Parameter(Mandatory = $true)]
        $SheetInfo,
        [Parameter(Mandatory = $true)]
        [System.Collections.ArrayList]$SharedStrings,
        [Parameter(Mandatory = $true)]
        [hashtable]$PersonsMap
    )

    $sheetText = Get-ZipEntryText -Archive $Archive -EntryPath $SheetInfo.Path
    if ($null -eq $sheetText) {
        throw "シート XML がありません: $($SheetInfo.Name)"
    }
    $doc = ConvertTo-XmlDocument -XmlText $sheetText
    $ns = New-XmlNsManager -Document $doc

    $cells = New-ArrayList
    $cellIndex = @{}
    foreach ($c in $doc.SelectNodes('//m:sheetData/m:row/m:c', $ns)) {
        $addr = $c.GetAttribute('r')
        if ([string]::IsNullOrEmpty($addr)) { continue }

        $tAttr = $c.GetAttribute('t')
        $cellType = $null
        if (-not [string]::IsNullOrEmpty($tAttr)) {
            $cellType = $tAttr
        }

        $rawValue = $null
        $formulaText = $null
        $sharedFormula = $null

        $fNode = $c.SelectSingleNode('./m:f', $ns)
        if ($null -ne $fNode) {
            $fType = $fNode.GetAttribute('t')
            $si = $fNode.GetAttribute('si')
            $ref = $fNode.GetAttribute('ref')
            $fBody = $fNode.InnerText
            if (-not [string]::IsNullOrEmpty($fBody)) {
                $formulaText = $fBody
            }
            if ($fType -eq 'shared' -and -not [string]::IsNullOrEmpty($si)) {
                $sf = @{ si = [string]$si }
                if (-not [string]::IsNullOrEmpty($ref)) {
                    $sf['ref'] = $ref
                }
                $sharedFormula = $sf
            }
        }

        if ($cellType -eq 'inlineStr') {
            $rawValue = Get-InlineStringText -CellElement $c -Ns $ns
        }
        else {
            $vNode = $c.SelectSingleNode('./m:v', $ns)
            if ($null -ne $vNode) {
                $vText = $vNode.InnerText
                if ($cellType -eq 's') {
                    $idx = 0
                    if ([int]::TryParse($vText, [ref]$idx)) {
                        if ($idx -ge 0 -and $idx -lt $SharedStrings.Count) {
                            $rawValue = [string]$SharedStrings[$idx]
                        }
                        else {
                            $rawValue = $vText
                        }
                    }
                    else {
                        $rawValue = $vText
                    }
                }
                else {
                    $rawValue = $vText
                }
            }
        }

        $cellObj = @{
            address       = $addr.ToUpperInvariant()
            cellType      = $cellType
            rawValue      = $rawValue
            formulaText   = $formulaText
            sharedFormula = $sharedFormula
            displayText   = $null
        }
        Add-ToList -List $cells -Item $cellObj
        $cellIndex[$cellObj.address] = $cellObj
    }

    $mergedRanges = New-ArrayList
    foreach ($mc in $doc.SelectNodes('//m:mergeCells/m:mergeCell', $ns)) {
        $ref = $mc.GetAttribute('ref')
        if (-not [string]::IsNullOrEmpty($ref)) {
            Add-ToList -List $mergedRanges -Item $ref.ToUpperInvariant()
        }
    }

    $hiddenRows = New-ArrayList
    foreach ($row in $doc.SelectNodes('//m:sheetData/m:row', $ns)) {
        $hidden = $row.GetAttribute('hidden')
        if ($hidden -eq '1' -or $hidden -eq 'true') {
            $r = $row.GetAttribute('r')
            if (-not [string]::IsNullOrEmpty($r)) {
                Add-ToList -List $hiddenRows -Item ([int]$r)
            }
        }
    }

    $hiddenColumns = New-ArrayList
    foreach ($col in $doc.SelectNodes('//m:cols/m:col', $ns)) {
        $hidden = $col.GetAttribute('hidden')
        if ($hidden -eq '1' -or $hidden -eq 'true') {
            $min = [int]$col.GetAttribute('min')
            $max = [int]$col.GetAttribute('max')
            if ($max -lt $min) { $max = $min }
            for ($i = $min; $i -le $max; $i++) {
                Add-ToList -List $hiddenColumns -Item (ConvertTo-ColumnLetter -Index1Based $i)
            }
        }
    }

    # sheet rels
    $sheetDir = ''
    $sheetFile = $SheetInfo.Path
    if ($sheetFile -match '^(.*)/([^/]+)$') {
        $sheetDir = $Matches[1]
        $sheetFileOnly = $Matches[2]
    }
    else {
        $sheetFileOnly = $sheetFile
    }
    $relsPath = $sheetDir + '/_rels/' + $sheetFileOnly + '.rels'
    $sheetRels = Get-PackageRelationships -Archive $Archive -RelsPath $relsPath

    $shapes = New-ArrayList
    $unsupported = @{}
    $drawingTotalCount = 0
    $comments = New-ArrayList
    $commentCells = @{}

    foreach ($relId in $sheetRels.Keys) {
        $rel = $sheetRels[$relId]
        $typeName = $rel.Type

        if ($typeName -like '*/drawing') {
            $drawResult = Read-DrawingMlShapes -Archive $Archive -DrawingPath $rel.Target
            foreach ($s in $drawResult.Shapes) {
                Add-ToList -List $shapes -Item $s
            }
            $drawingTotalCount += $drawResult.TotalCount
            foreach ($k in $drawResult.Unsupported.Keys) {
                if (-not $unsupported.ContainsKey($k)) { $unsupported[$k] = 0 }
                $unsupported[$k] = [int]$unsupported[$k] + [int]$drawResult.Unsupported[$k]
            }
        }
        elseif ($typeName -like '*/vmlDrawing' -or $typeName -like '*/legacyDrawing') {
            $vmlResult = Read-VmlTextBoxes -Archive $Archive -VmlPath $rel.Target
            foreach ($s in $vmlResult.Shapes) {
                Add-ToList -List $shapes -Item $s
            }
            $drawingTotalCount += $vmlResult.TotalCount
        }
        elseif ($typeName -like '*/comments') {
            $legacy = Read-LegacyComments -Archive $Archive -CommentsPath $rel.Target
            foreach ($cm in $legacy) {
                Add-ToList -List $comments -Item $cm
                $commentCells[$cm.cell] = $true
            }
        }
        elseif ($typeName -like '*/threadedComment') {
            $threaded = Read-ThreadedComments -Archive $Archive -Path $rel.Target -PersonsMap $PersonsMap
            foreach ($cm in $threaded) {
                Add-ToList -List $comments -Item $cm
                $commentCells[$cm.cell] = $true
            }
        }
    }

    # worksheet 直下の legacyDrawing / drawing 参照（rels Type 漏れ対策）
    $legacyNode = $doc.SelectSingleNode('//m:legacyDrawing', $ns)
    if ($null -ne $legacyNode) {
        $lid = $legacyNode.GetAttribute('id', $script:NsRelOd)
        if ([string]::IsNullOrEmpty($lid)) { $lid = $legacyNode.GetAttribute('r:id') }
        if (-not [string]::IsNullOrEmpty($lid) -and $sheetRels.ContainsKey($lid)) {
            # 既に処理済みならスキップ（重複防止）
            $already = $false
            foreach ($s in $shapes) {
                if ($s.kind -eq 'vml-textbox') { $already = $true; break }
            }
            if (-not $already) {
                $vmlResult = Read-VmlTextBoxes -Archive $Archive -VmlPath $sheetRels[$lid].Target
                foreach ($s in $vmlResult.Shapes) {
                    Add-ToList -List $shapes -Item $s
                }
                $drawingTotalCount += $vmlResult.TotalCount
            }
        }
    }

    return @{
        Cells             = $cells
        CellIndex         = $cellIndex
        MergedRanges      = $mergedRanges
        HiddenRows        = $hiddenRows
        HiddenColumns     = $hiddenColumns
        Shapes            = $shapes
        Comments          = $comments
        CommentCells      = $commentCells
        UnsupportedDrawing = $unsupported
        DrawingTotalCount = $drawingTotalCount
    }
}

function Read-DrawingMlShapes {
    param(
        [Parameter(Mandatory = $true)]
        [System.IO.Compression.ZipArchive]$Archive,
        [Parameter(Mandatory = $true)]
        [string]$DrawingPath
    )
    $shapes = New-ArrayList
    $unsupported = @{}
    $total = 0
    $text = Get-ZipEntryText -Archive $Archive -EntryPath $DrawingPath
    if ($null -eq $text) {
        Stop-WithExitCode -Code 1 -Message ("参照先パーツ {0} が存在しません（壊れたブックの可能性）" -f $DrawingPath)
    }
    $doc = ConvertTo-XmlDocument -XmlText $text
    $ns = New-XmlNsManager -Document $doc

    $anchors = $doc.SelectNodes('//xdr:twoCellAnchor | //xdr:oneCellAnchor | //xdr:absoluteAnchor', $ns)
    foreach ($anchor in $anchors) {
        $from = $anchor.SelectSingleNode('./xdr:from', $ns)
        $anchorCell = $null
        if ($null -ne $from) {
            $colNode = $from.SelectSingleNode('./xdr:col', $ns)
            $rowNode = $from.SelectSingleNode('./xdr:row', $ns)
            if ($null -ne $colNode -and $null -ne $rowNode) {
                $col0 = [int]$colNode.InnerText
                $row0 = [int]$rowNode.InnerText
                $anchorCell = (ConvertTo-ColumnLetter -Index1Based ($col0 + 1)) + ([string]($row0 + 1))
            }
        }

        $spList = $anchor.SelectNodes('./xdr:sp', $ns)
        foreach ($sp in $spList) {
            $total++
            $name = ''
            $cNvPr = $sp.SelectSingleNode('.//xdr:cNvPr', $ns)
            if ($null -ne $cNvPr) {
                $name = $cNvPr.GetAttribute('name')
            }
            $sb = New-Object System.Text.StringBuilder
            foreach ($t in $sp.SelectNodes('.//a:t', $ns)) {
                [void]$sb.Append($t.InnerText)
            }
            Add-ToList -List $shapes -Item @{
                kind       = 'drawingml-shape'
                name       = $name
                text       = $sb.ToString()
                anchorCell = $anchorCell
            }
        }

        # 対応外: graphicFrame / pic
        foreach ($gf in $anchor.SelectNodes('./xdr:graphicFrame', $ns)) {
            $total++
            if (-not $unsupported.ContainsKey('graphicFrame')) { $unsupported['graphicFrame'] = 0 }
            $unsupported['graphicFrame'] = [int]$unsupported['graphicFrame'] + 1
        }
        foreach ($pic in $anchor.SelectNodes('./xdr:pic', $ns)) {
            $total++
            if (-not $unsupported.ContainsKey('pic')) { $unsupported['pic'] = 0 }
            $unsupported['pic'] = [int]$unsupported['pic'] + 1
        }
        foreach ($cxn in $anchor.SelectNodes('./xdr:cxnSp', $ns)) {
            $total++
            if (-not $unsupported.ContainsKey('cxnSp')) { $unsupported['cxnSp'] = 0 }
            $unsupported['cxnSp'] = [int]$unsupported['cxnSp'] + 1
        }
            foreach ($grp in $anchor.SelectNodes('./xdr:grpSp', $ns)) {
            # グループ自体は対応外として数え、配下の sp は文字列抽出対象として別計数
            if (-not $unsupported.ContainsKey('grpSp')) { $unsupported['grpSp'] = 0 }
            $unsupported['grpSp'] = [int]$unsupported['grpSp'] + 1
            $total++
            foreach ($sp in $grp.SelectNodes('.//xdr:sp', $ns)) {
                $total++
                $name = ''
                $cNvPr = $sp.SelectSingleNode('.//xdr:cNvPr', $ns)
                if ($null -ne $cNvPr) { $name = $cNvPr.GetAttribute('name') }
                $sb = New-Object System.Text.StringBuilder
                foreach ($t in $sp.SelectNodes('.//a:t', $ns)) {
                    [void]$sb.Append($t.InnerText)
                }
                Add-ToList -List $shapes -Item @{
                    kind       = 'drawingml-shape'
                    name       = $name
                    text       = $sb.ToString()
                    anchorCell = $anchorCell
                }
            }
            foreach ($pic in $grp.SelectNodes('.//xdr:pic', $ns)) {
                $total++
                if (-not $unsupported.ContainsKey('pic')) { $unsupported['pic'] = 0 }
                $unsupported['pic'] = [int]$unsupported['pic'] + 1
            }
            foreach ($gf in $grp.SelectNodes('.//xdr:graphicFrame', $ns)) {
                $total++
                if (-not $unsupported.ContainsKey('graphicFrame')) { $unsupported['graphicFrame'] = 0 }
                $unsupported['graphicFrame'] = [int]$unsupported['graphicFrame'] + 1
            }
        }
    }

    return @{ Shapes = $shapes; Unsupported = $unsupported; TotalCount = $total }
}

function Read-VmlTextBoxes {
    param(
        [Parameter(Mandatory = $true)]
        [System.IO.Compression.ZipArchive]$Archive,
        [Parameter(Mandatory = $true)]
        [string]$VmlPath
    )
    $shapes = New-ArrayList
    $total = 0
    $text = Get-ZipEntryText -Archive $Archive -EntryPath $VmlPath
    if ($null -eq $text) {
        Stop-WithExitCode -Code 1 -Message ("参照先パーツ {0} が存在しません（壊れたブックの可能性）" -f $VmlPath)
    }
    # VML は 1 回だけそのまま XmlDocument 化する。修復再試行や空扱いへのフォールバックはしない。
    $doc = $null
    try {
        $doc = ConvertTo-XmlDocument -XmlText $text
    }
    catch {
        Stop-WithExitCode -Code 1 -Message ("VML パーツ {0} を解析できません" -f $VmlPath)
    }
    $ns = New-XmlNsManager -Document $doc
    foreach ($shape in $doc.SelectNodes('//v:shape', $ns)) {
        # コメント由来（ObjectType=Note）は除外
        $clientData = $shape.SelectSingleNode('.//x:ClientData', $ns)
        if ($null -ne $clientData) {
            $objType = $clientData.GetAttribute('ObjectType')
            if ($objType -eq 'Note') { continue }
        }
        $textbox = $shape.SelectSingleNode('.//v:textbox', $ns)
        if ($null -eq $textbox) { continue }

        $total++
        $name = $shape.GetAttribute('id')
        if ([string]::IsNullOrEmpty($name)) {
            $name = $shape.GetAttribute('alt')
        }
        $boxText = $textbox.InnerText
        if ($null -eq $boxText) { $boxText = '' }
        $boxText = $boxText.Trim()

        $anchorCell = $null
        if ($null -ne $clientData) {
            $anchorNode = $clientData.SelectSingleNode('./x:Anchor', $ns)
            if ($null -ne $anchorNode) {
                # Anchor: col1, dx1, row1, dy1, col2, dx2, row2, dy2（0-based）
                $parts = @($anchorNode.InnerText -split ',')
                if ($parts.Count -ge 3) {
                    $col0 = 0
                    $row0 = 0
                    if ([int]::TryParse($parts[0].Trim(), [ref]$col0) -and [int]::TryParse($parts[2].Trim(), [ref]$row0)) {
                        $anchorCell = (ConvertTo-ColumnLetter -Index1Based ($col0 + 1)) + ([string]($row0 + 1))
                    }
                }
            }
        }

        Add-ToList -List $shapes -Item @{
            kind       = 'vml-textbox'
            name       = $name
            text       = $boxText
            anchorCell = $anchorCell
        }
    }
    return @{ Shapes = $shapes; TotalCount = $total }
}

function Read-LegacyComments {
    param(
        [Parameter(Mandatory = $true)]
        [System.IO.Compression.ZipArchive]$Archive,
        [Parameter(Mandatory = $true)]
        [string]$CommentsPath
    )
    $result = New-ArrayList
    $text = Get-ZipEntryText -Archive $Archive -EntryPath $CommentsPath
    if ($null -eq $text) {
        Stop-WithExitCode -Code 1 -Message ("参照先パーツ {0} が存在しません（壊れたブックの可能性）" -f $CommentsPath)
    }
    $doc = ConvertTo-XmlDocument -XmlText $text
    $ns = New-XmlNsManager -Document $doc
    $authors = New-ArrayList
    foreach ($a in $doc.SelectNodes('//m:authors/m:author', $ns)) {
        Add-ToList -List $authors -Item $a.InnerText
    }
    foreach ($c in $doc.SelectNodes('//m:commentList/m:comment', $ns)) {
        $ref = $c.GetAttribute('ref')
        $authorId = 0
        [void][int]::TryParse($c.GetAttribute('authorId'), [ref]$authorId)
        $author = ''
        if ($authorId -ge 0 -and $authorId -lt $authors.Count) {
            $author = [string]$authors[$authorId]
        }
        $sb = New-Object System.Text.StringBuilder
        foreach ($t in $c.SelectNodes('.//m:t', $ns)) {
            [void]$sb.Append($t.InnerText)
        }
        Add-ToList -List $result -Item @{
            kind   = 'legacy'
            cell   = $ref.ToUpperInvariant()
            author = $author
            text   = $sb.ToString()
        }
    }
    return $result
}

function Read-ThreadedComments {
    param(
        [Parameter(Mandatory = $true)]
        [System.IO.Compression.ZipArchive]$Archive,
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [hashtable]$PersonsMap
    )
    $result = New-ArrayList
    $text = Get-ZipEntryText -Archive $Archive -EntryPath $Path
    if ($null -eq $text) {
        Stop-WithExitCode -Code 1 -Message ("参照先パーツ {0} が存在しません（壊れたブックの可能性）" -f $Path)
    }
    $doc = ConvertTo-XmlDocument -XmlText $text
    $ns = New-XmlNsManager -Document $doc

    $nodes = @($doc.SelectNodes('//tc:threadedComment', $ns))
    # セルごとに親→返信の順へ
    $byCell = @{}
    foreach ($n in $nodes) {
        $ref = $n.GetAttribute('ref')
        if ([string]::IsNullOrEmpty($ref)) { continue }
        $key = $ref.ToUpperInvariant()
        if (-not $byCell.ContainsKey($key)) {
            $byCell[$key] = New-ArrayList
        }
        Add-ToList -List $byCell[$key] -Item $n
    }

    foreach ($cell in $byCell.Keys) {
        $list = $byCell[$cell]
        $roots = New-ArrayList
        $children = @{}
        foreach ($n in $list) {
            $id = $n.GetAttribute('id')
            $parentId = $n.GetAttribute('parentId')
            if ([string]::IsNullOrEmpty($parentId)) {
                Add-ToList -List $roots -Item $n
            }
            else {
                if (-not $children.ContainsKey($parentId)) {
                    $children[$parentId] = New-ArrayList
                }
                Add-ToList -List $children[$parentId] -Item $n
            }
        }

        foreach ($root in $roots) {
            $personId = $root.GetAttribute('personId')
            $author = ''
            if ($PersonsMap.ContainsKey($personId)) {
                $author = [string]$PersonsMap[$personId]
            }
            $textNode = $root.SelectSingleNode('./tc:text', $ns)
            $rootText = ''
            if ($null -ne $textNode) { $rootText = $textNode.InnerText }

            $replies = New-ArrayList
            $rootId = $root.GetAttribute('id')
            if ($children.ContainsKey($rootId)) {
                foreach ($child in $children[$rootId]) {
                    $cpid = $child.GetAttribute('personId')
                    $cauthor = ''
                    if ($PersonsMap.ContainsKey($cpid)) {
                        $cauthor = [string]$PersonsMap[$cpid]
                    }
                    $ct = $child.SelectSingleNode('./tc:text', $ns)
                    $ctext = ''
                    if ($null -ne $ct) { $ctext = $ct.InnerText }
                    Add-ToList -List $replies -Item @{
                        author = $cauthor
                        text   = $ctext
                    }
                }
            }

            Add-ToList -List $result -Item @{
                kind    = 'threaded'
                cell    = $cell
                author  = $author
                text    = $rootText
                replies = $replies
            }
        }
    }
    return $result
}

# =============================================================================
# 7章: 宣言シート解析
# =============================================================================

function Test-CellNonEmpty {
    param(
        [Parameter(Mandatory = $true)]
        $Cell,
        [Parameter(Mandatory = $true)]
        [hashtable]$CommentCells
    )
    if ($null -ne $Cell.rawValue -and [string]$Cell.rawValue -ne '') { return $true }
    if ($null -ne $Cell.formulaText -and [string]$Cell.formulaText -ne '') { return $true }
    if ($null -ne $Cell.sharedFormula) { return $true }
    if ($CommentCells.ContainsKey($Cell.address)) { return $true }
    return $false
}

function Get-CellDisplayOrRaw {
    param($SheetData, [string]$Address)
    $addr = $Address.ToUpperInvariant()
    if ($SheetData.CellIndex.ContainsKey($addr)) {
        return $SheetData.CellIndex[$addr]
    }
    return $null
}

function Find-HeaderRow {
    param(
        [Parameter(Mandatory = $true)]
        $SheetData,
        [Parameter(Mandatory = $true)]
        [string[]]$RequiredLabels
    )
    # 行番号昇順で走査し、必須ラベルをすべて含む最初の行をヘッダーとする
    $byRow = @{}
    foreach ($cell in $SheetData.Cells) {
        $parts = Split-A1Address -Address $cell.address
        $r = $parts.RowIndex
        if (-not $byRow.ContainsKey($r)) {
            $byRow[$r] = @{}
        }
        $val = ''
        if ($null -ne $cell.rawValue) { $val = [string]$cell.rawValue }
        $byRow[$r][$parts.ColLetter] = $val
    }
    $rowNums = @($byRow.Keys | Sort-Object)
    foreach ($r in $rowNums) {
        $vals = @($byRow[$r].Values)
        $ok = $true
        foreach ($label in $RequiredLabels) {
            $found = $false
            foreach ($v in $vals) {
                if ($v -eq $label) { $found = $true; break }
            }
            if (-not $found) { $ok = $false; break }
        }
        if ($ok) {
            return @{
                RowIndex = $r
                Columns  = $byRow[$r]
            }
        }
    }
    return $null
}

function Get-ColumnLetterByLabel {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$HeaderColumns,
        [Parameter(Mandatory = $true)]
        [string]$Label
    )
    foreach ($col in $HeaderColumns.Keys) {
        if ($HeaderColumns[$col] -eq $Label) {
            return $col
        }
    }
    return $null
}

function Parse-DeclarationSheet {
    param(
        [Parameter(Mandatory = $true)]
        [System.Collections.ArrayList]$AllSheets,
        [Parameter(Mandatory = $true)]
        [hashtable]$SheetDataMap,
        [Parameter(Mandatory = $true)]
        [System.Collections.ArrayList]$RealSheetNames
    )

    $warnings = New-ArrayList
    $invalids = New-ArrayList
    $matrix = New-ArrayList
    $rangeDeclarations = New-ArrayList
    $declarationFormulaCells = New-ArrayList

    $declSheet = $null
    foreach ($s in $AllSheets) {
        if ($s.Name -eq $script:DeclarationSheetName) {
            $declSheet = $s
            break
        }
    }

    if ($null -eq $declSheet) {
        Add-ToList -List $warnings -Item @{
            type   = 'no-declaration-sheet'
            sheet  = $null
            detail = '宣言シート _シート役割表 が存在しません。'
        }
        return @{
            Present                 = $false
            SheetName               = $null
            Matrix                  = $matrix
            RangeDeclarations       = $rangeDeclarations
            Warnings                = $warnings
            Invalids                = $invalids
            DeclarationFormulaCells = $declarationFormulaCells
            SelfCheckResult         = 'pass'
        }
    }

    $data = $SheetDataMap[$declSheet.Name]

    # --- 7.1 影響先マトリクス ---
    $matrixRequired = @('シート名', '範囲宣言状態', '補足メモ') + $script:ImpactTargets
    # ヘッダー探索は「シート名」を含む行を起点（契約: 「シート名」ラベルのセルを含む最初の行）
    $header = Find-HeaderRow -SheetData $data -RequiredLabels @('シート名')
    if ($null -ne $header) {
        $colSheet = Get-ColumnLetterByLabel -HeaderColumns $header.Columns -Label 'シート名'
        $colStatus = Get-ColumnLetterByLabel -HeaderColumns $header.Columns -Label '範囲宣言状態'
        $colNote = Get-ColumnLetterByLabel -HeaderColumns $header.Columns -Label '補足メモ'
        $targetCols = @{}
        foreach ($t in $script:ImpactTargets) {
            $cl = Get-ColumnLetterByLabel -HeaderColumns $header.Columns -Label $t
            if ($null -ne $cl) { $targetCols[$t] = $cl }
        }

        if ($null -ne $colSheet) {
            $maxRow = 0
            foreach ($cell in $data.Cells) {
                $p = Split-A1Address -Address $cell.address
                if ($p.RowIndex -gt $maxRow) { $maxRow = $p.RowIndex }
            }
            for ($r = $header.RowIndex + 1; $r -le $maxRow; $r++) {
                $nameCell = Get-CellDisplayOrRaw -SheetData $data -Address ($colSheet + $r)
                $sheetNameVal = ''
                if ($null -ne $nameCell -and $null -ne $nameCell.rawValue) {
                    $sheetNameVal = [string]$nameCell.rawValue
                }
                if ([string]::IsNullOrWhiteSpace($sheetNameVal)) {
                    break
                }

                $targets = New-ArrayList
                foreach ($t in $script:ImpactTargets) {
                    if (-not $targetCols.ContainsKey($t)) { continue }
                    $tc = Get-CellDisplayOrRaw -SheetData $data -Address ($targetCols[$t] + $r)
                    $tv = ''
                    if ($null -ne $tc -and $null -ne $tc.rawValue) { $tv = [string]$tc.rawValue }
                    if ($tv -eq [string]([char]0x25CB) -or $tv -eq '○') {
                        Add-ToList -List $targets -Item $t
                    }
                    elseif (-not [string]::IsNullOrEmpty($tv)) {
                        # 有効値以外は無効扱いにはしない（警告のみにせず、無効4項目の対象外矛盾のみ契約化）
                    }
                }

                $status = ''
                if ($null -ne $colStatus) {
                    $sc = Get-CellDisplayOrRaw -SheetData $data -Address ($colStatus + $r)
                    if ($null -ne $sc -and $null -ne $sc.rawValue) { $status = [string]$sc.rawValue }
                }
                $note = ''
                if ($null -ne $colNote) {
                    $nc = Get-CellDisplayOrRaw -SheetData $data -Address ($colNote + $r)
                    if ($null -ne $nc -and $null -ne $nc.rawValue) { $note = [string]$nc.rawValue }
                }

                Add-ToList -List $matrix -Item @{
                    sheetName               = $sheetNameVal
                    targets                 = $targets
                    rangeDeclarationStatus  = $status
                    note                    = $note
                }

                # 無効4: 対象外○ かつ他影響先○
                $hasExclude = $false
                $hasOther = $false
                foreach ($t in $targets) {
                    if ($t -eq '対象外') { $hasExclude = $true }
                    else { $hasOther = $true }
                }
                if ($hasExclude -and $hasOther) {
                    Add-ToList -List $invalids -Item @{
                        code   = 4
                        detail = "マトリクス行『$sheetNameVal』で対象外と他影響先が同時に ○ です。"
                    }
                }
            }
        }
    }

    # --- 7.2 範囲宣言表 ---
    $rangeHeader = Find-HeaderRow -SheetData $data -RequiredLabels @('宣言ID', '対象シート', '内容ラベル', '範囲数式', '補足')
    # マトリクスより下の行であることを契約は求める。見つかったヘッダーがマトリクスヘッダー行以下なら採用。
    if ($null -ne $rangeHeader -and $null -ne $header -and $rangeHeader.RowIndex -le $header.RowIndex) {
        # マトリクスと同じか上なら、さらに下を探す
        $rangeHeader = $null
        $byRow = @{}
        foreach ($cell in $data.Cells) {
            $parts = Split-A1Address -Address $cell.address
            $r = $parts.RowIndex
            if ($r -le $header.RowIndex) { continue }
            if (-not $byRow.ContainsKey($r)) { $byRow[$r] = @{} }
            $val = ''
            if ($null -ne $cell.rawValue) { $val = [string]$cell.rawValue }
            $byRow[$r][$parts.ColLetter] = $val
        }
        foreach ($r in @($byRow.Keys | Sort-Object)) {
            $vals = @($byRow[$r].Values)
            $need = @('宣言ID', '対象シート', '内容ラベル', '範囲数式', '補足')
            $ok = $true
            foreach ($label in $need) {
                $found = $false
                foreach ($v in $vals) { if ($v -eq $label) { $found = $true; break } }
                if (-not $found) { $ok = $false; break }
            }
            if ($ok) {
                $rangeHeader = @{ RowIndex = $r; Columns = $byRow[$r] }
                break
            }
        }
    }

    $parsedRanges = New-ArrayList
    if ($null -ne $rangeHeader) {
        $cId = Get-ColumnLetterByLabel -HeaderColumns $rangeHeader.Columns -Label '宣言ID'
        $cTarget = Get-ColumnLetterByLabel -HeaderColumns $rangeHeader.Columns -Label '対象シート'
        $cLabel = Get-ColumnLetterByLabel -HeaderColumns $rangeHeader.Columns -Label '内容ラベル'
        $cFormula = Get-ColumnLetterByLabel -HeaderColumns $rangeHeader.Columns -Label '範囲数式'
        $cNote = Get-ColumnLetterByLabel -HeaderColumns $rangeHeader.Columns -Label '補足'

        $maxRow = 0
        foreach ($cell in $data.Cells) {
            $p = Split-A1Address -Address $cell.address
            if ($p.RowIndex -gt $maxRow) { $maxRow = $p.RowIndex }
        }

        for ($r = $rangeHeader.RowIndex + 1; $r -le $maxRow; $r++) {
            $idCell = Get-CellDisplayOrRaw -SheetData $data -Address ($cId + $r)
            $idVal = ''
            if ($null -ne $idCell -and $null -ne $idCell.rawValue) { $idVal = [string]$idCell.rawValue }
            if ([string]::IsNullOrWhiteSpace($idVal)) { break }

            $targetVal = ''
            $tc = Get-CellDisplayOrRaw -SheetData $data -Address ($cTarget + $r)
            if ($null -ne $tc -and $null -ne $tc.rawValue) { $targetVal = [string]$tc.rawValue }

            $labelVal = ''
            $lc = Get-CellDisplayOrRaw -SheetData $data -Address ($cLabel + $r)
            if ($null -ne $lc -and $null -ne $lc.rawValue) { $labelVal = [string]$lc.rawValue }

            $formulaAddr = ($cFormula + $r).ToUpperInvariant()
            $fc = Get-CellDisplayOrRaw -SheetData $data -Address $formulaAddr
            $formulaRaw = $null
            if ($null -ne $fc) {
                if ($null -ne $fc.formulaText) { $formulaRaw = [string]$fc.formulaText }
                elseif ($null -ne $fc.rawValue) { $formulaRaw = [string]$fc.rawValue }
            }
            Add-ToList -List $declarationFormulaCells -Item @{
                SheetName = $declSheet.Name
                Address   = $formulaAddr
            }

            $noteVal = ''
            if ($null -ne $cNote) {
                $nc = Get-CellDisplayOrRaw -SheetData $data -Address ($cNote + $r)
                if ($null -ne $nc -and $null -ne $nc.rawValue) { $noteVal = [string]$nc.rawValue }
            }

            # 無効1: 対象シート実在
            $targetExists = $false
            foreach ($rn in $RealSheetNames) {
                if ($rn -eq $targetVal) { $targetExists = $true; break }
            }
            if (-not $targetExists) {
                Add-ToList -List $invalids -Item @{
                    code   = 1
                    detail = "範囲宣言『$idVal』の対象シート『$targetVal』が実シートに存在しません。"
                }
            }

            $normalizedRange = $null
            $startCol = $null
            $startRow = $null
            $endCol = $null
            $endRow = $null
            $formulaOk = $false

            if ($null -eq $formulaRaw -or $formulaRaw -match '#REF!') {
                Add-ToList -List $invalids -Item @{
                    code   = 2
                    detail = "範囲宣言『$idVal』の範囲数式が空、または #REF! を含みます。"
                }
            }
            else {
                $m = [regex]::Match($formulaRaw, $script:AddressIdiomRegex, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                if (-not $m.Success) {
                    Add-ToList -List $invalids -Item @{
                        code   = 2
                        detail = "範囲宣言『$idVal』の範囲数式が許可イディオムに一致しません。"
                    }
                }
                else {
                    $s1 = $m.Groups['s1'].Value
                    if ([string]::IsNullOrEmpty($s1)) { $s1 = $m.Groups['s1b'].Value }
                    $s2 = $m.Groups['s2'].Value
                    if ([string]::IsNullOrEmpty($s2)) { $s2 = $m.Groups['s2b'].Value }
                    $s3 = $m.Groups['s3'].Value
                    if ([string]::IsNullOrEmpty($s3)) { $s3 = $m.Groups['s3b'].Value }
                    $s4 = $m.Groups['s4'].Value
                    if ([string]::IsNullOrEmpty($s4)) { $s4 = $m.Groups['s4b'].Value }

                    $c1 = $m.Groups['c1'].Value.ToUpperInvariant()
                    $c2 = $m.Groups['c2'].Value.ToUpperInvariant()
                    $c3 = $m.Groups['c3'].Value.ToUpperInvariant()
                    $c4 = $m.Groups['c4'].Value.ToUpperInvariant()
                    $r1 = [int]$m.Groups['r1'].Value
                    $r2 = [int]$m.Groups['r2'].Value
                    $r3 = [int]$m.Groups['r3'].Value
                    $r4 = [int]$m.Groups['r4'].Value

                    $pairOk = ($s1 -eq $s2 -and $c1 -eq $c2 -and $r1 -eq $r2) -and ($s3 -eq $s4 -and $c3 -eq $c4 -and $r3 -eq $r4)
                    $sheetOk = ($s1 -eq $s3) -and ($s1 -eq $targetVal)
                    $startColIdx = ConvertFrom-ColumnLetter -Letter $c1
                    $endColIdx = ConvertFrom-ColumnLetter -Letter $c3
                    $orderOk = ($startColIdx -le $endColIdx) -and ($r1 -le $r3)

                    if (-not ($pairOk -and $sheetOk -and $orderOk)) {
                        Add-ToList -List $invalids -Item @{
                            code   = 3
                            detail = "範囲宣言『$idVal』で開始/終了の逆転、またはシート参照不一致があります。"
                        }
                    }
                    else {
                        $formulaOk = $true
                        $startCol = $c1
                        $startRow = $r1
                        $endCol = $c3
                        $endRow = $r3
                        $normalizedRange = "$targetVal!$c1$r1`:$c3$r3"
                    }
                }
            }

            $nonEmpty = 0
            if ($formulaOk -and $SheetDataMap.ContainsKey($targetVal)) {
                $tdata = $SheetDataMap[$targetVal]
                $scIdx = ConvertFrom-ColumnLetter -Letter $startCol
                $ecIdx = ConvertFrom-ColumnLetter -Letter $endCol
                foreach ($cell in $tdata.Cells) {
                    $p = Split-A1Address -Address $cell.address
                    if ($p.RowIndex -lt $startRow -or $p.RowIndex -gt $endRow) { continue }
                    if ($p.ColIndex -lt $scIdx -or $p.ColIndex -gt $ecIdx) { continue }
                    if (Test-CellNonEmpty -Cell $cell -CommentCells $tdata.CommentCells) {
                        $nonEmpty++
                    }
                }
            }

            $entry = @{
                id                = $idVal
                targetSheet       = $targetVal
                label             = $labelVal
                formulaRaw        = $formulaRaw
                normalizedRange   = $normalizedRange
                nonEmptyCellCount = $nonEmpty
                _startCol         = $startCol
                _startRow         = $startRow
                _endCol           = $endCol
                _endRow           = $endRow
                _formulaOk        = $formulaOk
                _note             = $noteVal
            }
            Add-ToList -List $parsedRanges -Item $entry
            Add-ToList -List $rangeDeclarations -Item @{
                id                = $idVal
                targetSheet       = $targetVal
                label             = $labelVal
                formulaRaw        = $formulaRaw
                normalizedRange   = $normalizedRange
                nonEmptyCellCount = $nonEmpty
            }

            if ($formulaOk -and $nonEmpty -eq 0) {
                Add-ToList -List $warnings -Item @{
                    type   = 'empty-range'
                    sheet  = $targetVal
                    detail = "範囲宣言『$idVal』の正規化範囲内の非空セル数が 0 です。"
                }
            }
        }
    }

    # 警告1: 棚卸しズレ（宣言シート自身を除く）
    $matrixNameMap = @{}
    foreach ($row in $matrix) {
        $matrixNameMap[[string]$row.sheetName] = $true
    }
    $realNameMap = @{}
    foreach ($rn in $RealSheetNames) {
        if ($rn -eq $script:DeclarationSheetName) { continue }
        $realNameMap[[string]$rn] = $true
    }
    $onlyMatrix = New-ArrayList
    foreach ($n in $matrixNameMap.Keys) {
        if (-not $realNameMap.ContainsKey($n)) { Add-ToList -List $onlyMatrix -Item $n }
    }
    $onlyReal = New-ArrayList
    foreach ($n in $realNameMap.Keys) {
        if (-not $matrixNameMap.ContainsKey($n)) { Add-ToList -List $onlyReal -Item $n }
    }
    if ($onlyMatrix.Count -gt 0 -or $onlyReal.Count -gt 0) {
        $detail = '棚卸しズレ: マトリクスのみ=[' + ($onlyMatrix -join ', ') + '] 実シートのみ=[' + ($onlyReal -join ', ') + ']'
        Add-ToList -List $warnings -Item @{
            type   = 'inventory-mismatch'
            sheet  = $script:DeclarationSheetName
            detail = $detail
        }
    }

    # 警告2: 終端直後の内容
    foreach ($pr in $parsedRanges) {
        if (-not $pr._formulaOk) { continue }
        $targetVal = $pr.targetSheet
        if (-not $SheetDataMap.ContainsKey($targetVal)) { continue }
        $tdata = $SheetDataMap[$targetVal]
        $nextRow = [int]$pr._endRow + 1
        $scIdx = ConvertFrom-ColumnLetter -Letter $pr._startCol
        $ecIdx = ConvertFrom-ColumnLetter -Letter $pr._endCol

        foreach ($cell in $tdata.Cells) {
            $p = Split-A1Address -Address $cell.address
            if ($p.RowIndex -ne $nextRow) { continue }
            if ($p.ColIndex -lt $scIdx -or $p.ColIndex -gt $ecIdx) { continue }
            if (-not (Test-CellNonEmpty -Cell $cell -CommentCells $tdata.CommentCells)) { continue }

            # 他の宣言の正規化範囲内なら除外
            $inOther = $false
            foreach ($other in $parsedRanges) {
                if ($other.id -eq $pr.id) { continue }
                if (-not $other._formulaOk) { continue }
                if ($other.targetSheet -ne $targetVal) { continue }
                $osc = ConvertFrom-ColumnLetter -Letter $other._startCol
                $oec = ConvertFrom-ColumnLetter -Letter $other._endCol
                if ($p.RowIndex -ge $other._startRow -and $p.RowIndex -le $other._endRow -and $p.ColIndex -ge $osc -and $p.ColIndex -le $oec) {
                    $inOther = $true
                    break
                }
            }
            if ($inOther) { continue }

            Add-ToList -List $warnings -Item @{
                type   = 'content-after-range'
                sheet  = $targetVal
                detail = "範囲宣言『$($pr.id)』の終端直後（行 $nextRow）に非空セル $($cell.address) があります。"
            }
            break
        }
    }

    $selfResult = 'pass'
    foreach ($w in $warnings) {
        if ($w.type -eq 'inventory-mismatch' -or $w.type -eq 'content-after-range' -or $w.type -eq 'empty-range') {
            $selfResult = 'warned'
            break
        }
    }

    return @{
        Present                 = $true
        SheetName               = $declSheet.Name
        Matrix                  = $matrix
        RangeDeclarations       = $rangeDeclarations
        Warnings                = $warnings
        Invalids                = $invalids
        DeclarationFormulaCells = $declarationFormulaCells
        SelfCheckResult         = $selfResult
    }
}

# =============================================================================
# 5章: Excel COM（displayText・厳格結合）
# =============================================================================

function Invoke-ComDisplayTextBinding {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BookFilePath,
        [Parameter(Mandatory = $true)]
        [System.Collections.ArrayList]$SheetStructures,
        [Parameter(Mandatory = $true)]
        [System.Collections.ArrayList]$DeclarationFormulaCells
    )

    $excel = $null
    $workbooks = $null
    $workbook = $null
    $excelVersion = $null
    $comObjects = New-ArrayList

    try {
        try {
            $excel = New-Object -ComObject Excel.Application
        }
        catch {
            Stop-WithExitCode -Code 10 -Message ($script:EnvExclusiveMessage + '（Excel COM を生成できません）')
        }
        Add-ToList -List $comObjects -Item $excel
        $excel.Visible = $false
        $excel.DisplayAlerts = $false
        $excelVersion = [string]$excel.Version

        $workbooks = $excel.Workbooks
        Add-ToList -List $comObjects -Item $workbooks

        # UpdateLinks=0, ReadOnly=true, IgnoreReadOnlyRecommended=true, AddToMru=false
        $missing = [Type]::Missing
        $workbook = $workbooks.Open(
            $BookFilePath,
            0,
            $true,
            $missing,
            $missing,
            $missing,
            $true,
            $missing,
            $missing,
            $missing,
            $missing,
            $missing,
            $false
        )
        Add-ToList -List $comObjects -Item $workbook

        $declSet = @{}
        foreach ($d in $DeclarationFormulaCells) {
            $key = $d.SheetName + '!' + $d.Address
            $declSet[$key] = $true
        }

        foreach ($sheetStruct in $SheetStructures) {
            $ws = $null
            $used = $null
            try {
                $ws = $workbook.Worksheets.Item($sheetStruct.Name)
                Add-ToList -List $comObjects -Item $ws

                # COM 側にのみ現れる非空セル検出（Value2 ブロックは検出補助のみ）
                $openXmlSet = @{}
                foreach ($cell in $sheetStruct.Data.Cells) {
                    $openXmlSet[$cell.address] = $true
                }
                $surplus = New-ArrayList
                $used = $ws.UsedRange
                if ($null -ne $used) {
                    Add-ToList -List $comObjects -Item $used
                    $rowCount = [int]$used.Rows.Count
                    $colCount = [int]$used.Columns.Count
                    $startRow = [int]$used.Row
                    $startCol = [int]$used.Column
                    $vals = $used.Value2

                    if ($null -ne $vals) {
                        if ($rowCount -eq 1 -and $colCount -eq 1) {
                            # 単一セルはスカラー
                            if ($null -ne $vals -and [string]$vals -ne '') {
                                $addr = (ConvertTo-ColumnLetter -Index1Based $startCol) + ([string]$startRow)
                                if (-not $openXmlSet.ContainsKey($addr)) {
                                    Add-ToList -List $surplus -Item $addr
                                }
                            }
                        }
                        else {
                            for ($rr = 1; $rr -le $rowCount; $rr++) {
                                for ($cc = 1; $cc -le $colCount; $cc++) {
                                    $v = $vals.GetValue($rr, $cc)
                                    if ($null -eq $v) { continue }
                                    if ([string]$v -eq '') { continue }
                                    $addr = (ConvertTo-ColumnLetter -Index1Based ($startCol + $cc - 1)) + ([string]($startRow + $rr - 1))
                                    if (-not $openXmlSet.ContainsKey($addr)) {
                                        Add-ToList -List $surplus -Item $addr
                                    }
                                }
                            }
                        }
                    }
                }

                if ($surplus.Count -gt 0) {
                    $sample = ($surplus | Select-Object -First 5) -join ', '
                    Stop-WithExitCode -Code 30 -Message ("厳格結合不合格: シート『{0}』で COM 側にのみ非空セルがあります（例: {1}）。" -f $sheetStruct.Name, $sample)
                }
                $sheetStruct.Data.ComSurplusCells = $surplus

                # displayText: OpenXML 全 <c> をセル単位 Range.Text
                foreach ($cell in $sheetStruct.Data.Cells) {
                    $rg = $null
                    try {
                        $rg = $ws.Range($cell.address)
                        Add-ToList -List $comObjects -Item $rg
                        $declKey = $sheetStruct.Name + '!' + $cell.address
                        if ($declSet.ContainsKey($declKey)) {
                            $rg.Calculate() | Out-Null
                        }
                        $text = $rg.Text
                        if ($null -eq $text) {
                            Stop-WithExitCode -Code 30 -Message ("厳格結合不合格: displayText 取得失敗 {0}!{1}" -f $sheetStruct.Name, $cell.address)
                        }
                        $cell.displayText = [string]$text

                        # 宣言セルの #REF! 検出用（後段の無効判定で参照）
                        if ($declSet.ContainsKey($declKey)) {
                            $cell._calculatedDisplay = [string]$text
                        }
                    }
                    finally {
                        if ($null -ne $rg) { Release-ComRef -ComObject $rg }
                    }
                }
            }
            finally {
                if ($null -ne $used) { Release-ComRef -ComObject $used }
                if ($null -ne $ws) { Release-ComRef -ComObject $ws }
            }
        }

        return $excelVersion
    }
    finally {
        if ($null -ne $workbook) {
            try { $workbook.Close($false) } catch { }
            Release-ComRef -ComObject $workbook
        }
        if ($null -ne $workbooks) {
            Release-ComRef -ComObject $workbooks
        }
        if ($null -ne $excel) {
            try { $excel.Quit() } catch { }
            Release-ComRef -ComObject $excel
        }
        [System.GC]::Collect()
        [System.GC]::WaitForPendingFinalizers()
        [System.GC]::Collect()
    }
}

# =============================================================================
# 出力・検証・原子性
# =============================================================================

function Test-DumpDirectoryIntegrity {
    param(
        [Parameter(Mandatory = $true)]
        [string]$DumpDir
    )
    $manifestPath = Join-Path $DumpDir 'manifest.json'
    if (-not (Test-Path -LiteralPath $manifestPath)) {
        throw 'manifest.json がありません。'
    }
    $manifestText = [System.IO.File]::ReadAllText($manifestPath, (New-Object System.Text.UTF8Encoding($false)))
    $manifest = $manifestText | ConvertFrom-Json
    $required = @('dumpFormatVersion', 'generator', 'generatedAt', 'book', 'environment', 'calculation', 'shapeWarnThreshold', 'sheets', 'declarationSheet', 'selfCheck', 'warnings')
    foreach ($k in $required) {
        if (-not ($manifest.PSObject.Properties.Name -contains $k)) {
            throw "manifest に必須キー '$k' がありません。"
        }
    }
    $sheetsDir = Join-Path $DumpDir 'sheets'
    foreach ($s in @($manifest.sheets)) {
        $jp = Join-Path $DumpDir $s.jsonFile
        if (-not (Test-Path -LiteralPath $jp)) {
            throw "シート JSON がありません: $($s.jsonFile)"
        }
        $jt = [System.IO.File]::ReadAllText($jp, (New-Object System.Text.UTF8Encoding($false)))
        $null = $jt | ConvertFrom-Json
    }
}

function Clear-TempDumpDir {
    if ($null -ne $script:TempDumpDir -and (Test-Path -LiteralPath $script:TempDumpDir)) {
        Remove-Item -LiteralPath $script:TempDumpDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    $script:TempDumpDir = $null
}

# =============================================================================
# メイン
# =============================================================================

function Invoke-ExtractMain {
    Assert-SupportedRuntime
    Assert-InputArguments

    $bookFileName = [System.IO.Path]::GetFileName($script:ResolvedBookPath)
    $bookSha = Get-FileSha256Hex -Path $script:ResolvedBookPath

    $parentDir = [System.IO.Path]::GetDirectoryName($script:FinalDumpDir)
    $finalLeaf = [System.IO.Path]::GetFileName($script:FinalDumpDir)
    $script:TempDumpDir = Join-Path $parentDir ('.' + $finalLeaf + '.tmp.' + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $script:TempDumpDir | Out-Null
    $sheetsOutDir = Join-Path $script:TempDumpDir 'sheets'
    New-Item -ItemType Directory -Path $sheetsOutDir | Out-Null

    $archive = $null
    $sheetStructures = New-ArrayList
    $warnings = New-ArrayList
    $excelVersion = $null

    try {
        try {
            $archive = Open-XlsxArchive -Path $script:ResolvedBookPath
        }
        catch {
            Stop-WithExitCode -Code 1 -Message ("xlsx を開けません: {0}" -f $_.Exception.Message)
        }

        $wbInfo = Get-WorkbookSheetInfos -Archive $archive
        $sharedStrings = Get-SharedStringList -Archive $archive
        $persons = Get-PersonsMap -Archive $archive

        $sheetDataMap = @{}
        $realNames = New-ArrayList

        foreach ($si in $wbInfo.Sheets) {
            Add-ToList -List $realNames -Item $si.Name
            try {
                $struct = Read-WorksheetStructure -Archive $archive -SheetInfo $si -SharedStrings $sharedStrings -PersonsMap $persons
            }
            catch {
                Stop-WithExitCode -Code 1 -Message ("シート『{0}』の OpenXML 解析に失敗: {1}" -f $si.Name, $_.Exception.Message)
            }
            $sheetDataMap[$si.Name] = $struct
            Add-ToList -List $sheetStructures -Item @{
                Index      = $si.Index
                Name       = $si.Name
                Visibility = $si.Visibility
                Data       = $struct
            }
        }

        # 宣言シート解析（COM 前。#REF! 表示は COM 後に再確認）
        $decl = Parse-DeclarationSheet -AllSheets $wbInfo.Sheets -SheetDataMap $sheetDataMap -RealSheetNames $realNames

        # COM 結合
        $excelVersion = Invoke-ComDisplayTextBinding -BookFilePath $script:ResolvedBookPath -SheetStructures $sheetStructures -DeclarationFormulaCells $decl.DeclarationFormulaCells

        # 宣言セル Calculate 後の #REF! を無効2へ追加
        foreach ($dcell in $decl.DeclarationFormulaCells) {
            if (-not $sheetDataMap.ContainsKey($dcell.SheetName)) { continue }
            $sd = $sheetDataMap[$dcell.SheetName]
            if (-not $sd.CellIndex.ContainsKey($dcell.Address)) { continue }
            $cell = $sd.CellIndex[$dcell.Address]
            if ($null -ne $cell.displayText -and $cell.displayText -match '#REF!') {
                $already = $false
                foreach ($inv in $decl.Invalids) {
                    if ($inv.code -eq 2 -and $inv.detail -like "*$($dcell.Address)*") { $already = $true; break }
                }
                if (-not $already) {
                    Add-ToList -List $decl.Invalids -Item @{
                        code   = 2
                        detail = "範囲数式セル $($dcell.Address) の計算結果に #REF! が含まれます。"
                    }
                }
            }
        }

        if ($decl.Invalids.Count -gt 0) {
            $msg = ($decl.Invalids | ForEach-Object { $_.detail }) -join ' / '
            Stop-WithExitCode -Code 20 -Message ("宣言シートの無効宣言: {0}" -f $msg)
        }

        # displayText 必須検査
        foreach ($ss in $sheetStructures) {
            foreach ($cell in $ss.Data.Cells) {
                if ($null -eq $cell.displayText) {
                    Stop-WithExitCode -Code 30 -Message ("厳格結合不合格: displayText 未設定 {0}!{1}" -f $ss.Name, $cell.address)
                }
            }
        }

        # 図形密度・対応外警告
        foreach ($ss in $sheetStructures) {
            $shapeCountForManifest = $ss.Data.Shapes.Count
            $densityCount = [int]$ss.Data.DrawingTotalCount
            if ($densityCount -lt $shapeCountForManifest) {
                $densityCount = $shapeCountForManifest
            }
            # unsupported も含めた総数は DrawingTotalCount
            if ($densityCount -ge $ShapeWarnThreshold) {
                Add-ToList -List $warnings -Item @{
                    type   = 'shape-density'
                    sheet  = $ss.Name
                    detail = ("図形{0}個 >= 閾値{1}。要目視" -f $densityCount, $ShapeWarnThreshold)
                }
                $ss['RequiresVisualCheck'] = $true
            }
            else {
                $ss['RequiresVisualCheck'] = $false
            }

            foreach ($k in $ss.Data.UnsupportedDrawing.Keys) {
                $cnt = [int]$ss.Data.UnsupportedDrawing[$k]
                Add-ToList -List $warnings -Item @{
                    type   = 'unsupported-drawing'
                    sheet  = $ss.Name
                    detail = ("対応外 Drawing 要素 '{0}' が {1} 個あります。" -f $k, $cnt)
                }
            }
        }

        foreach ($w in $decl.Warnings) {
            Add-ToList -List $warnings -Item $w
        }

        # シート JSON 出力
        $manifestSheets = New-ArrayList
        $usedFileNames = @{}
        foreach ($ss in $sheetStructures) {
            $base = Get-SanitizedSheetBaseName -SheetName $ss.Name
            $fileLeaf = ('{0:D3}_{1}' -f $ss.Index, $base)
            if ($usedFileNames.ContainsKey($fileLeaf)) {
                $fileLeaf = $fileLeaf + '_' + $ss.Index
            }
            $usedFileNames[$fileLeaf] = $true
            $relJson = 'sheets/' + $fileLeaf + '.json'
            $absJson = Join-Path $script:TempDumpDir $relJson

            $cellsOut = New-ArrayList
            foreach ($cell in $ss.Data.Cells) {
                Add-ToList -List $cellsOut -Item @{
                    address       = $cell.address
                    cellType      = $cell.cellType
                    rawValue      = $cell.rawValue
                    formulaText   = $cell.formulaText
                    sharedFormula = $cell.sharedFormula
                    displayText   = $cell.displayText
                }
            }

            $sheetJson = @{
                dumpFormatVersion = $script:DumpFormatVersion
                sheetName         = $ss.Name
                sheetIndex        = $ss.Index
                visibility        = $ss.Visibility
                cells             = $cellsOut
                mergedRanges      = $ss.Data.MergedRanges
                hiddenRows        = $ss.Data.HiddenRows
                hiddenColumns     = $ss.Data.HiddenColumns
                shapes            = $ss.Data.Shapes
                comments          = $ss.Data.Comments
                comSurplusCells   = (New-ArrayList)
            }
            Write-Utf8NoBomFile -Path $absJson -Content (ConvertTo-ContractJson -InputObject $sheetJson)

            $reqVis = $false
            if ($ss.ContainsKey('RequiresVisualCheck') -and $null -ne $ss['RequiresVisualCheck']) {
                $reqVis = [bool]$ss['RequiresVisualCheck']
            }
            Add-ToList -List $manifestSheets -Item @{
                index               = $ss.Index
                name                = $ss.Name
                jsonFile            = $relJson
                visibility          = $ss.Visibility
                cellCount           = $ss.Data.Cells.Count
                shapeCount          = $ss.Data.Shapes.Count
                requiresVisualCheck = $reqVis
            }
        }

        $declOut = @{
            present           = [bool]$decl.Present
            sheetName         = $decl.SheetName
            matrix            = $decl.Matrix
            rangeDeclarations = $decl.RangeDeclarations
        }
        if (-not $decl.Present) {
            $declOut.sheetName = $null
            $declOut.matrix = New-ArrayList
            $declOut.rangeDeclarations = New-ArrayList
        }

        $locale = [System.Globalization.CultureInfo]::CurrentCulture.Name
        $osDesc = [System.Environment]::OSVersion.VersionString
        $psVer = $PSVersionTable.PSVersion.ToString()
        if ($null -eq $excelVersion) { $excelVersion = '' }

        $manifest = @{
            dumpFormatVersion  = $script:DumpFormatVersion
            generator          = @{
                tool        = 'extract.ps1'
                toolVersion = $script:ToolVersion
            }
            generatedAt        = [DateTimeOffset]::Now.ToString('yyyy-MM-ddTHH:mm:sszzz')
            book               = @{
                fileName = $bookFileName
                sha256   = $bookSha
            }
            environment        = @{
                excelVersion = $excelVersion
                psVersion    = $psVer
                os           = $osDesc
                locale       = $locale
            }
            calculation        = @{
                mode           = $wbInfo.CalculationMode
                fullCalcOnLoad = [bool]$wbInfo.FullCalcOnLoad
            }
            shapeWarnThreshold = $ShapeWarnThreshold
            sheets             = $manifestSheets
            declarationSheet   = $declOut
            selfCheck          = @{
                result   = $decl.SelfCheckResult
                invalids = (New-ArrayList)
            }
            warnings           = $warnings
        }

        $manifestPath = Join-Path $script:TempDumpDir 'manifest.json'
        Write-Utf8NoBomFile -Path $manifestPath -Content (ConvertTo-ContractJson -InputObject $manifest)

        Test-DumpDirectoryIntegrity -DumpDir $script:TempDumpDir

        # 原子的 rename
        if (Test-Path -LiteralPath $script:FinalDumpDir) {
            Stop-WithExitCode -Code 10 -Message '出力先ディレクトリが処理中に作成されました。'
        }
        [System.IO.Directory]::Move($script:TempDumpDir, $script:FinalDumpDir)
        $script:TempDumpDir = $null
        $script:ExitCode = 0
    }
    finally {
        if ($null -ne $archive) {
            $archive.Dispose()
        }
    }
}

# --- エントリポイント ---
try {
    Invoke-ExtractMain
}
catch {
    $msg = $_.Exception.Message
    if ($msg -like 'EXIT:*') {
        # Stop-WithExitCode 経由
    }
    else {
        if ($script:ExitCode -eq 0 -or $script:ExitCode -eq 1) {
            # 未設定の予期しないエラー
            if ($script:ExitCode -ne 10 -and $script:ExitCode -ne 20 -and $script:ExitCode -ne 30) {
                $script:ExitCode = 1
            }
        }
        if ($msg -notlike 'EXIT:*') {
            Write-Error -Message ("予期しないエラー: {0}" -f $msg) -ErrorAction Continue
            if ($script:ExitCode -eq 0) { $script:ExitCode = 1 }
        }
    }
}
finally {
    # 失敗時は一時ディレクトリのみ削除する。
    # FinalDumpDir は成功時の Directory.Move（同一ボリューム内 rename）でのみ出現し、
    # Move 成功後は ExitCode 0 のため、失敗時に FinalDumpDir を消す状況は存在しない。
    # （既存パスを FinalDumpDir に設定してから exit 10 する経路があり、削除するとユーザーデータを破壊する）
    if ($script:ExitCode -ne 0) {
        Clear-TempDumpDir
    }
}

exit $script:ExitCode
