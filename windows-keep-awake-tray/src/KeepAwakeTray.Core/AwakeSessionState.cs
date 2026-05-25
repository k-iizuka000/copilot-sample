namespace KeepAwakeTray.Core;

public enum AwakeSessionStatus
{
    Inactive,
    Active,
    Failed
}

public sealed record AwakeSessionState(
    AwakeSessionStatus Status,
    AwakeDurationOption? Option,
    DateTimeOffset? ExpiresAt,
    bool KeepDisplayAwake,
    string? ErrorMessage)
{
    public static AwakeSessionState Inactive(bool keepDisplayAwake = false) =>
        new(AwakeSessionStatus.Inactive, null, null, keepDisplayAwake, null);

    public static AwakeSessionState Active(
        AwakeDurationOption option,
        DateTimeOffset expiresAt,
        bool keepDisplayAwake) =>
        new(AwakeSessionStatus.Active, option, expiresAt, keepDisplayAwake, null);

    public static AwakeSessionState Failed(string errorMessage, bool keepDisplayAwake) =>
        new(AwakeSessionStatus.Failed, null, null, keepDisplayAwake, errorMessage);
}
