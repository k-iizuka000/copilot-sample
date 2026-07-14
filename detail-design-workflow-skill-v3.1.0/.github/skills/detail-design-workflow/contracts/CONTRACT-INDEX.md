# 契約一覧（v3.1.0・軽量版）

中間層 JSON（J-*）のスキーマ一覧。共通の抽出ルール・出典必須・「該当なし/未確認」の区別は `.github/copilot-instructions.md` を正本とする。出力先ルーティング（recordType→spec ファイル）は `spec-format/routing-table.md` を正本とする。

ファイル名は短縮名（`J-00.schema.json` 等）で固定。`.vscode/settings.json` の `json.schemas` およびプロンプトはこの短縮名で参照する。

## 中間 JSON スキーマ

| ID | ファイル | 役割 | 主な recordType |
|---|---|---|---|
| J-00 | [json/J-00.schema.json](./json/J-00.schema.json) | 共通定義（Record ID・出典・issue・アセット・recordBase） | —（共通型） |
| J-01 | [json/J-01.schema.json](./json/J-01.schema.json) | 文書マニフェスト（シート分類＋抽出計画 routingPlan） | — |
| J-10 | [json/J-10.schema.json](./json/J-10.schema.json) | 画面構造 | screen_item, display_mode, parameter_definition, layout_reference |
| J-11 | [json/J-11.schema.json](./json/J-11.schema.json) | 画面動作 | item_control, validation_rule, correlation_validation, ui_event, message_rule |
| J-20 | [json/J-20.schema.json](./json/J-20.schema.json) | 処理・バッチ | process_section, search_requirement, update_requirement, batch_control |
| J-30 | [json/J-30.schema.json](./json/J-30.schema.json) | データモデル・連携 | item_db_mapping, entity_field, attribute_definition, attribute_dictionary_entry, select_constraint, view_definition, view_query_block, external_interface, **entity_relation** |
| J-40 | [json/J-40.schema.json](./json/J-40.schema.json) | 権限・共通 | screen_action_permission, role_hierarchy, case_reference_permission, document_header_metadata, common_rule |
| J-60 | [json/J-60.schema.json](./json/J-60.schema.json) | アセットマニフェスト | —（assets のみ） |
| J-90 | [json/J-90.schema.json](./json/J-90.schema.json) | 評価結果（03-check の意味照合）。check-result.md に書く判定（PASS / PASS_WITH_WARNINGS / FAIL）と findings 表の構造契約であり、JSON ファイルとしての出力は必須ではない | — |

## v2.1.0 からの軽量化点

- `recordBase` から hiddenRow / hiddenColumn / locator / sourceUnitId と coverage / summary の数え上げフィールドを削除（網羅性検査は verify.ps1 に委譲）。
- `additionalProperties:false` はトップレベルと各レコード（recordBase）にのみ残し、facts など深い階層では外す（mini のスキーマ逸脱で全停止させない）。
- J-90 の result 別 allOf 強制（PASS 時カウント0強制等）と metrics 数え上げを撤去し、result + findings の単純なリストにした。
- J-30 に `entity_relation`（leftTable / rightTable / cardinality / basis / description）を新設。設計書に明記された関連または JOIN 由来のみ（AI 推測禁止）。
- 出典 `sourceRef` は { workbook, sheet, range, displayedValue, formula, evidenceType } に軽量化。

## Markdown テンプレート

spec 生成用テンプレート（T-*）は [./markdown/](./markdown/) を参照。標準ファイルセット・spec ツリーは `spec-format/output-structure.md` を正本とする。
