# handoff

`handoff/` 直下は、仕事PC側リポジトリのルートに配置する資産を 1:1 で対応させるミラーです。ここに置いたパスは、仕事PC側リポジトリのルートを基準にした同じ相対パスへ転写します。

## 転写手順

1. 仕事PCで本リポジトリを pull（初回は clone）する。
2. 下表のコピー元を、本リポジトリの `handoff/` 配下にあるパスとして確認する。
3. コピー先を仕事PC側リポジトリのルートとして、対応するパスへコピーする。

| コピー元（本リポジトリ） | コピー先（仕事PC側リポジトリ） |
| --- | --- |
| `handoff/.github/prompts/` | `.github/prompts/` |
| `handoff/.github/skills/` | `.github/skills/` |
| `handoff/.github/agents/` | `.github/agents/` |
| `handoff/eval-fixtures/` | `eval-fixtures/` |

コピー先に既存の同名ファイルがある場合は、内容を確認してから更新します。`handoff/README.md` は転写手順を示すための本リポジトリ側の説明書であり、仕事PC側へコピーする配置資産ではありません。

## 配置ルール

検品合格の記録（`assets/<資産名>/results/` にある合格記録）が確認できる資産のみ、`handoff/` に配置します。未検品または不合格の資産は配置しません。

現在の配置資産:

| 資産 | 内容 | 合格記録 |
| --- | --- | --- |
| detail-design-onestop | `/run`（ダンプ→spec/ 一発生成）の prompt・SKILL・references（ダンプ契約・出力見本テンプレート）・extract.ps1・宣言シートテンプレート | `assets/detail-design-onestop/results/20260722T031217874Z-N10.json`（gpt-5.4・N=10・全ケース pass^10） |

資産の正本は `assets/<資産名>/` 側です。handoff は合格時点のミラーであり、資産を更新したら再検品の合格後にここへ再転写します。

仕事PC実走の検証（`assets/detail-design-onestop/dev/` の fixture・workpc-verification 手順）は仕事PC側リポジトリへコピーせず、pull した本リポジトリ上でそのまま実行します。

## 転写後の使い方（detail-design-onestop）

仕事PC側リポジトリの Copilot チャットで、次の順に使います（詳細は `assets/detail-design-onestop/README.md`）。

1. **宣言シートを追加する（人の作業）**: 実物ブックの作業用コピーに、`.github/skills/detail-design-onestop/templates/declaration-sheet.xlsx` から宣言シート `_シート役割表` を追加し、`templates/declaration-guide.md` に従って記入する
2. **`/extract <設計書コピー.xlsx>`**: ダンプ化を代行（extract.ps1 の実行・終了コードの説明・要目視警告の報告まで）
3. **`/run <ブック名>.dump/`**: ダンプから spec/ Markdown を一発生成。台帳と run-request.json は `spec/_run/<ブック名>/` にできる。途中で止まっても再実行で続きから
