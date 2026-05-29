---
name: tdd-workflow
description: 新機能、bug fix、refactorで、失敗するテストから始めて最小実装、refactor、coverage確認まで進めるときに使う。
---

# TDD Workflow

TDD は「テストを書くこと」ではなく、期待挙動を先に固定し、実装をその挙動へ収束させる作業です。

## 使うタイミング

- 新機能を作る
- bug を修正する
- refactor の安全網を作る
- API / UI / domain logic の contract を固定する

## Loop

1. User journey または expected behavior を1文で書く。
2. 失敗する test を追加する。
3. test が正しい理由を確認する。
4. 最小限の実装で green にする。
5. green のまま refactor する。
6. coverage と edge case を確認する。

## Test選択

- Unit: pure logic、domain rule、small service
- Integration: DB、API、external adapter、transaction
- E2E: critical user journey
- Contract: API response、schema、event、message

## Bug fixの場合

- bug の再現条件を test name または comment に残す。
- 修正前に落ちることを確認する。
- 似た edge case を1つ以上追加する。
- regression id や issue id があれば test に紐づける。

## Anti-pattern

- 実装後に snapshot だけ足す
- private method の詳細だけをテストする
- sleep に依存する
- flaky test を放置する
- coverage 数値だけを満たすために意味の薄い test を増やす

## Report

```text
TDD result:
- failing test added:
- implementation:
- tests run:
- coverage:
- not covered:
```
