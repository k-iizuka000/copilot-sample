namespace KeepAwakeTray.Core;

public interface IExecutionStateController
{
    void RequestAwake(AwakeRequest request);

    void ClearAwakeRequest();
}
