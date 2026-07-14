# Excel設計書から詳細設計Markdownへの標準作業手順

この文書を日々の実行手順の正本とする。通常は1画面または1機能につき、runフォルダを1つ作る。

## Promptの実行回数

番号付きPromptは、`/00`から`/10`までのすべてを1回ずつ実行する手順ではない。

| Prompt | 実行条件と回数 |
|---|---|
| `/00` | 未知または改訂済みフォーマットだけ。調査対象1冊につき1回 |
| `/01` | 対象Excelまたは入力スナップショット1冊につき1回 |
| `/02`〜`/07` | J-01の`routingPlan`に載ったものだけ。1シートまたは1論理ブロックにつき1回 |
| `/08` | 作成したJ-* JSON 1ファイルにつき1回 |
| `/09` | G1承認後、1 runにつき1回 |
| `/10` | `/09`の出力一式に対して1 runにつき1回 |

CSV/TSVへの変換は番号付きPromptの工程ではない。生の`.xlsx`をモデルが読めない場合に、人間が対象シートをCSV、TSV、Markdown表、または行・節ID付きテキストへ書き出す前処理である。書き出したファイルを入力スナップショットとして`/01`以降へ渡す。

TSVからMarkdownへ直接変換しない。通常経路は`Excelまたは入力スナップショット → J-* JSON → EV-01 → M-* Markdown → EV-02`とする。

## モデル利用と評価分離

軽量モデルが1回に扱う対象を小さく保つ。複数シートや複数論理ブロックを1回のPromptへまとめない。

| Prompt | 標準モデル | 条件 |
|---|---|---|
| `/00` | GPT-5.4 Medium | 未知形式の分類と候補Profile作成に使用 |
| `/01` | GPT-5.4 mini | blocking、partial、分類競合があればMediumまたは人間へ上げる |
| `/02`〜`/07` | GPT-5.4 mini | 1シートまたは1論理ブロックに限定。曖昧なら停止して上げる |
| `/08` | GPT-5.4 Medium | 抽出に使ったチャットとは別会話で実行 |
| `/09` | GPT-5.4 mini | G1承認済みJSONの表現変換だけを行う |
| `/10` | GPT-5.4 Medium | `/09`に使ったチャットとは別会話で実行 |

生成と評価を同じチャットで続けて実行しない。評価担当には生成時の推論や自己説明を引き継がず、入力ソース、対象成果物、Schema、評価Promptだけを渡す。

## 0. 入力を確定する

`run-template/FEATURE-ID`をコピーし、機能IDに合わせて名前を変更する。`run-request.json`へ機能ID、機能名、設計書パス、版、出力先を記入する。

G0として、人間が次を確認する。確認できない場合は開始しない。

- 対象設計書の正本と版
- 機能IDと機能名
- 使用するプロファイル
- JSON、評価、Markdownの出力先

未知または改訂済みのExcelフォーマットは、次の順で処理する。

1. `/00-d00-format-survey`で調査レポートと`provisional`の候補Profile JSONを別々に出力する。
2. 人間がシート名、見出し、ブロック境界、skill、outputContract、停止条件を確認し、候補Profileが`PROFILE-00.schema.json`に適合することを確認する。
3. 未確認の`unknown`または`UNKNOWN`が残る場合は、回答または追加調査で具体的なルールへ直す。残したまま通常変換へ進まない。
4. 人間が承認した候補Profileだけを`profiles/`へ配置し、`PROFILE-INDEX.md`へ登録する。
5. 登録した`profileId`を指定して`/01-e2j-inventory-route`から再開する。

`/00`は既存Profileを自動変更しない。候補Profileを承認・登録できない場合は停止する。

## 1. 設計書を棚卸しする

対象設計書1冊ごとに`/01-e2j-inventory-route`を実行する。1回に複数冊を渡さない。

出力されたJ-01の`routingPlan`で、対象シート、処理単位、後続Promptを確認する。

## 2. 必要なJSONだけを作る

`routingPlan`に記載されたPromptだけを、1シートまたは1論理ブロック単位で実行する。

各PromptへJ-01の`profileId`と同じ値を渡す。Promptが担当するskill/outputContractへルーティングされていない場合は実行しない。

