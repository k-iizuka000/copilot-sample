Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$nativeSource = @"
using System;
using System.Runtime.InteropServices;

public static class KeepAwakeNativeMethods
{
    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern uint SetThreadExecutionState(uint esFlags);
}
"@

Add-Type -TypeDefinition $nativeSource

$ExecutionStateSystemRequired = [uint32]0x00000001
$ExecutionStateDisplayRequired = [uint32]0x00000002
$ExecutionStateContinuous = [uint32]0x80000000

$script:keepDisplayAwake = $false
$script:activeOptionId = $null
$script:expiresAt = $null
$script:lastShownError = $null

function Set-AwakeRequest {
    param(
        [bool]$IncludeDisplay
    )

    $flags = $ExecutionStateContinuous -bor $ExecutionStateSystemRequired
    if ($IncludeDisplay) {
        $flags = $flags -bor $ExecutionStateDisplayRequired
    }

    $previousState = [KeepAwakeNativeMethods]::SetThreadExecutionState($flags)
    if ($previousState -eq 0) {
        $errorCode = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
        throw (New-Object System.ComponentModel.Win32Exception -ArgumentList $errorCode)
    }
}

function Clear-AwakeRequest {
    $previousState = [KeepAwakeNativeMethods]::SetThreadExecutionState($ExecutionStateContinuous)
    if ($previousState -eq 0) {
        $errorCode = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
        throw (New-Object System.ComponentModel.Win32Exception -ArgumentList $errorCode)
    }
}

function Start-AwakeSession {
    param(
        [string]$OptionId,
        [int]$Minutes
    )

    try {
        Set-AwakeRequest -IncludeDisplay $script:keepDisplayAwake
        $script:activeOptionId = $OptionId
        $script:expiresAt = (Get-Date).AddMinutes($Minutes)
        $script:lastShownError = $null
    }
    catch {
        try {
            Clear-AwakeRequest
        }
        catch {
        }

        $script:activeOptionId = "error"
        $script:expiresAt = $null
        $script:lastShownError = $_.Exception.Message
    }

    Update-TrayState
}

function Cancel-AwakeSession {
    try {
        Clear-AwakeRequest
        $script:activeOptionId = $null
        $script:expiresAt = $null
        $script:lastShownError = $null
    }
    catch {
        $script:activeOptionId = "error"
        $script:expiresAt = $null
        $script:lastShownError = $_.Exception.Message
    }

    Update-TrayState
}

function Update-DisplayAwake {
    $script:keepDisplayAwake = $script:keepDisplayAwakeItem.Checked

    if ($script:activeOptionId -and $script:activeOptionId -ne "error") {
        try {
            Set-AwakeRequest -IncludeDisplay $script:keepDisplayAwake
            $script:lastShownError = $null
        }
        catch {
            try {
                Clear-AwakeRequest
            }
            catch {
            }

            $script:activeOptionId = "error"
            $script:expiresAt = $null
            $script:lastShownError = $_.Exception.Message
        }
    }

    Update-TrayState
}

function Get-TrayText {
    if ($script:activeOptionId -eq "error") {
        return "Keep Awake: error"
    }

    if (-not $script:activeOptionId -or -not $script:expiresAt) {
        return "Keep Awake: off"
    }

    $remaining = $script:expiresAt - (Get-Date)
    if ($remaining.TotalSeconds -le 0) {
        return "Keep Awake: ending"
    }

    if ($remaining.TotalHours -ge 1) {
        return "Keep Awake: {0}h {1}m left" -f [int][Math]::Floor($remaining.TotalHours), $remaining.Minutes
    }

    return "Keep Awake: {0}m left" -f [int][Math]::Ceiling($remaining.TotalMinutes)
}

