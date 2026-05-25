namespace KeepAwakeTray.Core;

public sealed class AwakeSessionController : IDisposable
{
    private readonly IClock clock;
    private readonly IExecutionStateController executionStateController;
    private bool disposed;

    public AwakeSessionController(IExecutionStateController executionStateController, IClock clock)
    {
        this.executionStateController = executionStateController;
        this.clock = clock;
        State = AwakeSessionState.Inactive();
    }

    public AwakeSessionState State { get; private set; }

    public void Start(AwakeDurationOption option, bool keepDisplayAwake)
    {
        ThrowIfDisposed();

        try
        {
            executionStateController.RequestAwake(new AwakeRequest(keepDisplayAwake));
            State = AwakeSessionState.Active(option, clock.Now + option.Duration, keepDisplayAwake);
        }
        catch (Exception exception)
        {
            TryClear();
            State = AwakeSessionState.Failed(exception.Message, keepDisplayAwake);
        }
    }

    public void SetKeepDisplayAwake(bool keepDisplayAwake)
    {
        ThrowIfDisposed();

        if (State.Status is not AwakeSessionStatus.Active || State.Option is null || State.ExpiresAt is null)
        {
            State = State with { KeepDisplayAwake = keepDisplayAwake };
            return;
        }

        try
        {
            executionStateController.RequestAwake(new AwakeRequest(keepDisplayAwake));
            State = AwakeSessionState.Active(State.Option, State.ExpiresAt.Value, keepDisplayAwake);
        }
        catch (Exception exception)
        {
            TryClear();
            State = AwakeSessionState.Failed(exception.Message, keepDisplayAwake);
        }
    }

    public void Cancel()
    {
        ThrowIfDisposed();
        ClearAndMarkInactive(State.KeepDisplayAwake);
    }

    public bool CheckExpired()
    {
        ThrowIfDisposed();

        if (State.Status is not AwakeSessionStatus.Active || State.ExpiresAt is null)
        {
            return false;
        }

        if (clock.Now < State.ExpiresAt.Value)
        {
            return false;
        }

        ClearAndMarkInactive(State.KeepDisplayAwake);
        return true;
    }

    public void Dispose()
    {
        if (disposed)
        {
            return;
        }

        disposed = true;

        if (State.Status is AwakeSessionStatus.Active)
        {
            TryClear();
        }
    }

    private void ClearAndMarkInactive(bool keepDisplayAwake)
    {
        try
        {
            executionStateController.ClearAwakeRequest();
            State = AwakeSessionState.Inactive(keepDisplayAwake);
        }
        catch (Exception exception)
        {
            State = AwakeSessionState.Failed(exception.Message, keepDisplayAwake);
        }
    }

    private void TryClear()
    {
        try
        {
            executionStateController.ClearAwakeRequest();
        }
        catch
        {
            // Best effort cleanup. The caller records the original failure.
        }
    }

    private void ThrowIfDisposed()
    {
        ObjectDisposedException.ThrowIf(disposed, this);
    }
}
