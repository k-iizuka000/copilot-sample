# GitHub Copilot モデル比較メモ（2026年6月課金変更前提）

調査日: 2026-05-26

このメモは、2026-06-01からのGitHub Copilot usage-based billingを前提に、Copilotで使うモデルの違いを「特性」「トークン単価」「おすすめ用途」で整理したものです。公式GitHub Docs / GitHub Blog / VS Code Docsを主な根拠にし、最後にサブエージェント相当の再調査で漏れ・誤りをチェック済みです。

## 前提

| 項目 | 結論 |
|---|---|
| 課金方式 | 2026-06-01から、CopilotはPremium RequestではなくGitHub AI Creditsの従量課金へ移行 |
| 課金単位 | 入力トークン、出力トークン、cached tokens。`1 AI credit = $0.01 USD` |
| 課金対象 | Copilot Chat、CLI、cloud agent、Spaces、Spark、third-party coding agents |
| 課金対象外 | コード補完、Next Edit suggestions |
| 注意 | Usage-basedでは旧Premium Requestのモデル倍率は基本使わない。年払いPro/Pro+で旧課金に残る場合だけ倍率表が残る |
| 重要な終了予定 | `GPT-4.1`、`GPT-5.2`、`GPT-5.2-Codex` は公式上 `Closing down 2026-06-01` |

## プラン別AI Credits

| プラン | 月額 | Base credits | Flex allotment | 合計/月 | メモ |
|---|---:|---:|---:|---:|---|
| Copilot Pro | $10 | 1,000 | 500 | 1,500 | Flexは可変枠 |
| Copilot Pro+ | $39 | 3,900 | 3,100 | 7,000 | 重めのモデルを使うなら最低ここ |
| Copilot Max | $100 | 10,000 | 10,000 | 20,000 | Agent/高努力モデルを多用する人向け |
| Business | $19/seat | - | - | 1,900/user | 組織プール |
| Enterprise | $39/seat | - | - | 3,900/user | 組織プール |

Business/Enterpriseの既存顧客は、2026-06-01から2026-09-01までプロモ枠としてBusiness `3,000/user`、Enterprise `7,000/user`。

## ユーザー指定モデル比較

単価はすべて「USD / 100万トークン」です。Anthropicだけ `cache write` が別途あります。

| モデル | 状態 | 性格/得意領域 | 入力 | Cached | Cache write | 出力 | 使いどころ |
|---|---|---|---:|---:|---:|---:|---|
| Claude Opus 4.7 | GA | Claude系の最上位。仮説、前提整理、難問推論が強い | 5.00 | 0.50 | 6.25 | 25.00 | 最難関設計/デバッグ。日常使いには高い |
| Claude Opus 4.6 | GA | Opus 4.7より一段前。重い推論向け | 5.00 | 0.50 | 6.25 | 25.00 | 4.7が不安定/使えない時の代替 |
| Claude Opus 4.5 | GA | 旧Opus枠。同価格なら優先度は低め | 5.00 | 0.50 | 6.25 | 25.00 | 基本は4.7/4.6優先 |
| Claude Sonnet 4.6 | GA | バランス型Claude。前提・論点・代替案の整理が上手い | 3.00 | 0.30 | 3.75 | 15.00 | 設計、レビュー、方針相談に強い |
| Claude Sonnet 4.5 | GA | 4.6より前のSonnet | 3.00 | 0.30 | 3.75 | 15.00 | 4.6が使えない時 |
| Claude Haiku 4.5 | GA | 速い・軽い。小さい質問向け | 1.00 | 0.10 | 1.25 | 5.00 | 日常の軽い質問、短い説明 |
| GPT-5.5 | GA | OpenAI最上位。結果収束、複雑判断、技術意思決定 | 5.00 | 0.50 | - | 30.00 | 本当に難しい設計/調査。高コスト |
| GPT-5.4 | GA | 高性能な汎用推論。実装と設計の両方に強い | 2.50 | 0.25 | - | 15.00 | 設計、難しめ実装、複雑デバッグ |
| GPT-5.4 mini | GA | 軽量でコスパ良い。コード探索にも向く | 0.75 | 0.075 | - | 4.50 | 日常使い、軽中量実装の第一候補 |
| GPT-5.3-Codex | GA | Coding/agentic実装寄り。変更・テスト・修正ループ向き | 1.75 | 0.175 | - | 14.00 | 実装の第一候補 |
| GPT-5.2 | Closing down 2026-06-01 | 旧汎用モデル | 1.75 | 0.175 | - | 14.00 | 6月以降は避ける。GPT-5.4へ |
| GPT-5.2-Codex | Closing down 2026-06-01 | 旧Codex | 1.75 | 0.175 | - | 14.00 | 6月以降は避ける。GPT-5.3-Codexへ |
| GPT-5 mini | GA | 最安級。速い。軽量タスク向け | 0.25 | 0.025 | - | 2.00 | 日常の質問、小修正、説明 |
| Gemini 2.5 Pro | GA | 長文・広い文脈・調査寄り。価格も比較的軽い | 1.25 | 0.125 | - | 10.00 | 長い仕様書/ログ/複数資料の整理 |

## 公式に追加で見ておくべきモデル

