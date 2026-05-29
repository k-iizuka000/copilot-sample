---
name: e2e-testing
description: Playwrightを中心にE2Eテスト、Page Object、CI artifact、flaky対策、user journey検証を設計するときに使う。
---

# E2E Testing

E2E test は unit test の代わりではなく、重要な user journey と system integration を守るために使います。

## Related assets

- 主な入口 prompts: `e2e`, `orchestrate`, `verify`
- 主な agents: `e2e-runner`
- 関連 instructions: `testing`, `security`

## 使うタイミング

- login、checkout、作成、検索など critical flow を守る
- frontend と backend の contract をまとめて検証する
- bug の再発をブラウザ操作で固定する
- release 前の smoke test を作る

## テスト設計

- test は user intent を名前にする。
- selector は `data-testid` など安定したものを使う。
- Page Object は navigation と操作をまとめ、assertion は test 側に寄せる。
- network idle だけに依存せず、期待する UI / response を待つ。
- 失敗時 artifact と trace を残す。

## Playwright設定の要点

- CI では retry と trace を有効化する。
- `forbidOnly` を CI で有効にする。
- local server は `webServer` で起動し、既存 server 再利用を設定する。
- desktop と mobile の代表 viewport を最低限確認する。

## Flaky対策

- sleep ではなく locator / response / state を待つ。
- test data を独立させる。
- 並列実行で共有状態を壊さない。
- flaky test は quarantine し、issue と修正期限を付ける。
- `repeat-each` で再現性を測る。

## CI artifact

- HTML report
- trace
- screenshot on failure
- video on failure
- junit / json result

## 完了条件

- critical flow が headless CI で通る
- 失敗時に原因追跡できる artifact が残る
- test data cleanup がある
- E2E ではなく unit / integration に下げるべき assertion を混ぜすぎていない
