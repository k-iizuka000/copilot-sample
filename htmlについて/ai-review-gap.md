# AIのスピードに人が追いつかない：詳細設計をレビューできない問題と対策

**要旨（2026-08-25）**

AIが出した詳細設計を誰もレビューできない問題は、現場固有の悩みではなく、出力速度が人の理解速度を追い越す構造として研究・調査でも観測されています。 本資料は、この問題を4つの原因に整理し、対策7件と、現行開発フローを自動化レベルで段階化する提言を示します。 最後に、チームがA〜Gのうち最初に着手する対策を選べる状態にします。

## 1. 今、こういう問題が起きています

現行フローには人のチェックとブロッキングが含まれますが、判断できる人が追いつかないとゲートは機能しません。

`設計書（Excel） → LLM → 中間JSON → LLM → 詳細設計書（Markdown） → 人がチェック → LLMがタスク分解 → LLMがタスク単位でTDD実装 → 人が仕様書・詳細設計と実装を突き合わせ`

- 詳細設計に落とせないときはブロッキングし、解消後に次工程へ進む運用です。
- 設計書の不備や抜け漏れが多く、その補完をLLMに頼る箇所があります。
- AIの出力速度に人の理解とレビューが追いつかず、AIが出した詳細設計を誰も十分にレビューできない状態が起きています。
- 結果として、人が見るべき成果物の認知負荷が高くなっています。