| モデル | 状態 | 単価 | 注意 |
|---|---|---|---|
| GPT-4.1 | Closing down 2026-06-01 | 2.00 / 0.50 / 8.00 | 6月以降の主力にはしない |
| GPT-5.4 nano | GA | 0.20 / 0.02 / 1.25 | Codex VS Code拡張のみ、Pro+のみ、Copilot Chatでは不可 |
| Gemini 3 Flash | Public preview | 0.50 / 0.05 / 3.00 | 軽量・高速枠 |
| Gemini 3.1 Pro | Public preview | 2.00 / 0.20 / 12.00 | Gemini系の強推論枠 |
| Gemini 3.5 Flash | GA | 1.50 / 0.15 / 9.00 | Flashだが単価はそこまで安くない |
| Raptor mini | Public preview | 0.25 / 0.025 / 2.00 | Fine-tuned GPT-5 mini |
| Goldeneye | Public preview | 1.25 / 0.125 / 10.00 | Fine-tuned GPT-5.1-Codex |
| Claude Opus 4.6 fast mode | Public preview | Usage単価は別行なし | 旧PRU倍率では30x。主力にはしづらい |

## Thinking Effort

| Effort | 使う場面 | トークン/速度への影響 | 判断 |
|---|---|---|---|
| Low | 小修正、説明、定型コード | 低コスト・速い | 日常はここからでよい |
| Medium | 標準的な実装、レビュー、軽い設計 | バランス | 実装の普段使い |
| High | 設計、複雑デバッグ、複数ファイル改修 | thinking tokensが増えやすい | 難しい時に上げる |
| xHigh | 使えるモデルで、詰まった時だけ | さらに高コスト・遅い | 公式のモデル別対応表は未確認。常用非推奨 |

公式Docs上は「利用可能なEffortはモデル/Providerで異なる」です。`GPT-5.4はxHighが使える` のような話はUI上では見える場合があるものの、公式のモデル別対応表としては確認できませんでした。

## おすすめ

| 目的 | 第一候補 | 次点 | 理由 | 例題 |
|---|---|---|---|---|
| 日常使い | GPT-5.4 mini Low/Medium | GPT-5 mini Low | コストが軽く、品質も十分 | 「このエラーの原因を短く説明して」「この関数を読みやすくして」 |
| とにかく安く | GPT-5 mini Low | Claude Haiku 4.5 Low | 出力単価がかなり低い | 「小さいutility関数を書いて」「READMEの一文を直して」 |
| 設計 | Claude Sonnet 4.6 High | GPT-5.4 High | Sonnetは前提・トレードオフ整理がしやすい。GPT-5.4は結論収束が速い | 「DB/API/UIの設計案を3案出して、採用案を決めて」 |
| 実装 | GPT-5.3-Codex Medium/High | GPT-5.4 mini Medium | Codex系は変更、テスト、修正ループに向く | 「このIssueを実装し、テストを追加し、失敗を直して」 |
| 難しいデバッグ | GPT-5.4 High | Claude Opus 4.7 High | コストと性能のバランスならGPT-5.4。最難関はOpus/GPT-5.5 | 「ログと関連ファイルから根本原因を特定して修正方針を出して」 |
| 長い資料/仕様読み | Gemini 2.5 Pro Medium | GPT-5.4 Medium | 長文・広い文脈でコスパがよい | 「この仕様書と既存コードの矛盾点を表にして」 |

## コスト感の例

例: `入力200k tokens + 出力20k tokens`、キャッシュなし、thinking tokensなしの概算。

| モデル | 概算USD | 概算AI Credits |
|---|---:|---:|
| GPT-5 mini | $0.09 | 9 |
| GPT-5.4 mini | $0.24 | 24 |
| Claude Haiku 4.5 | $0.30 | 30 |
| Gemini 2.5 Pro | $0.45 | 45 |
| GPT-5.3-Codex | $0.63 | 63 |
| GPT-5.4 | $0.80 | 80 |
| Claude Sonnet 4.6 | $0.90+cache write | 90+ |
| Claude Opus 4.7 | $1.50+cache write | 150+ |
| GPT-5.5 | $1.60 | 160 |

## 使い分けの結論

| 状況 | おすすめ |
|---|---|
| 普段の質問、軽いコード修正 | `GPT-5.4 mini` |
| とにかく安く回したい | `GPT-5 mini` |
| 実装、テスト、修正ループ | `GPT-5.3-Codex` |
| 設計、論点整理、レビュー | `Claude Sonnet 4.6` または `GPT-5.4` |
| 長い仕様書・ログの整理 | `Gemini 2.5 Pro` |
| 本当に難しい問題 | `Claude Opus 4.7` または `GPT-5.5` |

普段は `GPT-5.4 mini`、実装は `GPT-5.3-Codex`、設計は `Claude Sonnet 4.6` か `GPT-5.4`、詰まった時だけ `Claude Opus 4.7` / `GPT-5.5` が一番バランスいいです。

## Sources

- [GitHub Copilot is moving to usage-based billing](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/)
- [Models and pricing](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing)
- [Supported models](https://docs.github.com/en/copilot/reference/ai-models/supported-models)
- [Usage-based billing for individuals](https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-individuals)
- [Usage-based billing for organizations and enterprises](https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-organizations-and-enterprises)
- [Model comparison](https://docs.github.com/en/copilot/reference/ai-models/model-comparison)
- [VS Code language models and Thinking Effort](https://code.visualstudio.com/docs/copilot/customization/language-models)
