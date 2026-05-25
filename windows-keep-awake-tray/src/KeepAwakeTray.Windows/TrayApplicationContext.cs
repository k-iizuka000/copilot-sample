using KeepAwakeTray.Core;

namespace KeepAwakeTray.Windows;

internal sealed class TrayApplicationContext : ApplicationContext
{
    private readonly AwakeSessionController sessionController;
    private readonly NotifyIcon notifyIcon;
    private readonly ContextMenuStrip contextMenu;
    private readonly Dictionary<string, ToolStripMenuItem> durationItems = [];
    private readonly ToolStripMenuItem keepDisplayAwakeItem;
    private readonly ToolStripMenuItem cancelItem;
    private readonly System.Windows.Forms.Timer refreshTimer;
    private string? lastShownError;

    public TrayApplicationContext(AwakeSessionController sessionController)
    {
        this.sessionController = sessionController;

        contextMenu = new ContextMenuStrip();

        foreach (var option in AwakeDurationOption.All)
        {
            var item = new ToolStripMenuItem(option.Label)
            {
                CheckOnClick = false
            };
            item.Click += (_, _) => StartDuration(option);
            durationItems.Add(option.Id, item);
            contextMenu.Items.Add(item);
        }

        contextMenu.Items.Add(new ToolStripSeparator());

        keepDisplayAwakeItem = new ToolStripMenuItem("Keep display on")
        {
            CheckOnClick = true
        };
        keepDisplayAwakeItem.CheckedChanged += (_, _) => UpdateDisplayAwake();
        contextMenu.Items.Add(keepDisplayAwakeItem);

        cancelItem = new ToolStripMenuItem("Cancel", null, (_, _) => CancelSession())
        {
            Enabled = false
        };
        contextMenu.Items.Add(cancelItem);
        contextMenu.Items.Add(new ToolStripSeparator());
        contextMenu.Items.Add(new ToolStripMenuItem("Exit", null, (_, _) => ExitThread()));

        notifyIcon = new NotifyIcon
        {
            ContextMenuStrip = contextMenu,
            Icon = SystemIcons.Application,
            Text = "Keep Awake: off",
            Visible = true
        };
        notifyIcon.DoubleClick += (_, _) => StartDuration(AwakeDurationOption.ThirtyMinutes);

        refreshTimer = new System.Windows.Forms.Timer
        {
            Interval = 1_000
        };
        refreshTimer.Tick += (_, _) =>
        {
            RefreshState();
            ShowFailureIfNeeded();
        };
        refreshTimer.Start();

        RefreshState();
    }

    protected override void ExitThreadCore()
    {
        refreshTimer.Stop();
        sessionController.Dispose();
        notifyIcon.Visible = false;
        notifyIcon.Dispose();
        contextMenu.Dispose();
        refreshTimer.Dispose();

        base.ExitThreadCore();
    }

    private void StartDuration(AwakeDurationOption option)
    {
        sessionController.Start(option, keepDisplayAwakeItem.Checked);
        RefreshState();
        ShowFailureIfNeeded();
    }

    private void CancelSession()
    {
        sessionController.Cancel();
        RefreshState();
        ShowFailureIfNeeded();
    }

    private void UpdateDisplayAwake()
    {
        sessionController.SetKeepDisplayAwake(keepDisplayAwakeItem.Checked);
        RefreshState();
        ShowFailureIfNeeded();
    }

    private void RefreshState()
    {
        sessionController.CheckExpired();
        var state = sessionController.State;

        foreach (var (optionId, item) in durationItems)
        {
            item.Checked = state.Status is AwakeSessionStatus.Active && state.Option?.Id == optionId;
        }

        cancelItem.Enabled = state.Status is AwakeSessionStatus.Active or AwakeSessionStatus.Failed;
        notifyIcon.Text = BuildTooltip(state);
    }

    private void ShowFailureIfNeeded()
    {
        var state = sessionController.State;
        if (state.Status is not AwakeSessionStatus.Failed || string.IsNullOrWhiteSpace(state.ErrorMessage))
        {
            lastShownError = null;
            return;
        }

        if (lastShownError == state.ErrorMessage)
        {
            return;
        }

        lastShownError = state.ErrorMessage;
        notifyIcon.ShowBalloonTip(5_000, "Keep Awake failed", state.ErrorMessage, ToolTipIcon.Error);
    }

    private static string BuildTooltip(AwakeSessionState state)
    {
        if (state.Status is AwakeSessionStatus.Failed)
        {
            return "Keep Awake: error";
        }

        if (state.Status is not AwakeSessionStatus.Active || state.ExpiresAt is null)
        {
            return "Keep Awake: off";
        }

        var remaining = state.ExpiresAt.Value - DateTimeOffset.Now;
        if (remaining <= TimeSpan.Zero)
        {
            return "Keep Awake: ending";
        }

        if (remaining.TotalHours >= 1)
        {
            return $"Keep Awake: {(int)remaining.TotalHours}h {remaining.Minutes}m left";
        }

        return $"Keep Awake: {Math.Ceiling(remaining.TotalMinutes)}m left";
    }
}
