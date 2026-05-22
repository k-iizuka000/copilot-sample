# Markdown HTML Design Samples

Markdown HTML Exporter の生成HTMLを、GitHub README風ではなく「配布用の単体HTML」として見せるための比較サンプルです。

## Samples

- `index.html`: 3つの方向性を1ページで比較できます。
- `sample.md`: 比較に使った代表的なMarkdown入力です。

## Design Inputs

2026-05-22時点で検索した最近の議論では、Markdownは編集・保管のソースとして便利な一方、誰かに見せる最終成果物では、単体HTMLのほうが読みやすいという文脈が増えています。

- Google Developers style guide は、Markdownは書きやすくソースが読みやすいが、HTMLはsemantic taggingや表現力で有利だと説明しています。
- Cloudflare Markdown for Agents は、AI/agent向けにはMarkdownの明示的構造とYAML frontmatterが有用で、HTML側のmetadataやJSON-LDも重要な構造情報として扱っています。
- Reddit の Claude Code / AI Agents 周辺では、agent出力を「clean styling」「summary」「search/filter」「expandable details」を持つstandalone HTML reportにすると、repo外の人に渡しやすいという議論が出ています。

## Direction

標準CSSとしては `Clarity Report` を採用候補にしています。

- メモにもスキル文書にも使える。
- frontmatterを本文から分離して読める。
- references は参照リンクとして扱い、対象Markdown以外を勝手にHTML化しない。
- 外部CSS、外部フォント、外部runtimeに依存しない。
