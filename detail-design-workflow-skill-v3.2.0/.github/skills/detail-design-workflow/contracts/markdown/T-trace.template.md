---
id: "{{機能ID}}"
generatedFrom:
  - "{{生成元 spec ファイル名のリスト}}"
generatedAt: "{{生成日時 ISO8601}}"
model: "{{GPT-5.4}}"
provisional: {{true|false}}
---

# {{機能ID}} トレース

<!--
使い方: このテンプレートをコピーして spec/trace/{機能ID}.md を作る。
役割: この機能に関わる spec/ 各ファイル・実装クラス・テーブルの対応を1枚に集約する（図の置き場所はここに一本化）。
構成は下記の4セクション固定。空でもセクション見出しは残す。
クラス名の命名規則・配置パス規則は書かない。正本は spec/common/src-mapping.md（本ファイルはそれを参照するだけ）。
消費マトリクスの正本は spec-format/consumption-matrix.md（本ファイルはその抜粋のみ）。
-->

## 1. クラス図

<!--
この機能で生成予定のクラス（Controller / Service / Form / DTO / DAO / Mapper XML / Thymeleaf）を描く。
note for でどの spec ファイルに対応するかを付す。実在しない層は省く。
-->

```mermaid
classDiagram
    class {{XxxController}} {
        +{{メソッド名}}()
    }
    class {{XxxService}}
    class {{XxxForm}}
    class {{XxxDto}}
    class {{XxxMapper}}
    {{XxxController}} --> {{XxxService}}
    {{XxxController}} --> {{XxxForm}}
    {{XxxService}} --> {{XxxMapper}}
    {{XxxService}} --> {{XxxDto}}
    note for {{XxxController}} "spec: back/{{機能ID}}/methods.md, front/{{画面ID}}/validation.md"
    note for {{XxxService}} "spec: back/{{機能ID}}/logic.md, db/{{テーブル物理名}}.md"
    note for {{XxxForm}} "spec: front/{{画面ID}}/items.md, front/{{画面ID}}/validation.md"
    note for {{XxxMapper}} "spec: back/{{機能ID}}/queries.md, db/{{テーブル物理名}}.md"
```

<!-- Thymeleaf テンプレートはクラスではないため、対応は下の対応表・消費マトリクスで示す。 -->

## 2. 設計→実装対応表

<!-- フルパスは書かない。クラス名の命名規則・配置パス規則の正本は spec/common/src-mapping.md を参照。 -->

| 設計箇所（specファイル#セクション） | 役割 | 予定クラス名 |
|---|---|---|
| {{front/画面ID/items.md#画面項目}} | Form | {{XxxForm}} |
| {{front/画面ID/validation.md#バリデーション}} | Validator | {{XxxValidator}} |
| {{front/画面ID/layout.md#レイアウト}} | Thymeleaf テンプレート | {{xxx.html}} |
| {{back/機能ID/methods.md#イベント・遷移}} | Controller | {{XxxController}} |
| {{back/機能ID/logic.md#業務ロジック}} | Service | {{XxxService}} |
| {{back/機能ID/queries.md#検索要領}} | DAO / Mapper XML | {{XxxMapper}} / {{XxxMapper.xml}} |
| {{db/テーブル物理名.md#カラム定義}} | Entity / DTO | {{XxxDto}} |

## 3. ER 断片

<!--
db/_er-overview.md が存在する場合のみ、この機能が触るテーブルのみの erDiagram を描く。
関連線の凡例（explicit / derived_join のみ・AI推測禁止）の正本は spec-format/routing-table.md。
存在しない場合は erDiagram を描かず、下の「テーブル一覧」箇条書きだけを残す。
-->

```mermaid
erDiagram
    {{テーブルA}} ||--o{ {{テーブルB}} : "explicit"
```

テーブル一覧（_er-overview.md が無い場合はこちらのみ）:

- {{テーブル物理名}} — {{論理名}}（[spec/db/{{テーブル物理名}}.md](../db/{{テーブル物理名}}.md)）

## 4. 消費マトリクス抜粋

<!--
暫定: 消費マトリクスの正本は spec-format/consumption-matrix.md。ここはこの機能に必要な行だけを抜粋する。
「何を作るときに、どの spec ファイルを読むか」を実装者が1目で分かる形にする。
-->

| 生成物 | 読む spec ファイル |
|---|---|
| Form | front/{{画面ID}}/items.md + front/{{画面ID}}/validation.md |
| Thymeleaf テンプレート | front/{{画面ID}}/layout.md + front/{{画面ID}}/items.md |
| Controller | back/{{機能ID}}/methods.md + front/{{画面ID}}/validation.md |
| Service | back/{{機能ID}}/methods.md + back/{{機能ID}}/logic.md + db/{{テーブル物理名}}.md |
| DAO / Mapper XML | back/{{機能ID}}/queries.md + db/{{テーブル物理名}}.md |
