using KeepAwakeTray.Core;

namespace KeepAwakeTray.Windows;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        ApplicationConfiguration.Initialize();

        using var executionStateController = new WindowsExecutionStateController();
        using var sessionController = new AwakeSessionController(executionStateController, SystemClock.Instance);
        using var context = new TrayApplicationContext(sessionController);

        try
        {
            Application.Run(context);
        }
        finally
        {
            sessionController.Dispose();
            executionStateController.Dispose();
        }
    }
}
