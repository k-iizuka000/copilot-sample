---
name: detail-design-onestop
description: >-
  Excel設計書1冊のダンプ（JSON）を読み、宣言マトリクスとルーティング表に従って
  spec/ Markdown を一発生成する。/run・ダンプから詳細設計・台帳・再開判定が
  必要なときに使う。
---

# detail-design-onestop

ダンプ（JSON）だけを読み、spec/ Markdown を直接生成する。中間形式・レンダラーは無い。生Excelは読まない。ダンプ・manifest.json への書き込みは禁止（ダンプは読み取り専用の証拠）。

## 1. 全体像と入力

```
Excel設計書1冊(.xlsx)
  → extract.ps1（完成済み・仕事PC実行） → ダンプディレクトリ（JSON。契約は references/dump-contract.md 1.0.0）
  → /run（本スキル。Copilot 上で GPT-5.4 が実行） → spec/ Markdown
```

- 入力: ダンプディレクトリ（1冊単位）。契約の正本は [references/dump-contract.md](references/dump-contract.md)。
- ダンプは読み取り専用。ダンプ・manifest.json への書き込みは禁止。
- 用語（この語彙以外を使わない。言い換え・同義語の新造は禁止）:
  - 「1冊」= Excel 設計書ファイル1個。featureId は1冊につき1つで、種別に応じて画面ID・機能ID・ジョブIDのどれかを指す（「1冊=1機能」という表現は禁止）
  - 「台帳」= /run が書く唯一の進捗・網羅記録ファイル（下記契約）。「網羅台帳」「作業台帳」「チェックリスト」という呼称は使わない
  - 「宣言範囲」= 宣言シートの範囲宣言表で人が宣言したセル範囲。extract 解析済みで manifest.declarationSheet.rangeDeclarations.normalizedRange に入っている。/run は読むだけ
  - 仕様セルの2語: 「該当なし」（調べた結果、無い。ダンプの [] に対応）／「未確認」（読み取れず確定できない。ダンプの null・エラー型セルに対応）。出典座標必須。他の表現（N/A・不明・なし・要確認・空欄）は禁止（[references/spec-templates/spec-rules.md](references/spec-templates/spec-rules.md) 3章）

## 2. featureId・種別の機械判定

設計書種別（5種別）: 画面／処理機能／バッチ／エンティティ定義／VIEW定義。

### 2.1 種別

種別はダンプ（ブックfileName・宣言マトリクス・シート名）から機械判定する。判定できなければ「画面/処理機能/バッチ/エンティティ/VIEWのどれですか」とその場でユーザーに質問する。5種別のいずれでもない場合は生成せず整合停止し従来手順（v3.2.0）を案内する。

### 2.2 featureId

manifest.book.fileName の命名規約から機械判定（fileName 中に ID と解釈できる唯一の候補があれば採用）。
取れない場合は作業を進めずその場でユーザーに質問し、回答を run-request.json に保存して自走継続。

### 2.3 質問時の扱い

featureId・種別の質問が発生したら run-request.json の questions に追記し、回答を反映してから自走継続する。

## 3. ルーティング表

宣言マトリクスの影響先→出力ファイル（正本）:

| 影響先（○のシート） | 出力先 | テンプレート |
|---|---|---|
| フロント-画面項目 | spec/front/{featureId}/items.md | front-items.template.md |
| フロント-レイアウト | spec/front/{featureId}/layout.md | front-layout.template.md |
| フロント-入力チェック | spec/front/{featureId}/validation.md | front-validation.template.md |
| バック-処理 | spec/back/{featureId}/methods.md と logic.md の2本 | back-methods + back-logic |
| バック-検索・更新 | spec/back/{featureId}/queries.md | back-queries.template.md |
| バッチ-制御 | spec/batch/{featureId}/control.md | batch-control.template.md |
| バッチ-入出力 | spec/batch/{featureId}/io.md | batch-io.template.md |
| DB定義 | spec/db/{物理名}.md（物理名はシート内容から読む） | 種別エンティティ定義=db-table／VIEW定義=db-view |
| 共通・規約／権限 | 生成しない（初回スコープ外） | 台帳に「理由付き無視」と記録 |
| 対象外 | 生成しない | 台帳に「理由付き無視（宣言: 対象外）」と記録 |

- バッチ種別の冊でバック-処理／バック-検索・更新に○: back テンプレを共用し spec/batch/{featureId}/logic.md・queries.md へ（spec-rules 5章）
- 複数シートが同じ影響先に○: 同じファイルへ統合し、行ごとの出典列でシート由来を区別
- spec/ のパス・ファイル名は ASCII（spec-rules 6章）