function Update-TrayState {
    if ($script:activeOptionId -and $script:activeOptionId -ne "error" -and $script:expiresAt) {
        if ((Get-Date) -ge $script:expiresAt) {
            Cancel-AwakeSession
            return
        }
    }

    foreach ($key in $script:durationItems.Keys) {
        $script:durationItems[$key].Checked = ($script:activeOptionId -eq $key)
    }

    $script:cancelItem.Enabled = [bool]$script:activeOptionId
    $script:notifyIcon.Text = Get-TrayText

    if ($script:lastShownError) {
        $script:notifyIcon.ShowBalloonTip(5000, "Keep Awake failed", $script:lastShownError, [System.Windows.Forms.ToolTipIcon]::Error)
        $script:lastShownError = $null
    }
}

function Exit-KeepAwakeTray {
    try {
        Clear-AwakeRequest
    }
    catch {
    }

    $script:refreshTimer.Stop()
    $script:notifyIcon.Visible = $false
    [System.Windows.Forms.Application]::Exit()
}

[System.Windows.Forms.Application]::EnableVisualStyles()
[System.Windows.Forms.Application]::SetCompatibleTextRenderingDefault($false)

$script:durationItems = @{}
$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip

$durationOptions = @(
    @{ Id = "30m"; Label = "30 min"; Minutes = 30 },
    @{ Id = "1h"; Label = "1 h"; Minutes = 60 },
    @{ Id = "3h"; Label = "3 h"; Minutes = 180 },
    @{ Id = "6h"; Label = "6 h"; Minutes = 360 }
)

foreach ($option in $durationOptions) {
    $item = New-Object System.Windows.Forms.ToolStripMenuItem
    $item.Text = $option.Label
    $item.CheckOnClick = $false

    $optionId = $option.Id
    $minutes = $option.Minutes
    $item.Add_Click({
        Start-AwakeSession -OptionId $optionId -Minutes $minutes
    }.GetNewClosure())

    [void]$script:durationItems.Add($option.Id, $item)
    [void]$contextMenu.Items.Add($item)
}

[void]$contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator))

$script:keepDisplayAwakeItem = New-Object System.Windows.Forms.ToolStripMenuItem
$script:keepDisplayAwakeItem.Text = "Keep display on"
$script:keepDisplayAwakeItem.CheckOnClick = $true
$script:keepDisplayAwakeItem.Add_CheckedChanged({
    Update-DisplayAwake
})
[void]$contextMenu.Items.Add($script:keepDisplayAwakeItem)

$script:cancelItem = New-Object System.Windows.Forms.ToolStripMenuItem
$script:cancelItem.Text = "Cancel"
$script:cancelItem.Enabled = $false
$script:cancelItem.Add_Click({
    Cancel-AwakeSession
})
[void]$contextMenu.Items.Add($script:cancelItem)

[void]$contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator))

$exitItem = New-Object System.Windows.Forms.ToolStripMenuItem
$exitItem.Text = "Exit"
$exitItem.Add_Click({
    Exit-KeepAwakeTray
})
[void]$contextMenu.Items.Add($exitItem)

$script:notifyIcon = New-Object System.Windows.Forms.NotifyIcon
$script:notifyIcon.ContextMenuStrip = $contextMenu
$script:notifyIcon.Icon = [System.Drawing.SystemIcons]::Application
$script:notifyIcon.Text = "Keep Awake: off"
$script:notifyIcon.Visible = $true
$script:notifyIcon.Add_DoubleClick({
    Start-AwakeSession -OptionId "30m" -Minutes 30
})

$script:refreshTimer = New-Object System.Windows.Forms.Timer
$script:refreshTimer.Interval = 1000
$script:refreshTimer.Add_Tick({
    Update-TrayState
})
$script:refreshTimer.Start()

try {
    Update-TrayState
    [System.Windows.Forms.Application]::Run()
}
finally {
    try {
        Clear-AwakeRequest
    }
    catch {
    }

    if ($script:refreshTimer) {
        $script:refreshTimer.Stop()
        $script:refreshTimer.Dispose()
    }

    if ($script:notifyIcon) {
        $script:notifyIcon.Visible = $false
        $script:notifyIcon.Dispose()
    }

    if ($contextMenu) {
        $contextMenu.Dispose()
    }
}
