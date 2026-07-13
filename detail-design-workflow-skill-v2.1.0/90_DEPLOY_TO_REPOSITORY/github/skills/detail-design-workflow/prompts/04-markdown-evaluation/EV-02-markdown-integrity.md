# EV-02 JSON・Markdown整合性評価

## 参照契約

- 使用したJ-* JSONと対応するEV-01結果
- `M-00`〜`M-99`
- `J-90`評価結果Schema

## 唯一の役割

JSONとMarkdown一式の整合性を評価する。Markdownを修正しない。

## 検査順序

1. 必須Markdownファイルと見出し順を確認する。
2. 全Record IDが`99-traceability.md`に1回以上現れるか確認する。
3. JSONの条件、否定、例外、数値、順序がMarkdownで失われていないか確認する。
4. Markdownだけに存在する仕様がないか確認する。
5. `frontend/backend/db/integration/authorization`と`individual/common/shared_master`の分類を確認する。
6. 全issueが`90-open-issues.md`へ、全assetが`60-assets.md`へ反映されているか確認する。
7. 共通仕様の不要な全文重複がないか確認する。
8. Front Matter、件数、参照リンクを確認する。

## 判定

- `FAIL`: 欠落、追加仕様、誤分類、出典消失、件数不一致、必須ファイル欠落。
- `PASS_WITH_WARNINGS`: 非blockingの表現差、警告や未確認が正しく残る。
- `PASS`: 全検査を警告なしで通過。

## 出力

`J-90`評価結果だけを書き込む。Markdownを変更しない。