テンプレート実体は [references/spec-templates/](references/spec-templates/) 配下。

## 4. 台帳の契約

1冊につき1ファイル。

- パス: `spec/_run/{ブック名}/ledger.md`（ブック名 = manifest.book.fileName の拡張子抜き。会話・文書内の呼称は常に「台帳」）
- セクション構成:
  1. ヘッダ: ブック名／featureId／種別／ダンプ generatedAt／book.sha256
  2. あるべき出力ファイル一覧（宣言マトリクス×ルーティング表から計算）: 表列 = 出力ファイル｜由来シート（複数可）｜状態｜出典（宣言マトリクスの該当行の座標）。状態語彙は「未着手」「生成済み」の2語のみ
  3. 生成対象外・宣言範囲外の内容の扱い: 表列 = シート｜対象（シート全体／セル座標／図形名／コメント座標）｜扱い｜反映先または理由。扱い語彙は「反映済み」「理由付き無視」の2語のみ。対象は宣言範囲の外にある非空セル・図形・テキストボックス・コメント・非表示行列と、生成しないシート（シート全体1行）
- 完了の定義: セクション2の全行が「生成済み」かつ セクション3に扱い未記入の行が無い

## 5. run-request.json の契約

1冊につき1ファイル。質問とレビューの唯一の受け皿。

- パス: `spec/_run/{ブック名}/run-request.json`（UTF-8・BOMなし）
- スキーマ:

```json
{
  "schemaVersion": "1.0.0",
  "book": { "fileName": "SCR-100_利用者検索画面設計書.xlsx", "sha256": "..." },
  "featureId": "SCR-100",
  "docType": "画面",
  "dumpDir": "設計書からの相対または絶対パス文字列",
  "questions": [
    { "id": "Q1", "question": "featureId が判定できません。…", "answer": "SCR-100", "status": "answered" }
  ],
  "reviewFindings": [
    { "id": "RF1", "target": "spec/front/SCR-100/items.md", "finding": "指摘内容", "status": "open" }
  ]
}
```

- /run 初回実行時に作成。featureId・種別の質問が発生したら questions に追記し、回答を反映してから自走継続
- reviewFindings は後続のレビューエージェント（今回は作らない）が直接書き込む欄。/run は再実行時に status=open の指摘を読んで該当ファイルを修正し、対応したら status を "resolved" に更新する

## 6. 生成規則

正本は [references/spec-templates/spec-rules.md](references/spec-templates/spec-rules.md) と各テンプレート（[references/spec-templates/*.template.md](references/spec-templates/)）。要点:

- 出力はテンプレートの必須見出し・列構成を厳守。全表の最終列は「出典」
- 全行に出典必須。書式は 単一セル `シート名!B5`／範囲 `シート名!A5:L40`／複数出典 ` / ` 区切り のみ
- 表の行の出典は、値が入っている単一セル座標を ` / ` 区切りで列挙する（行全体を1つの範囲でまとめて書かない）。範囲書式（`シート名!A5:L40`）は、確認した範囲を示す場合（該当なし・未確認・出典サマリ）にのみ使う
- 出典はダンプに実在するシート名・セル番地のみ（推測・創作禁止）
- displayText を正とし、解釈・言い換えをしない
- エラー型セル（cellType "e"）由来の属性は「未確認」・出典=当該セル
- 冒頭の出典サマリ表（宣言ID｜正規化範囲｜シート名｜用途｜出典）必須。出典は宣言シートの範囲宣言表の該当行座標
- 仕様セルの2語は「該当なし」／「未確認」のみ（他表現禁止）

extract 本体は [scripts/extract.ps1](scripts/extract.ps1)（本スキルでは実行しない。ダンプは既に存在する前提）。

## 7. 再開判定

再実行時は、出力ファイルが実在しテンプレートの必須見出しが揃っているものだけ「生成済み」としてスキップし、欠け・壊れのみ生成し直す（台帳は表示用の記録。正本判定はファイル実在＋必須見出し）。

ベストエフォート自走: 1冊の全対象を完了まで進める。途中停止しても再実行で続きから（上の再開判定）。

## 8. 停止規則

停止するのは次のみ:

1. 5種別のいずれでもない
2. ダンプが dump-contract に適合しない（manifest 必須キー欠落等）
3. ユーザー質問の回答待ち

フォールバック（代替様式へ黙って切り替え）は禁止。

## 9. 完了報告

チャットで次を報告する:

- 生成ファイル一覧
- 理由付き無視の一覧
- 台帳へのリンク（`spec/_run/{ブック名}/ledger.md`）

完了の定義（台帳）: セクション2の全行が「生成済み」かつ セクション3に扱い未記入の行が無い。