> **Cognitive debt（認知的負債）**とは、出力速度と理解速度のギャップです。AIは秒で数百行を出せますが、人の理解速度は同じようには加速しません。組織は速度を計測しても理解不足を可視化しにくく、ジュニアの生成量がシニアの監査能力を上回る構造が生まれます。  
> 出典: [Cognitive debt: When velocity exceeds comprehension](https://www.rockoder.com/beyondthecode/cognitive-debt-when-velocity-exceeds-comprehension/)（HN 507pt、2026-02）

### これは研究でも観測されています

数値は出典どおりであり、丸めていません。

| 知見 | 数値・要点 | 出典リンク |
|---|---|---|
| レビュー済みと理解済みは別 | "The organizational assumption that reviewed code is understood code no longer holds"（「レビュー済みのコードは理解済みのコードである、という組織の前提はもはや成り立たない」） | [HN 47196582](https://news.ycombinator.com/item?id=47196582) |
| 文脈がないレビューの負荷 | "Reviewing PR feels even more implicit, I have to exert deliberate effort because tacit knowledge of context didn't form yet"（「PRレビューはさらに暗黙的に感じる。文脈についての暗黙知がまだ形成されていないため、意図的な努力が必要になる」） | [HN 47196582](https://news.ycombinator.com/item?id=47196582) |
| comprehension debt | 動作はしても、設計理論（Naurのtheory of a program）がないコードを指します。 | [HN 45423917](https://news.ycombinator.com/item?id=45423917) |
| 信頼と批判的思考 | Microsoft ResearchのCHI 2025調査では、知識労働者319名・936事例で、AIへの信頼が高いほど批判的思考は減り、自分のスキルへの自信が高いほど増えました。 | [Microsoft Research CHI 2025](https://www.microsoft.com/en-us/research/publication/the-impact-of-generative-ai-on-critical-thinking-self-reported-reductions-in-cognitive-effort-and-confidence-effects-from-a-survey-of-knowledge-workers/) |
| 体感と実測の乖離 | METRのRCTでは、経験豊富なOSS開発者の事前予想は+24%高速化、実測は−19%低速化、事後認識は+20%で、逆方向に39pt乖離しました。 | [METR RCT](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) |
| AIコードへの不満と信頼 | Stack Overflow Developer Survey 2025では、「ほぼ正しいが微妙に違う」が最大の不満66%、AIコードのデバッグに時間がかかるが45%、AIを信頼33%・不信46%・強く信頼3%でした。 | [Stack Overflow Developer Survey 2025](https://survey.stackoverflow.co/2025) |
| 初学者の理解 | CS学生32名・160タスクの研究では、初学者のLLM生成コードの理解成功率は32.5%でした。 | [arXiv 2504.19037](https://arxiv.org/abs/2504.19037) |
| AI PRのレビュー結果 | 説明と実装が食い違うAI PRは受理率28.3%で、人間のPRは80%でした。23,247件のエージェントPR分析では、AI PRはマージまで3.5倍の時間を要しました。 | [arXiv 2601.21276](https://arxiv.org/abs/2601.21276) |

## 2. 整理すると、問題は4点に集約されます

研究知見と現場の状況を重ねると、問題は次の4点に整理できます。

| 論点 | 何が起きるか | 根拠と出典 |
|---|---|---|
| 量が理解速度を超える | 詳細設計やMarkdownの量が増えるほど、人は内容ではなく読む量に押し流されます。仕様段階と実装後で二重にレビューする負担も生じます。 | [Cognitive debt](https://www.rockoder.com/beyondthecode/cognitive-debt-when-velocity-exceeds-comprehension/)／[marmelab：8ファイル1,300行と二重レビュー負担](https://marmelab.com/blog/2025/11/12/spec-driven-development-waterfall-strikes-back.html)／[Martin Fowler：冗長なMarkdownはコードよりレビューしにくい](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html) |
| 信頼が検証を減らす | AIを信頼するほど批判的思考が減り、出力を確認する行動が弱まります。高スキル者は4.7倍多く検証行動を取るため、検証の差が理解の差になります。 | [Microsoft Research CHI 2025](https://www.microsoft.com/en-us/research/publication/the-impact-of-generative-ai-on-critical-thinking-self-reported-reductions-in-cognitive-effort-and-confidence-effects-from-a-survey-of-knowledge-workers/)／[arXiv 2511.02922](https://arxiv.org/abs/2511.02922)／[arXiv 2603.16975：日常利用79%と無批判な採用・スキル侵食](https://arxiv.org/abs/2603.16975) |
| 「レビュー済み = 理解済み」が成立しない | 完全委任では認知的関与が入る場所がなく、動く成果物を承認しても設計の理解が形成されません。初学者はAI支援中に自信を持っても、支援なしのタスクへ知識が転移しません。 | [HN 47196582](https://news.ycombinator.com/item?id=47196582)／[HN 45423917](https://news.ycombinator.com/item?id=45423917)／[arXiv 2601.20245](https://arxiv.org/abs/2601.20245)／[arXiv 2508.05999](https://arxiv.org/abs/2508.05999) |
| 体感と実測が逆で、悪化に気づけない | 便利という体感は、レビュー品質や手戻りの改善を保証しません。自己申告の速度だけで判断すると、チーム全体の安定性低下を見落とします。 | [METR RCT](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/)（2026-02の[選抜バイアス注記](https://metr.org/blog/2026-02-24-uplift-update/)あり）／[METR 2026-05：349名、中央値3倍速、歴史的に約40pt過大](https://metr.org/blog/2026-05-11-ai-usage-survey/)／[DORA 2024](https://dora.dev/research/2024/dora-report/) |

### 数字は割れています。整合的にはどう読むべきか

速くなった実測もあります。企業300名の調査ではPRレビュー時間は−31.8%、出荷量は+28%であり、Microsoft ResearchのCopilot統制実験ではタスク完了時間は−55.8% (n=95)でした。 [arXiv 2509.19708](https://arxiv.org/abs/2509.19708) [Microsoft Research](https://www.microsoft.com/en-us/research/publication/the-impact-of-ai-on-developer-productivity-evidence-from-github-copilot/)

一方でDORA 2024は、AI採用で個人生産性は上がるが、ソフトウェアデリバリーの安定性とスループットは下がると報告しています。したがって、これらは矛盾ではなく、「個人の作業は速くなり、チームのレビュー・安定性で回収される」と読むと整合します。 [DORA 2024](https://dora.dev/research/2024/dora-report/)

DORA 2025は、"AI's primary role is an amplifier, magnifying an organization's existing strengths and weaknesses"（「AIの主な役割は増幅器であり、組織にある強みと弱みを拡大する」）と述べています。設計書の不備が多いという自分たちの弱みも、AIによって速く下流工程へ流れると読めます。 [DORA 2025](https://dora.dev/research/2025/dora-report/)

## 3. だから、7件の対策を取ります

各対策を「何をするか / なぜ効くか / 効果」で示します。

### 3.1 レビュー単位を小さくする

- **何をするか**: 詳細設計を一括で読ませず、原本の項目、変更単位、確認したい判断ごとに区切ります。
- **なぜ効くか**: 8ファイル1,300行のMarkdownと、仕様段階・実装後の二重レビューは負担になりました。冗長なMarkdownはコードよりレビューしにくく、詳細仕様でもエージェントが指示を無視・誤適用する「制御の幻想」があります。 [marmelab](https://marmelab.com/blog/2025/11/12/spec-driven-development-waterfall-strikes-back.html) [Martin Fowler](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)
- **効果**: 人は全文を読んで安心するのではなく、担当する判断を確認できます。

### 3.2 対応表（トレーサビリティ）で全文読みをやめる

- **何をするか**: 設計書の項目、詳細設計、テスト、実装の対応表を出し、人は対応の切れ目だけを確認します。
- **なぜ効くか**: ReqToCodeは要件をコードの構造的プロパティとして埋め込み、ビルド時に破損リンクを段階検出します。TraceLLMも、要件と成果物の間のトレーサビリティを半自動化して人のレビュー負荷を減らします。 [ReqToCode](https://arxiv.org/abs/2603.13999) [TraceLLM](https://arxiv.org/abs/2602.01253)
- **効果**: 国内事例では、対象リスト・定義・フロー・検証項目の4連動箇所を機械照合し、不備を5〜8件から1件以下にしました。 [Qiita事例](https://qiita.com/kane_ryu/items/c463c0cfb2e0f598f800)

### 3.3 レビュー観点を人 / 機械 / LLMで分ける

- **何をするか**: 形式検査は機械に寄せ、意味の下読みはLLMに任せ、業務的妥当性は人が判断します。設計書レビューの11観点を、人が見るものと自動実施できるものに分類します。 [arXiv 2509.09975](https://arxiv.org/abs/2509.09975)
- **なぜ効くか**: EARSの5文型、要件リンター、INCOSE GtWRの9品質特性、`[NEEDS CLARIFICATION]` の残存ブロックは、形式的な不備を機械で検出する材料になります。 [EARS](https://alistairmavin.com/ears/) [vale-ears](https://github.com/tbhb/vale-ears) [reqlint](https://github.com/Wyzer-it/reqlint) [INCOSE GtWR](https://www.incose.org/docs/default-source/working-groups/requirements-wg/guidetowritingrequirements/incose_rwg_gtwr_v4_summary_sheet.pdf) [spec-kit](https://github.com/github/spec-kit/tree/main/templates)
- **効果**: Claude Code hooksのいう "deterministic control: certain actions always happen rather than relying on the LLM to choose to run them"（「LLMが実行を選ぶことに頼らず、特定の行為を必ず起こす決定論的な制御」）として、形式検査を確実に通せます。 [Claude Code hooks](https://code.claude.com/docs/en/hooks-guide)

### 3.4 「読む」から「問う」へ変える

- **何をするか**: レビュー成果物を承認ではなく質問と回答にします。たとえば「この項目は原本のどこから来たか」への回答を残し、答えられない箇所は差し戻します。
- **なぜ効くか**: 完全委任より認知的関与を保つパターンの方が学習を維持します。CopilotLensはAIの思考過程を可視化し、批判的評価を可能にします。 [arXiv 2601.20245](https://arxiv.org/abs/2601.20245) [CopilotLens](https://arxiv.org/abs/2506.20062)
- **効果**: Googleは、手動トリガー必須の機能は不採用に終わり、既存操作フローに統合された機能だけが高採用率だったと報告しています。質問を既存フローに埋め込めば、追加の判断コストを増やしません。 [Google Research](https://research.google/blog/ai-in-software-engineering-at-google-progress-and-the-path-ahead/)

### 3.5 レビューの一部をテストに置き換える

- **何をするか**: テストを先に生成し、人が受入条件と照合して承認します。実装は自動化しても、テストはLLMに書き換えさせません。
- **なぜ効くか**: Property-basedの指摘では修正率64%、バグ修正率は1.4〜1.6倍でした。Metamorphic prompt testingは誤り検出75%、偽陽性8.6%でした。 [Property-based](https://arxiv.org/abs/2506.18315) [Metamorphic prompt testing](https://arxiv.org/abs/2406.06864)
- **効果**: Shopifyはテストをoracleにし、ガードレール・構造化出力・Git操作をモデルの外に置いています。人が読む対象をコードからテストへ移せます。 [Shopify](https://shopify.engineering/building-an-agentic-harness-that-outlasts-the-model) [test-driven verification](https://news.ycombinator.com/item?id=45935763)

### 3.6 reliance drillで過信を測る

- **何をするか**: 意図的に誤りを仕込んだ成果物を流し、担当者が不備を見抜けるかを記録します。
- **なぜ効くか**: reliance drillsは、誤ったAI出力を混ぜて過信を検出し、high-stakes分野での標準化を推奨する手法です。 [arXiv 2409.14055](https://arxiv.org/abs/2409.14055)
- **効果**: 「レビューした」という自己申告ではなく、見抜けたかでレビュー能力を確認できます。自動化レベルの昇格判定にも使えます。

### 3.7 教育の向きを変える — 「AIを信じる」ではなく「自分の領域に自信を持つ」

- **何をするか**: 業務知識、設計観点、検証方法を小さい作業単位で身に付ける教育にします。
- **なぜ効くか**: AIへの信頼が高いほど批判的思考は減り、自分のスキルへの自信が高いほど増えました。高スキル者は4.7倍多く検証行動を取り、AI活用時の思考は生成から検証・統合へ移ります。 [Microsoft Research CHI 2025](https://www.microsoft.com/en-us/research/publication/the-impact-of-generative-ai-on-critical-thinking-self-reported-reductions-in-cognitive-effort-and-confidence-effects-from-a-survey-of-knowledge-workers/) [arXiv 2511.02922](https://arxiv.org/abs/2511.02922) [Microsoft Research 2024](https://www.microsoft.com/en-us/research/publication/taking-flight-with-copilot-early-insights-and-opportunities-of-ai-powered-pair-programming-tools/)
- **効果**: 人はAI出力を受け取る役ではなく、根拠を確認して統合するレビュー役として育ちます。

## 4. 今の開発フローについての評価と提言

> **「全然大丈夫」ではない。骨格は妥当だが、設計目標の置き方に問題があります。**  
> 段階分割、人のゲート、ブロッキングという骨格はKiro / spec-kitと同型で妥当です。しかし、「知識がなくても作業できる状態を作る」を目標にすると、レビュー役が育たず、人のゲートが形式化（ハンコ化）します。ボトルネックは消えず、「誰も判断できない場所」へ移動します。理解するまではAIと相談し、小さいスキルから大きい自動化へ進むという仮説は、認知的関与と段階的な自動化を支持する知見と整合します。 [spec-kit](https://github.com/github/spec-kit/tree/main/templates) [arXiv 2601.20245](https://arxiv.org/abs/2601.20245)

### 今起きている / 起きると想定される問題

| # | 問題 | 中身と根拠 |
|---|---|---|
| 1 | 人のゲートが機能しない | 詳細設計・実装後のチェックを人が行っても、業務知識と見る観点がなければ承認だけが流れます。「レビュー済み = 理解済み」は成立しません。LLM生成コードには、2,735シナリオ分析で示された複雑性過剰・不要コメント・未知APIによるreadability debt（読む側の負担）もあります。 [HN 47196582](https://news.ycombinator.com/item?id=47196582) [Microsoft Research CHI 2025](https://www.microsoft.com/en-us/research/publication/the-impact-of-generative-ai-on-critical-thinking-self-reported-reductions-in-cognitive-effort-and-confidence-effects-from-a-survey-of-knowledge-workers/) [arXiv 2605.13280](https://arxiv.org/abs/2605.13280) |
| 2 | 理解が形成される場所がない | 詳細設計生成からTDD実装までを任せる構造は、認知的関与の隙間がない完全委任です。完全委任は生産性を上げても学習を下げます。 [arXiv 2601.20245](https://arxiv.org/abs/2601.20245) |
| 3 | ブロッキングの判定者がLLMになる | 「詳細設計に落とせないときブロック」は、解消を判断できる人がいて初めて機能します。いなければLLMが不備を補い、自分の仕様を自分で採点する形になります。 [moai-adk](https://github.com/modu-ai/moai-adk) |
| 4 | 設計書の不備が静かに流れる | LLMが設計書の不備を埋めても、その正しさを人が見なければ不備は実装へ流れます。要件の曖昧性は全LLMの性能を下げ、LLMは曖昧性を自律的に識別できません。 [arXiv 2604.21505](https://arxiv.org/abs/2604.21505) |
| 5 | 既存の弱みが増幅される | 設計書の不備が多いという既存の弱みをAIが増幅します。個人の作業が速くなっても、安定性とスループットで回収されます。 [DORA 2025](https://dora.dev/research/2025/dora-report/) [DORA 2024](https://dora.dev/research/2024/dora-report/) |
| 6 | 体感で評価している | 「便利」という体感と実測は逆になり得ます。レビュー品質や手戻りを測らなければ、悪化に気づけません。 [METR RCT：39pt乖離](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) |

### A. 自動化レベルを段階化し、人ごとに昇格させる

全員を一斉にL3へ置きません。理解と検証の力を持つ人が、成果物を見抜ける範囲で次のレベルへ進みます。

| Lv | やり方 | 人がやること |
|---|---|---|
| L0 | AIと相談しながら人が詳細設計を書く。AIは質問への回答と不備指摘を担う。 | 詳細設計を書く、根拠を確認する。 |
| L1 | Excel→JSON変換、EARSリンター、対応表生成など、小さいスキルを人が呼ぶ。 | 結果を確認し、修正を判断する。 |
| L2 | スキルを連結した詳細設計生成パイプラインを使う。 | 対応表と質問の形式で必ずレビューする。 |
| L3 | タスクからTDD実装までを全自動化する。 | 人が先に承認したテストを使い、LLMにテストを書き換えさせない。 |

> **昇格条件:** そのレベルの成果物をreliance drill（不備を仕込んだ成果物）で見抜けることです。 [arXiv 2409.14055](https://arxiv.org/abs/2409.14055)

### なぜ A が良いと言えるか (根拠)

段階化そのものを検証した研究は今回の調査では見つかっていません。根拠は、次の 4 つの知見の組み合わせです。

| 主張 | 根拠 | 出典 |
|---|---|---|
| 理解が形成される段階を全員が通る | 完全委任は生産性を上げても学習を下げ、認知的関与を保つパターンでは学習が維持されます。高スキル者は 4.7 倍多く検証行動を取り、それが理解改善に効きます。 | [arXiv 2601.20245](https://arxiv.org/abs/2601.20245) [arXiv 2511.02922](https://arxiv.org/abs/2511.02922) |
| 昇格を自己申告でなく観測で決める | METR の初回 RCT では、経験豊富な OSS 開発者は予想 +24% の高速化に対し、実測 −19%、事後認識 +20% でしたが、後期の再試験では断定できません。reliance drill は誤った AI 出力を混ぜて過信を検出する手法です。 | [METR RCT](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) [arXiv 2409.14055](https://arxiv.org/abs/2409.14055) |
| レビューできる人の能力と現在のモデルの限界に合わせて自動化量を決める | Anthropic は、単純な構成から始め、不足が示されたときだけ複雑にすることを推奨しています。同社は、仕組みの複雑さを現在のモデルの限界に合わせるとしています。 | [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) [Anthropic: Harness design](https://www.anthropic.com/engineering/harness-design-long-running-apps) |
| 弱みを増幅する前に潰す | AI は組織の既存の強みと弱みを増幅します。個人の生産性が上がっても、デリバリーの安定性とスループットは下がります。 | [DORA 2025](https://dora.dev/research/2025/dora-report/) [DORA 2024](https://dora.dev/research/2024/dora-report/) |

### A の弱点と、それぞれの対策

| 弱点 | 対策 | 何が変わるか | 出典 |
|---|---|---|---|
| AI 支援で「読み解く理解」が下がった人を、自動化量だけを基準に昇格させると、成果物を見抜けないまま通すおそれがあります。AI 支援で「書く側の理解」は上がっても「読み解く理解」は下がります。 | レベルを「AI がどれだけやるか」ではなく「人が何を見抜けるか」で定義します。L0 は原本と自分の設計、L1 はツールの出力、L2 は対応表と質問への回答、L3 はテストを見抜く対象にします。 | 昇格判定が「作業量」ではなく「見抜ける対象」になります。drill もその対象に不備を仕込む形に揃います。 | [arXiv 2511.02922](https://arxiv.org/abs/2511.02922) [arXiv 2409.14055](https://arxiv.org/abs/2409.14055) |
| 一度昇格した人の検証能力が落ちても、気づく仕組みがありません。無批判な採用とスキル侵食は開発者調査でも指摘されています。 | 昇格を期限付きにします。一定期間ごとに drill を再実施し、見逃したらレベルを 1 つ下げます。 | drill が 1 回の試験ではなく常設の計測になり、reliance drill の見逃し率がレベル維持の条件になります。 | [arXiv 2603.16975](https://arxiv.org/abs/2603.16975) [arXiv 2409.14055](https://arxiv.org/abs/2409.14055) |
| 人のレベルだけで自動化量を決めると、成果物側の条件を見落とします。要件の曖昧さは全 LLM の性能を下げ、LLM は曖昧さを自律的に識別できません。 | 成果物側にもゲートを置きます。EARS リンターや `[NEEDS CLARIFICATION]` の残存を検出したら、担当者のレベルに関係なく L1 以下 (人が書く・人が確認する) に落とします。 | 自動化量が「人のレベル × 成果物の状態」の 2 軸で決まり、曖昧な設計書が L3 に流れなくなります。 | [arXiv 2604.21505](https://arxiv.org/abs/2604.21505) [EARS](https://alistairmavin.com/ears/) [spec-kit](https://github.com/github/spec-kit/tree/main/templates) |

### B〜G. 現行フローへの適用順序

第3章は一般的な対策と根拠です。ここでは、現行フローのどの工程を変えるか、着手前に何をそろえるか、何で確認するかを比較します。

| 対策 | 現行フローで変えること | 着手前にそろえること | 確認する結果 |
|---|---|---|---|
| B. 上級者向けモードとして残す | 既存の全自動フローは捨てず、上級者向けモードとして残し、当面はL0〜L1を並走させます。 | L0〜L1を担当する人と、Aの昇格条件を定めます。 | reliance drillで不備を見抜ける人だけが次のレベルへ進めることを確認します。 [arXiv 2409.14055](https://arxiv.org/abs/2409.14055) |
| C. 人のゲートに見る観点を持たせる | 設計書レビューの観点を人・機械・LLMに分類し、形式検査はhookとリンターへ寄せ、人には業務的妥当性と対応表の切れ目を渡します。 | 第3章3.3の11観点の分類を、対象の設計書に当てはめます。 [arXiv 2509.09975](https://arxiv.org/abs/2509.09975) [Claude Code hooks](https://code.claude.com/docs/en/hooks-guide) | 形式検査が機械で実施され、人が業務的妥当性を判断できる分担になっていることを確認します。 |
| D. レビュー成果物を質問と回答にする | 承認ではなく、「この項目は原本のどこから来たか」への回答を残します。答えられない箇所は不備として差し戻します。 | 第3章3.4の質問形式を、詳細設計レビューの工程に組み込みます。 [arXiv 2601.20245](https://arxiv.org/abs/2601.20245) [CopilotLens](https://arxiv.org/abs/2506.20062) | 原本との対応を答えられない箇所が差し戻されることを確認します。 |
| E. テストを人が読む工程にする | テストを先に生成し、人が受入条件と照合して承認した後に実装を自動化します。LLMは承認済みテストを書き換えません。 | 第3章3.5のとおり、テストを受入条件と照合する工程を置きます。 [Shopify](https://shopify.engineering/building-an-agentic-harness-that-outlasts-the-model) | 人がコードではなくテストを読み、受入条件と照合して承認できることを確認します。 |
| F. 体感でなく測る | 差し戻し率、後工程で見つかった不備数、reliance drillの見逃し率を記録します。 | 記録する3指標と記録の工程を定めます。 [arXiv 2409.14055](https://arxiv.org/abs/2409.14055) | 便利さではなく、3指標でレビューと手戻りの結果を評価します。 |
| G. 決定論化の目的を言い換える | 目的を「知識不要化」から「人の注意を意味的判断に集中させるため」に言い換えます。形式は機械、意味は人とLLM、最終判断は人が担います。 | 自動化する形式検査と、人が残す意味的判断を分けます。 | 人の注意が業務的妥当性と対応表の切れ目に使われていることを確認します。 |

段階的に複雑さを上げる考え方はAnthropicの指針とも整合します。"Begin with optimized single LLM calls using retrieval and examples. Only add multi-step agentic systems when simpler solutions demonstrably fall short."（「検索と例を使う最適化済みの単一LLM呼び出しから始め、より単純な解決策では明確に不足すると示された場合にだけ、複数段のエージェントシステムを加える」） [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)

"Harness complexity should reflect current model limitations, not remain static."（「ハーネスの複雑さは現在のモデルの限界を反映すべきであり、固定されたままであってはならない」） [Anthropic: Harness design](https://www.anthropic.com/engineering/harness-design-long-running-apps)

### 前回調査（決定論化）の案との関係

openpyxlによるExcel→JSONの決定論化、EARSリンター、スキーマ検査、hookでのブロック、JSON Schemaによる出力強制、監査役LLMの分離は、人の認知負荷を減らす方向にも効きます。 [EARS](https://alistairmavin.com/ears/) [Claude Code hooks](https://code.claude.com/docs/en/hooks-guide)

ただし、これらを単独で入れても「レビュー役が育たない」問題は解決しません。決定論化はA〜G、とくに段階的な昇格と質問によるレビューを組にして進めます。

## 5. 出典一覧

本資料で引用した URL をすべて挙げます。

### 論文

- 初学者の LLM 生成コード理解 (2025-04) — https://arxiv.org/abs/2504.19037
- Copilot と理解・検証行動 (2025-11) — https://arxiv.org/abs/2511.02922
- How AI Impacts Skill Formation (2026-01) — https://arxiv.org/abs/2601.20245
- 初学者の知識転移 (2025-08) — https://arxiv.org/abs/2508.05999
- 開発者調査とガバナンス (2026-03) — https://arxiv.org/abs/2603.16975
- エージェント PR 23,247 件の分析 (2026-01) — https://arxiv.org/abs/2601.21276
- LLM 生成コードの readability debt (2026-05) — https://arxiv.org/abs/2605.13280
- 要件の曖昧性と LLM 性能 (2026-04) — https://arxiv.org/abs/2604.21505
- 企業 300 名調査: レビュー時間 −31.8% (2025-09) — https://arxiv.org/abs/2509.19708
- ReqToCode (2026-03) — https://arxiv.org/abs/2603.13999
- TraceLLM (2026-02) — https://arxiv.org/abs/2602.01253
- LLM による設計書レビュー自動化手法 (2025-09) — https://arxiv.org/abs/2509.09975
- CopilotLens (2025-06) — https://arxiv.org/abs/2506.20062
- Property-based の指摘効果 — https://arxiv.org/abs/2506.18315
- Metamorphic prompt testing — https://arxiv.org/abs/2406.06864
- Reliance drills (2024-09) — https://arxiv.org/abs/2409.14055

### 公式・企業

- Microsoft Research: 生成 AI と批判的思考 (CHI 2025) — https://www.microsoft.com/en-us/research/publication/the-impact-of-generative-ai-on-critical-thinking-self-reported-reductions-in-cognitive-effort-and-confidence-effects-from-a-survey-of-knowledge-workers/
- Microsoft Research: Taking Flight with Copilot (2024) — https://www.microsoft.com/en-us/research/publication/taking-flight-with-copilot-early-insights-and-opportunities-of-ai-powered-pair-programming-tools/
- Microsoft Research: Copilot 統制実験 (−55.8%) — https://www.microsoft.com/en-us/research/publication/the-impact-of-ai-on-developer-productivity-evidence-from-github-copilot/
- METR RCT (2025-07) — https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/
- METR 利用調査 (2026-05) — https://metr.org/blog/2026-05-11-ai-usage-survey/
- METR uplift update (2026-02) — https://metr.org/blog/2026-02-24-uplift-update/
- Stack Overflow Developer Survey 2025 — https://survey.stackoverflow.co/2025
- DORA 2024 — https://dora.dev/research/2024/dora-report/
- DORA 2025 — https://dora.dev/research/2025/dora-report/
- Google: AI in Software Engineering at Google (2025) — https://research.google/blog/ai-in-software-engineering-at-google-progress-and-the-path-ahead/
- Anthropic: Building effective agents — https://www.anthropic.com/engineering/building-effective-agents
- Anthropic: Harness design — https://www.anthropic.com/engineering/harness-design-long-running-apps
- Shopify: agentic harness (2026-07-29) — https://shopify.engineering/building-an-agentic-harness-that-outlasts-the-model
- Claude Code hooks guide — https://code.claude.com/docs/en/hooks-guide
- EARS 記法 — https://alistairmavin.com/ears/
- vale-ears — https://github.com/tbhb/vale-ears
- reqlint — https://github.com/Wyzer-it/reqlint
- INCOSE GtWR v4 サマリシート (9 品質特性) — https://www.incose.org/docs/default-source/working-groups/requirements-wg/guidetowritingrequirements/incose_rwg_gtwr_v4_summary_sheet.pdf
- spec-kit テンプレート — https://github.com/github/spec-kit/tree/main/templates
- moai-adk — https://github.com/modu-ai/moai-adk

### 当事者の記事・議論

- Cognitive debt: When velocity exceeds comprehension (2026-02) — https://www.rockoder.com/beyondthecode/cognitive-debt-when-velocity-exceeds-comprehension/
- Hacker News 討論 (507pt) — https://news.ycombinator.com/item?id=47196582
- Comprehension debt の議論 (532pt / 2025-09) — https://news.ycombinator.com/item?id=45423917
- test-driven verification の議論 — https://news.ycombinator.com/item?id=45935763
- marmelab: Spec-driven development, waterfall strikes back (2025-11) — https://marmelab.com/blog/2025/11/12/spec-driven-development-waterfall-strikes-back.html
- martinfowler.com: SDD ツール探訪 — https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html
- Qiita: 移行設計書の 4 連動箇所レビュー — https://qiita.com/kane_ryu/items/c463c0cfb2e0f598f800

調査日 2026-08-25。本資料の主張・数値はすべて上記出典に基づきます。
