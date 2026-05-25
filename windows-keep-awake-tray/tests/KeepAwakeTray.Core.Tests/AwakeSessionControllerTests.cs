using KeepAwakeTray.Core;

namespace KeepAwakeTray.Core.Tests;

public sealed class AwakeSessionControllerTests
{
    private static readonly DateTimeOffset StartTime = new(2026, 5, 25, 9, 0, 0, TimeSpan.Zero);

    [Fact]
    public void StartRequestsAwakeAndStoresExpiry()
    {
        var platform = new RecordingExecutionStateController();
        var clock = new FakeClock(StartTime);
        using var controller = new AwakeSessionController(platform, clock);

        controller.Start(AwakeDurationOption.ThirtyMinutes, keepDisplayAwake: false);

        Assert.Equal(AwakeSessionStatus.Active, controller.State.Status);
        Assert.Equal(AwakeDurationOption.ThirtyMinutes, controller.State.Option);
        Assert.Equal(StartTime.AddMinutes(30), controller.State.ExpiresAt);
        Assert.False(controller.State.KeepDisplayAwake);
        Assert.Equal([new AwakeRequest(false)], platform.Requests);
        Assert.Equal(0, platform.ClearCount);
    }

    [Fact]
    public void StartCanRequestDisplayAwake()
    {
        var platform = new RecordingExecutionStateController();
        using var controller = new AwakeSessionController(platform, new FakeClock(StartTime));

        controller.Start(AwakeDurationOption.OneHour, keepDisplayAwake: true);

        Assert.Equal([new AwakeRequest(true)], platform.Requests);
        Assert.True(controller.State.KeepDisplayAwake);
    }

    [Fact]
    public void StartingNewDurationReplacesStateAndDisposesOneRequest()
    {
        var platform = new RecordingExecutionStateController();
        var clock = new FakeClock(StartTime);
        var controller = new AwakeSessionController(platform, clock);

        controller.Start(AwakeDurationOption.ThirtyMinutes, keepDisplayAwake: false);
        clock.Now = StartTime.AddMinutes(10);
        controller.Start(AwakeDurationOption.ThreeHours, keepDisplayAwake: true);
        controller.Dispose();

        Assert.Equal([new AwakeRequest(false), new AwakeRequest(true)], platform.Requests);
        Assert.Equal(1, platform.ClearCount);
    }

    [Fact]
    public void CheckExpiredClearsRequestExactlyOnce()
    {
        var platform = new RecordingExecutionStateController();
        var clock = new FakeClock(StartTime);
        using var controller = new AwakeSessionController(platform, clock);

        controller.Start(AwakeDurationOption.ThirtyMinutes, keepDisplayAwake: false);
        clock.Now = StartTime.AddMinutes(30);

        Assert.True(controller.CheckExpired());
        Assert.Equal(AwakeSessionStatus.Inactive, controller.State.Status);
        Assert.Equal(1, platform.ClearCount);
        Assert.False(controller.CheckExpired());
        Assert.Equal(1, platform.ClearCount);
    }

    [Fact]
    public void CancelClearsRequestAndMarksInactive()
    {
        var platform = new RecordingExecutionStateController();
        using var controller = new AwakeSessionController(platform, new FakeClock(StartTime));

        controller.Start(AwakeDurationOption.SixHours, keepDisplayAwake: true);
        controller.Cancel();

        Assert.Equal(AwakeSessionStatus.Inactive, controller.State.Status);
        Assert.True(controller.State.KeepDisplayAwake);
        Assert.Equal(1, platform.ClearCount);
    }

    [Fact]
    public void DisposeClearsActiveRequest()
    {
        var platform = new RecordingExecutionStateController();
        var controller = new AwakeSessionController(platform, new FakeClock(StartTime));

        controller.Start(AwakeDurationOption.OneHour, keepDisplayAwake: false);
        controller.Dispose();
        controller.Dispose();

        Assert.Equal(1, platform.ClearCount);
    }

    [Fact]
    public void FailedRequestLeavesFailedStateAndAttemptsCleanup()
    {
        var platform = new RecordingExecutionStateController
        {
            RequestException = new InvalidOperationException("power request failed")
        };
        using var controller = new AwakeSessionController(platform, new FakeClock(StartTime));

        controller.Start(AwakeDurationOption.OneHour, keepDisplayAwake: false);

        Assert.Equal(AwakeSessionStatus.Failed, controller.State.Status);
        Assert.Equal("power request failed", controller.State.ErrorMessage);
        Assert.Equal(1, platform.ClearCount);
    }

    [Fact]
    public void DisplayAwakeToggleReissuesActiveRequest()
    {
        var platform = new RecordingExecutionStateController();
        using var controller = new AwakeSessionController(platform, new FakeClock(StartTime));

        controller.Start(AwakeDurationOption.OneHour, keepDisplayAwake: false);
        controller.SetKeepDisplayAwake(true);

        Assert.Equal([new AwakeRequest(false), new AwakeRequest(true)], platform.Requests);
        Assert.True(controller.State.KeepDisplayAwake);
        Assert.Equal(AwakeSessionStatus.Active, controller.State.Status);
    }

    private sealed class FakeClock(DateTimeOffset now) : IClock
    {
        public DateTimeOffset Now { get; set; } = now;
    }

    private sealed class RecordingExecutionStateController : IExecutionStateController
    {
        public List<AwakeRequest> Requests { get; } = [];

        public int ClearCount { get; private set; }

        public Exception? RequestException { get; init; }

        public void RequestAwake(AwakeRequest request)
        {
            if (RequestException is not null)
            {
                throw RequestException;
            }

            Requests.Add(request);
        }

        public void ClearAwakeRequest()
        {
            ClearCount++;
        }
    }
}
