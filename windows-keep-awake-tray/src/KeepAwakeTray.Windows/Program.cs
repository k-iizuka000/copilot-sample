using KeepAwakeTray.Core;

namespace KeepAwakeTray.Windows;

internal static class Program
{
    private static bool fatalErrorLoggingRegistered;

    [STAThread]
    private static int Main(string[] args)
    {
        RegisterFatalErrorLogging();

        if (args.Any(arg => string.Equals(arg, "--smoke-test", StringComparison.OrdinalIgnoreCase)))
        {
            return RunSmokeTest();
        }

        return RunTrayApplication();
    }

    private static int RunTrayApplication()
    {
        AppLogger.Info("Starting KeepAwakeTray tray application.");

        try
        {
            ApplicationConfiguration.Initialize();

            using var executionStateController = new WindowsExecutionStateController();
            using var sessionController = new AwakeSessionController(executionStateController, SystemClock.Instance);
            using var context = new TrayApplicationContext(sessionController);

            Application.Run(context);
            AppLogger.Info("KeepAwakeTray tray application exited.");
            return 0;
        }
        catch (Exception exception)
        {
            AppLogger.Error("Fatal error in KeepAwakeTray tray application.", exception);
            ShowFatalError("Keep Awake Tray could not start.", exception);
            return 1;
        }
    }

    private static int RunSmokeTest()
    {
        AppLogger.Info("Starting KeepAwakeTray smoke test.");

        try
        {
            using var executionStateController = new WindowsExecutionStateController();
            executionStateController.RequestAwake(new AwakeRequest(KeepDisplayAwake: false));
            AppLogger.Info("Smoke test requested awake without display.");
            executionStateController.ClearAwakeRequest();
            AppLogger.Info("Smoke test cleared awake request.");
            AppLogger.Info("KeepAwakeTray smoke test completed successfully.");
            return 0;
        }
        catch (Exception exception)
        {
            AppLogger.Error("KeepAwakeTray smoke test failed.", exception);
            return 1;
        }
    }

    private static void RegisterFatalErrorLogging()
    {
        if (fatalErrorLoggingRegistered)
        {
            return;
        }

        fatalErrorLoggingRegistered = true;
        Application.ThreadException += (_, args) =>
        {
            AppLogger.Error("Unhandled UI thread error in KeepAwakeTray.", args.Exception);
            ShowFatalError("Keep Awake Tray hit an unexpected error.", args.Exception);
        };
        AppDomain.CurrentDomain.UnhandledException += (_, args) =>
        {
            if (args.ExceptionObject is Exception exception)
            {
                AppLogger.Error("Unhandled fatal error in KeepAwakeTray.", exception);
            }
            else
            {
                AppLogger.Info($"Unhandled fatal error in KeepAwakeTray. ExceptionObject={args.ExceptionObject}.");
            }
        };
    }

    private static void ShowFatalError(string message, Exception exception)
    {
        try
        {
            MessageBox.Show(
                $"{message}{Environment.NewLine}{Environment.NewLine}{exception.Message}{Environment.NewLine}{Environment.NewLine}Log: {AppLogger.LogPath}",
                "Keep Awake Tray",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
        catch
        {
            // If the UI stack is unavailable, the log is the remaining diagnostic path.
        }
    }
}
