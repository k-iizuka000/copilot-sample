# チェックポイントコマンド

ワークフロー内でチェックポイントを作成または検証します。

## 使用方法

`/checkpoint [create|verify|list] [name]`

## チェックポイント作成

チェックポイントを作成する場合：

1. `/verify quick` を実行して現在の状態が clean であることを確認
2. チェックポイント名を使用して git stash またはコミットを作成
3. チェックポイントを `.claude/checkpoints.log` に記録：

```bash
echo "$(date +%Y-%m-%d-%H:%M) | $CHECKPOINT_NAME | $(git rev-parse --short HEAD)" >> .claude/checkpoints.log
```

4. チェックポイント作成を報告

## チェックポイント検証

チェックポイントに対して検証する場合：

1. ログからチェックポイントを読む

2. 現在の状態をチェックポイントと比較：
   * チェックポイント以降に追加されたファイル
   * チェックポイント以降に修正されたファイル
   * 現在のテスト成功率と当時の比較
   * 現在のカバレッジと当時の比較

3. レポート：

```
チェックポイント比較: $NAME
============================
変更ファイル数: X
テスト: +Y 件成功 / -Z 件失敗
カバレッジ: +X% / -Y%
ビルド: [PASS/FAIL]
```

## チェックポイント一覧表示

すべてのチェックポイントを以下を含めて表示：

* 名前
* タイムスタンプ
* Git SHA
* ステータス（current、behind、ahead）

## ワークフロー

一般的なチェックポイントの流れ：

```
[Start] --> /checkpoint create "feature-start"
   |
[Implement] --> /checkpoint create "core-done"
   |
[Test] --> /checkpoint verify "core-done"
   |
[Refactor] --> /checkpoint create "refactor-done"
   |
[PR] --> /checkpoint verify "feature-start"
```

## 引数

$ARGUMENTS:

* `create <name>` - 指定の名前でチェックポイント作成
* `verify <name>` - 指定の名前のチェックポイントに対して検証
* `list` - すべてのチェックポイントを表示
* `clear` - 古いチェックポイントを削除（最新 5 個を保持）