| Prompt | 対象 | 主出力 |
|---|---|---|
| `/02-e2j-ui-structure` | 画面項目、表示構造、パラメータ | J-10 |
| `/03-e2j-ui-behavior` | 項目制御、バリデーション、イベント、メッセージ | J-11 |
| `/04-e2j-process-batch` | 処理、検索、更新、バッチ | J-20 |
| `/05-e2j-data-query-interface` | DB対応、エンティティ、VIEW、ファイル、外部連携 | J-30 |
| `/06-e2j-common-permission` | 権限マトリクス、共通規約 | J-40 |
| `/07-e2j-assets` | 画像、図形、コメント、読取不能要素 | J-60 |

大きなシートは、項目番号、イベントID、検索要領番号、VIEW名などの親キーを保って分割する。

## 3. JSONを原本と照合する

作成したJ-* JSON 1件ごとに`/08-ev-source-fidelity`を実行する。

- `FAIL`: 元のE2J工程へ戻る。
- `PASS_WITH_WARNINGS`: 人間が警告を確認し、受容または再抽出を判断する。
- `PASS`: 次工程の入力候補にできる。

G1として、使用する全JSONが`PASS`、または人間が受容した`PASS_WITH_WARNINGS`であることを確認する。blocking issueが残る場合は進まない。

確認後、runフォルダの`status.md`でG1を`承認済み`にし、確認者、日付、警告受容の理由を記録する。J-90の`humanReviewStatus`は評価時点のスナップショットであり、人間確認状態の正本は`status.md`とする。

## 4. 詳細設計Markdownを作る

`/09-j2m-detail-design`へ`status.md`のパスを渡して実行する。

- EV-01に`FAIL`またはblocking findingが1件でもあれば停止する。
- `PASS_WITH_WARNINGS`がある場合、警告を受容しないなら`allowWarnings=false`で停止させる。
- `PASS_WITH_WARNINGS`を人間が受容済みの場合だけ`allowWarnings=true`とし、全警告を`90-open-issues.md`へ引き継ぐ。
- 全件`PASS`でもG1が`承認済み`でなければ停止する。

- 常に作る: `00-overview.md`、`99-traceability.md`
- 対応レコードがある場合だけ作る: `10-frontend.md`〜`60-assets.md`
- issueまたは警告がある場合だけ作る: `90-open-issues.md`

空Markdownや、空の表だけを持つ分野別Markdownは作らない。出力先に以前の実行で残った不要な空Markdownがあれば削除する。

## 5. Markdownを照合する

`/10-ev-markdown-integrity`を実行する。評価PromptはMarkdownを修正しない。

G2として、人間が次を確認する。

- JSONにない仕様が追加されていない。
- 条件、否定、例外、数値、順序が失われていない。
- 全Record IDが`99-traceability.md`から追跡できる。
- issueと警告がある場合は`90-open-issues.md`に整理されている。
- `該当なし`と`未確認`が混同されていない。

EV-02が`FAIL`、またはblocking issueがある場合は`/09`へ戻る。

## VS Codeでの実行方法

1. 対象リポジトリをVS Codeで開く。
2. Copilot Chatで`/`を入力し、番号付きPrompt Fileを選ぶ。
3. 機能ID、入力パス、出力パスなどを入力する。
4. Agentが変更しようとするファイルを確認し、指定出力先以外の変更は許可しない。
5. 出力ファイル、件数、判定、blocking issueを確認する。

## トラブルシューティング

| 症状 | 対応 |
|---|---|
| Prompt Fileが候補に出ない | `.github/prompts/*.prompt.md`と`.vscode/settings.json`を確認し、VS Codeを再読み込みする |
| Excelを直接読めない | 番号付きPromptを開始する前に、対象シートをTSV、CSV、Markdown表、行・節ID付きテキストのいずれかへ人間が書き出し、入力スナップショットとして同じ版を全工程へ渡す |
| JSON Schemaエラー | 定義外キー、null、Enumを確認し、生成物を手修正せず元のE2J工程を再実行する |
| coverageが一致しない | sourceUnit境界を見直し、論理ブロックを小さくする |
| EV-01がFAIL | 対応するE2J工程へ戻る |
| EV-02がFAIL | `/09-j2m-detail-design`へ戻る |

## 中断と再開

J-* JSON、EV-01、M-* Markdown、EV-02が再開地点になる。前工程の成果物と評価結果がない場合は、後工程から開始しない。

未知形式の再開地点は、人間承認済みの候補Profileである。調査レポートだけ、または未承認の候補Profileだけでは`/01`へ進まない。
