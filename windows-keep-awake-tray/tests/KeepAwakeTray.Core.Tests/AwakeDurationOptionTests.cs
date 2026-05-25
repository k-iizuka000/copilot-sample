using KeepAwakeTray.Core;

namespace KeepAwakeTray.Core.Tests;

public sealed class AwakeDurationOptionTests
{
    [Fact]
    public void AllContainsOnlyRequestedDurationsInMenuOrder()
    {
        var options = AwakeDurationOption.All;

        Assert.Equal(["30m", "1h", "3h", "6h"], options.Select(option => option.Id).ToArray());
        Assert.Equal(["30 min", "1 h", "3 h", "6 h"], options.Select(option => option.Label).ToArray());
        Assert.Equal(
            [
                TimeSpan.FromMinutes(30),
                TimeSpan.FromHours(1),
                TimeSpan.FromHours(3),
                TimeSpan.FromHours(6)
            ],
            options.Select(option => option.Duration).ToArray());
    }
}
