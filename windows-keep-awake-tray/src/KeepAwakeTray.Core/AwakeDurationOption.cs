namespace KeepAwakeTray.Core;

public sealed record AwakeDurationOption(string Id, string Label, TimeSpan Duration)
{
    public static readonly AwakeDurationOption ThirtyMinutes = new("30m", "30 min", TimeSpan.FromMinutes(30));
    public static readonly AwakeDurationOption OneHour = new("1h", "1 h", TimeSpan.FromHours(1));
    public static readonly AwakeDurationOption ThreeHours = new("3h", "3 h", TimeSpan.FromHours(3));
    public static readonly AwakeDurationOption SixHours = new("6h", "6 h", TimeSpan.FromHours(6));

    public static IReadOnlyList<AwakeDurationOption> All { get; } =
    [
        ThirtyMinutes,
        OneHour,
        ThreeHours,
        SixHours
    ];
}
