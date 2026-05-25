using System.ComponentModel;
using System.Runtime.InteropServices;
using KeepAwakeTray.Core;

namespace KeepAwakeTray.Windows;

internal sealed class WindowsExecutionStateController : IExecutionStateController, IDisposable
{
    private bool disposed;

    public void RequestAwake(AwakeRequest request)
    {
        ThrowIfDisposed();

        var flags = ExecutionState.Continuous | ExecutionState.SystemRequired;
        if (request.KeepDisplayAwake)
        {
            flags |= ExecutionState.DisplayRequired;
        }

        SetExecutionStateOrThrow(flags);
    }

    public void ClearAwakeRequest()
    {
        ThrowIfDisposed();
        SetExecutionStateOrThrow(ExecutionState.Continuous);
    }

    public void Dispose()
    {
        if (disposed)
        {
            return;
        }

        try
        {
            ClearAwakeRequest();
        }
        catch
        {
            // Nothing useful can be done during process shutdown.
        }
        finally
        {
            disposed = true;
        }
    }

    private static void SetExecutionStateOrThrow(ExecutionState flags)
    {
        var previousState = NativeMethods.SetThreadExecutionState(flags);
        if (previousState is ExecutionState.None)
        {
            throw new Win32Exception(Marshal.GetLastWin32Error());
        }
    }

    private void ThrowIfDisposed()
    {
        ObjectDisposedException.ThrowIf(disposed, this);
    }

    [Flags]
    private enum ExecutionState : uint
    {
        None = 0,
        SystemRequired = 0x00000001,
        DisplayRequired = 0x00000002,
        Continuous = 0x80000000
    }

    private static partial class NativeMethods
    {
        [DllImport("kernel32.dll", SetLastError = true)]
        internal static extern ExecutionState SetThreadExecutionState(ExecutionState flags);
    }
}
