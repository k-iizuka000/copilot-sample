# 消費マトリクスの正本

暫定: この消費マトリクスは、実物の設計書での検証後に確定する。
このファイルは「実装物（生成するクラス／テンプレート）を作るとき、どの spec ファイルを読むか」の唯一の正本。
trace（T-trace）の「消費マトリクス抜粋」はこの表から必要な行を抜き出したもの。各所に規則を複製しない。

## 1. 考え方

- Copilot への入力は「多いほど良い」ではなく「タスクに必要なものだけ」が最も精度が高く安い（plan-deck の思想）。
- 責務単位に分割した spec を、生成物ごとに 2〜4 ファイルだけ読ませる。
- 「Form を生成するタスクに、レイアウト仕様を読ませない」= インターフェース分離原則の設計書版。
- リンクの向き（どの実装がどの spec を読むか）は人が都度考えるものではなく、この表で機械的に決める。

## 2. 消費マトリクス（MyBatis 構成: Controller / Service / Form / DTO / DAO / Mapper XML / Thymeleaf）

| 生成物 | 読む spec ファイル |
|---|---|
| Form（入力フォーム） | front/{画面ID}/items.md + front/{画面ID}/validation.md |
| Validator | front/{画面ID}/validation.md + front/{画面ID}/items.md |
| Thymeleaf テンプレート | front/{画面ID}/layout.md + front/{画面ID}/items.md |
| Controller | back/{機能ID}/methods.md + front/{画面ID}/validation.md + common/permissions/（権限がある場合） |
| Service | back/{機能ID}/methods.md + back/{機能ID}/logic.md + db/{テーブル物理名}.md + rules/BR-{番号}.md（該当ルールがある場合） |
| DTO（データ転送オブジェクト） | db/{テーブル物理名}.md + back/{機能ID}/queries.md |
| DAO（Mapper インターフェース） | back/{機能ID}/queries.md + db/{テーブル物理名}.md |
| Mapper XML（SQL） | back/{機能ID}/queries.md + db/{テーブル物理名}.md |
| バッチ本体 | batch/{ジョブID}/control.md + batch/{ジョブID}/logic.md + batch/{ジョブID}/queries.md |
| バッチ入出力処理 | batch/{ジョブID}/io.md + db/{テーブル物理名}.md |
| 権限チェック | common/permissions/ + back/{機能ID}/methods.md |

- クラス名の命名規則・配置パス規則はこの表の範囲外。正本は生成物 `spec/common/src-mapping.md`（初期雛形 [src-mapping.template.md](./src-mapping.template.md)）。
- 「該当テーブル」は対象機能が触るテーブルの `db/{テーブル物理名}.md`。どのテーブルを触るかは `back/{機能ID}/queries.md` の item_db_mapping / 検索要領から辿る。

## 3. 受け入れの目安

- 各生成物が読む spec は 2〜4 ファイルに収まること（超える場合は責務分割の見直しサイン）。
- 「FUNC-XXXX に関連する spec ファイル・テーブル・業務ルールを全部挙げて」に、trace（T-trace）＋この表で正答できること。
