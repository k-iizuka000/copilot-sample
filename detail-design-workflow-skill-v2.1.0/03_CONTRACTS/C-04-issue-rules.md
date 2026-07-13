# C-04 問題・質問票ルール

## issueType

`missing_required_value`, `ambiguous_text`, `cross_document_conflict`, `unknown_sheet`, `unsupported_visual`, `untraceable_source`, `scope_unknown`, `layer_unknown`, `format_version_unknown`, `input_truncated`, `possible_duplicate`, `test_not_executed`

## blocking

次工程へ安全に進めない場合だけ`true`。重要そうという主観では決めない。

## 必須要素

issueId、issueType、blocking、summary、question、sourceRefs、affectedRecordIdsを持つ。質問は、人間が一つの判断を返せる形にする。
