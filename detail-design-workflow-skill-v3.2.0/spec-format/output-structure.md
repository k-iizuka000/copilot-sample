# 出力構造の正本（spec/ ツリーと標準ファイルセット）

このファイルは、利用先リポジトリに生成する `spec/` ツリーと、各責務領域の標準ファイルセットの正本。
どのレコードをどのファイルへ振り分けるかの規則は [routing-table.md](./routing-table.md) が正本（ここには複製しない）。
各ファイルの中身の形式は `contracts/markdown/` の T-* テンプレートが正本。

## 1. spec/ ツリー（最終出力・機能横断の共有ツリー）

```
<利用先リポジトリ>/
├── spec/                    ← 最終出力（機能横断の共有ツリー）
│   ├── front/{画面ID}/      layout.md, items.md, validation.md
│   ├── back/{機能ID}/       methods.md, logic.md, queries.md
│   ├── batch/{ジョブID}/    control.md, io.md, logic.md, queries.md   ※標準セットは暫定
│   ├── db/                  {テーブル物理名}.md, _er-overview.md（全体定義書がある場合のみ）
│   ├── common/              src-mapping.md, naming.md, codes/, permissions/
│   ├── rules/               BR-{番号}.md
│   └── trace/               {機能ID}.md
└── runs/{機能ID}/           ← 作業中間物（作業後削除可）
    ├── run-request.json
    ├── 00-input/            ← Excel設計書の原本コピー（.xlsx。/01-setup が自動配置）、assets/
    ├── 10-json/             ← J-* JSON
    └── 20-check/            ← verify 結果・warnings.md・check 結果・reverse-map.md
```

- `spec/` 配下のファイル名・ディレクトリ名は ASCII。日本語はファイル内容にのみ使う。
- 1冊の設計書が複数の spec ファイルに散るのは正常。1つの spec ファイルに複数の設計書由来のレコードが集まるのも正常（振り分けは「レコードの責務」で決める。詳細は routing-table.md）。

## 2. 責務領域ごとの標準ファイルセット

| 責務領域 | ディレクトリ | 標準ファイル | 使うテンプレート | 生成条件 |
|---|---|---|---|---|
| フロント（画面項目） | `front/{画面ID}/` | `items.md` | T-items | 画面項目レコードがある |
| フロント（レイアウト） | `front/{画面ID}/` | `layout.md` | T-layout | layout_reference レコードがある |
| フロント（入力検証） | `front/{画面ID}/` | `validation.md` | T-validation | バリデーション系レコードがある |
| バック（メソッド） | `back/{機能ID}/` | `methods.md` | T-methods | ui_event / process_section 概要 / 画面文脈 external_interface がある |
| バック（業務ロジック） | `back/{機能ID}/` | `logic.md` | T-logic | process_section 本文がある |
| バック（検索/更新） | `back/{機能ID}/` | `queries.md` | T-queries | search/update/select_constraint/item_db_mapping がある |
| バッチ（制御） | `batch/{ジョブID}/` | `control.md` | T-batch-control | batch_control レコードがある |
| バッチ（入出力） | `batch/{ジョブID}/` | `io.md` | T-batch-io | バッチ文脈の external_interface がある |
| バッチ（業務ロジック） | `batch/{ジョブID}/` | `logic.md` | T-logic を流用 | バッチのロジックがある |
| バッチ（検索/更新） | `batch/{ジョブID}/` | `queries.md` | T-queries を流用 | バッチの検索/更新要領がある |
| DB（テーブル定義） | `db/` | `{テーブル物理名}.md` | T-db-table | テーブル/VIEW 定義レコードがある |
| DB（全体ER） | `db/` | `_er-overview.md` | T-er-overview | 全体テーブル定義書が取り込まれている場合のみ |
| 共通（パス規則） | `common/` | `src-mapping.md` | src-mapping.template.md | 常設（初期は雛形。実物照合後に更新） |
| 共通（命名規約） | `common/` | `naming.md` | — | common_rule（命名規約系）がある |
| 共通（コード値） | `common/codes/` | `{分類}.md` | — | common_rule（コード値・enum 系）がある |
| 共通（権限） | `common/permissions/` | 権限系ファイル | — | 権限系レコードがある |
| 業務ルール | `rules/` | `BR-{番号}.md` | — | 複数機能に適用と明記された業務ルールがある |
| トレース | `trace/` | `{機能ID}.md` | T-trace | 対象機能の spec ファイルが生成済み |
| 警告台帳 | `runs/{ID}/20-check/` | `warnings.md` | T-warnings | ラン開始時に常設 |

- 該当レコードが無い標準ファイルは生成しない（空ファイルを作らない）。逆に、標準セットに無い責務が現れたら routing-table.md の改定サイン。

## 3. バッチ標準ファイルセットについて（暫定）

暫定: バッチの標準ファイルセット（`control.md` / `io.md` / `logic.md` / `queries.md`）は、実物のバッチ設計書での検証後に確定する。
現時点では画面/機能と同じ責務分割の考え方を援用しており、専用テンプレートは制御（T-batch-control）と入出力（T-batch-io）の2つのみ。
バッチの業務ロジックと検索/更新は、画面/機能用の T-logic / T-queries を流用する（`id` はジョブIDにする）。

## 4. ID 規約

- 画面系は画面ID、機能系は機能ID、バッチはジョブID を ID に使う。
- ID の種別が判別できない場合は `runs/{ID}/run-request.json` の宣言を正とする（設計書側への明記依頼は `docs/design-doc-request.md` で行う）。

## 5. 関連する正本

- 振り分け規則: [routing-table.md](./routing-table.md)
- 消費マトリクス: [consumption-matrix.md](./consumption-matrix.md)（暫定）
- パス規則: 生成物 `spec/common/src-mapping.md`（初期雛形は [src-mapping.template.md](./src-mapping.template.md)）
