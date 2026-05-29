---
name: ai-first-engineering
description: AIが実装量を大きく担うチームで、計画、レビュー、テスト、ロールアウトを品質中心に設計するときに使う。
---

# AIファーストエンジニアリング

AI支援で出荷速度を上げるときは、タイピング量ではなく「仕様の明確さ」「検証の強さ」「レビュー観点」が成果を決めます。

## Related assets

- 主な入口 prompts: `orchestrate`, `plan`, `learn`, `skill-create`
- 主な agents: `planner`, `architect`
- 関連 instructions: `copilot-instructions`, `documentation`

## 使うタイミング

- AI agent に大きめの実装を任せる前
- チームの開発プロセスやPR基準を整えるとき
- 生成コードのレビュー観点を揃えたいとき
- 品質低下や回帰が増えているとき

## 運用原則

1. 実装前に受け入れ条件と非機能リスクを明文化する。
2. 変更単位を、独立して検証できる小さな作業へ分ける。
3. レビューは構文より、挙動、境界条件、データ整合性、セキュリティ、ロールアウト安全性に寄せる。
4. 生成コードには通常より強い regression test を求める。
5. 重要な設計判断は、後から読める形でPRや設計メモへ残す。

## Agent-friendly architecture

- 明示的な module boundary を作る。
- API / DTO / database schema の contract を安定させる。
- 型付き interface と validation を優先する。
- hidden convention や global mutable state を減らす。
- deterministic test を用意し、agent が変更後に自走検証できるようにする。

## レビュー観点

- 既存のユーザーフローを壊していないか
- エラー時のHTTP status、例外、ログが意味を持つか
- 認証、認可、入力検証、secret handling が弱くなっていないか
- migration や deploy が backward-compatible か
- sandbox / production / feature flag など複数経路で同じ contract を守っているか

## 完了の基準

- 変更理由、完了条件、検証コマンドが説明されている
- 触れた挙動に focused test がある
- 重要な失敗モードがテストまたは明示的な未検証事項として扱われている
- リリース時の rollback / monitoring 観点がある
