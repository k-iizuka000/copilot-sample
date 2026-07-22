---
id: "src-mapping"
generatedFrom:
  - "{{実物照合に使った代表機能名（未照合なら 未確認）}}"
generatedAt: "{{生成日時 ISO8601}}"
model: "{{更新したモデル or 人間}}"
provisional: true
---

# src マッピング（役割 → クラス名命名規則 → 配置パス規則）

暫定: この対応表は実測未検証の雛形。実物のソース／設計書での照合後に確定する。
使い方: このテンプレートをコピーして spec/common/src-mapping.md を作る。trace（T-trace）はクラス名・パスの規則をここへ参照する（複製しない）。
下表の命名規則・パス規則は現時点の推測であり、全行 状態=実測未検証。確定するまで、生成物のフルパスを断定しない。

## 1. 役割ごとの命名規則・配置パス規則

| 役割 | クラス名命名規則（暫定） | 配置パス規則（暫定） | 状態 |
|---|---|---|---|
| Controller | {{機能名}}Controller | {{basePackage}}/web/{{機能領域}}/ | 実測未検証 |
| Service | {{機能名}}Service（実装は {{機能名}}ServiceImpl） | {{basePackage}}/service/{{機能領域}}/ | 実測未検証 |
| Form | {{画面名}}Form | {{basePackage}}/web/{{機能領域}}/form/ | 実測未検証 |
| Validator | {{画面名}}Validator | {{basePackage}}/web/{{機能領域}}/validator/ | 実測未検証 |
| DTO | {{名称}}Dto | {{basePackage}}/dto/ | 実測未検証 |
| Entity | {{テーブル論理名}}Entity | {{basePackage}}/entity/ | 実測未検証 |
| DAO（Mapper インターフェース） | {{テーブル/機能名}}Mapper | {{basePackage}}/mapper/ | 実測未検証 |
| Mapper XML（SQL） | {{テーブル/機能名}}Mapper.xml | src/main/resources/mapper/ | 実測未検証 |
| Thymeleaf テンプレート | {{画面名}}.html | src/main/resources/templates/{{機能領域}}/ | 実測未検証 |
| バッチ本体 | {{ジョブ名}}Tasklet / {{ジョブ名}}Job | {{basePackage}}/batch/{{ジョブ領域}}/ | 実測未検証 |

- `{{basePackage}}`・`{{機能領域}}`・`{{ジョブ領域}}` は代表機能の実物照合で確定する。
- 状態が「実測未検証」の行の規則を根拠に、コードのフルパスを断定してはならない。

## 2. 確定手順

1. 代表機能を 1〜2 個選ぶ（画面系1・バッチ系1が望ましい）。
2. その機能の実物ソース（既存 Java／リポジトリ構成）と設計書を突き合わせ、各役割の実際のクラス名・配置パスを確認する。
3. 確認できた行の「命名規則（暫定）」「配置パス規則（暫定）」を実測値へ更新し、状態を「実測未検証」→「実測確認済（{{代表機能名}}）」に変える。
4. front-matter の `generatedFrom` に照合した代表機能名、`provisional` を false（全行確認できた場合のみ）に更新する。
5. 未確認の役割が残る場合は、その行だけ「実測未検証」を残し、`provisional: true` を維持する。
