---
name: ai-regression-testing
description: AI生成変更で起きやすい回帰を、再現テスト、contract test、複数コードパス検証で固定するときに使う。
---

# AI Regression Testing

AI が実装とレビューの両方を担うと、同じ前提ミスを繰り返すことがあります。見つかった bug は「説明」ではなく「落ちるテスト」で固定します。

## 使うタイミング

- AI agent が backend logic、API、DB access、feature flag 周辺を変更した
- bug fix 後に再発防止が必要
- sandbox / production / mock / real DB など複数コードパスがある
- レビューでは正しそうに見えるが実行時の不安が残る

## 基本手順

1. bug の再現条件を1文で書く。
2. 修正前に失敗する focused test を追加する。
3. contract として守る field、status、side effect を明示する。
4. 複数コードパスがある場合は同じ期待値を両方で検証する。
5. 修正後、追加テストと関連 suite を実行する。

## よくあるAI回帰

- production path だけ直し、sandbox / mock path を忘れる
- response field を追加したが query / mapper / DTO のどれかが未対応
- null / empty / permission denied の edge case が落ちる
- migration と entity / generated type がずれる
- feature flag OFF 時の挙動が壊れる

## Contract testの観点

- HTTP status
- response schema と必須 field
- error code と message
- DB write の有無
- authorization の拒否条件
- idempotency

## レポート形式

```text
Regression:
- bug:
- added test:
- fails before fix:
- passes after fix:
- paths covered:
- paths not covered:
```
