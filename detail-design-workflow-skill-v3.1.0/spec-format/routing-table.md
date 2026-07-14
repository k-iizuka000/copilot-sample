# ルーティング表の正本（recordType → 出力先）

暫定: このルーティング表は、実物の設計書での検証後に確定する。
このファイルは「どの recordType のレコードをどの spec ファイルへ振り分けるか」の唯一の正本。
テンプレート（T-*）・プロンプト・verify.ps1 はここを参照し、規則を各所に複製しない。

## 1. 振り分けの原則

- 「どの設計書から来たか」ではなく「レコードの責務」で振り分ける。
- 1冊の設計書が複数の spec ファイルに散るのは正常。1つの spec ファイルに複数の設計書由来のレコードが集まるのも正常。
- ID の使い分け・ツリー全体は [output-structure.md](./output-structure.md) を参照。

## 2. ルーティング表

| recordType | 出力先 | 実装対応（消費者） |
|---|---|---|
| screen_item, display_mode, parameter_definition | front/{画面ID}/items.md | Form.java |
| layout_reference（Thymeleaf仕様・レイアウト明記事項・スクショ参照） | front/{画面ID}/layout.md | Thymeleafテンプレート |
| validation_rule, item_control, correlation_validation, message_rule | front/{画面ID}/validation.md | Form/Validator |
| ui_event | back/{機能ID}/methods.md | Controller |
| process_section | back/{機能ID}/methods.md または logic.md（処理概要=methods、業務ロジック本文=logic） | Controller/Service |
| search_requirement, update_requirement, select_constraint, item_db_mapping | back/{機能ID}/queries.md | Mapper XML / DAO |
| batch_control | batch/{ジョブID}/control.md | バッチ起動/制御 |
| external_interface | batch/{ジョブID}/io.md（バッチ文脈）/ back/{機能ID}/methods.md（画面文脈） | 連携処理 |
| entity_field, attribute_definition, view_definition, view_query_block | db/{テーブル物理名}.md | Entity/DTO/Mapper |
| entity_relation | db/_er-overview.md および trace のER断片 | — |
| screen_action_permission, case_reference_permission, role_hierarchy | common/permissions/ | 権限チェック |
| common_rule（命名規約系） | common/naming.md | 全般 |
| common_rule（コード値・enum系） | common/codes/{分類}.md | enum/定数 |
| 業務ルール（複数機能に適用と明記されたロジック） | rules/BR-{番号}.md | Service |
| アセット（画像・図形） | runs/{ID}/00-input/assets/ に書き出し、layout.md からリンク | — |

## 3. enum 値（verify.ps1 の照合対象）

verify.ps1 は各レコードの `layers` と `recordType` がこの節の値に含まれるかを機械照合する。

layers（J-00 共通）:
`frontend` / `backend` / `db` / `batch` / `integration` / `authorization` / `common`

recordType（振り分け対象）:
`screen_item` / `display_mode` / `parameter_definition` / `layout_reference` /
`validation_rule` / `item_control` / `correlation_validation` / `message_rule` /
`ui_event` / `process_section` /
`search_requirement` / `update_requirement` / `select_constraint` / `item_db_mapping` /
`batch_control` / `external_interface` /
`entity_field` / `attribute_definition` / `view_definition` / `view_query_block` /
`entity_relation` /
`screen_action_permission` / `case_reference_permission` / `role_hierarchy` /
`common_rule`

- 「業務ルール」「アセット」は上記 recordType の分類・派生（多機能適用の process_section／common_rule、および J-60 アセット）を指す運用上の振り分けであり、新しい recordType 値ではない。

## 4. entity_relation（関連線）の採否規則

ER の関連線として描いてよいのは以下の2種のみ。AI の推測による関連生成は禁止。

- `explicit`: 設計書に明記された関連（FK・参照関係の明記）。
- `derived_join`: VIEW 定義・検索要領の JOIN 条件から導出した関連。

カーディナリティが不明なら `unknown` とする。全体テーブル定義書が来た場合のみ全体ER（db/_er-overview.md）を作成し、機能単位のエンティティ定義書だけの段階では ER 図を作らない（テーブル定義の取り込みのみ）。

## 5. 共有領域（db/ common/ rules/）の扱い

- 該当レコードを持つどの run も追記・更新してよい。
- ただし既存記述と矛盾する内容（例: 同一テーブル・同一カラムの型・桁の不一致）を検出した場合は、**上書きせず両論併記** とし、`runs/{ID}/20-check/warnings.md` に「矛盾検出」として記録して人間の判断に委ねる。
- verify.ps1 が db/ の同一テーブル・同一カラムの矛盾定義を検出して警告する（決定#7: 機械FAIL のみ停止。矛盾は警告であり停止しない）。
