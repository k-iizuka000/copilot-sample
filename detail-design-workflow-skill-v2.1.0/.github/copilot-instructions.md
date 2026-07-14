# 詳細設計変換 共通Instructions

このリポジトリで詳細設計ワークフローを実行するときは、以下をすべてのPrompt Fileに共通する規則として扱う。

## 対象範囲

- 目的は、Excel設計書を出典付きJSONへ変換し、そのJSONから詳細設計Markdownを作ること。
- 実装計画、ソースコード、実装レビュー、テストコードは作成・変更しない。
- 業務仕様の根拠は、指定されたExcel設計書またはその入力スナップショットと、EV-01で検証済みのJ-* JSONだけにする。
- 指定されていない設計書、既存コード、Web、別ブックを根拠として使わない。
- 元の設計書を変更しない。Prompt Fileで指定された出力先以外を変更しない。
- ターミナルまたはCLIを標準手順として使用しない。

## 入力と処理単位

- 棚卸しは1回につきExcel 1冊、抽出は1シートまたは1論理ブロックを原則とする。
- 生の`.xlsx`を読み取れない場合は、同じシートのTSV、CSV、Markdown表、または行・節ID付きテキストを要求する。推測で続行しない。
- 指定プロファイルとシート構成が一致しない場合は停止し、`/00-d00-format-survey`または人間確認へ戻す。
- 正本候補の競合、入力切断、ブロック境界不明、出典特定不能はblocking issueにする。

## JSON出力

- `.github/skills/detail-design-workflow/contracts/json/`の対応Schemaへ厳密に適合させる。
- 定義外キーを追加せず、`additionalProperties: false`を守る。
- 不明値は`null`、0件の配列は`[]`とする。空文字や「不明」で代用しない。
- 同じ入力ではIDと並び順を安定させる。
- 確定レコードには1件以上の`sourceRefs`を付ける。
- 全sourceUnitを`extracted`、`metadata`、`asset`、`reference_only`、`ignored`、`issue`のいずれかで説明する。
- `sourceUnitCount = accountedSourceUnitCount`かつ`unaccountedSourceUnitCount = 0`を満たせない場合は`complete`にしない。
- 数式を取得できる場合は表示値と数式文字列を両方保持する。
- 非表示行・列を、非表示であることだけを理由に除外しない。
- 画像、図形、コメント、drawing、media、VMLはJ-60またはissueへ分離し、見た目から仕様を推測しない。

## 分類と問題管理

- `layers`と`scope`を分離する。同じ仕様をレイヤーごとに複製せず、同じRecord IDへ必要な分類を付ける。
- `common`は、複数機能へ適用すると原本に明記されている場合だけ使用する。
- `該当なし`は対象資料を確認して対象レコードがない状態、`未確認`は資料不足・読取不能・判断不能の状態として区別する。
- 次工程へ安全に進めない問題だけ`blocking: true`とする。
- 問題には、Issue ID、種別、要約、人間が一つの判断を返せる確認質問、出典、影響Record IDを付ける。

## 評価

- `PASS`: 欠落、追加仕様、出典欠落、未処理、警告がない。
- `PASS_WITH_WARNINGS`: 確定情報とカバレッジは成立し、非blockingの未確認事項が明示されている。
- `FAIL`: 欠落、追加仕様、出典欠落、未処理、正本競合、blocking issueがある。
- 評価Promptは対象成果物を修正しない。修正は生成工程へ戻って行う。
- AIの評価だけで人間確認を完了扱いにしない。

## Markdown出力

- `.github/skills/detail-design-workflow/contracts/markdown/`のテンプレートに従う。
- `00-overview.md`と`99-traceability.md`は常に作成する。
- `10`〜`60`の分野別Markdownは、対応する確定レコードが1件以上ある場合だけ作成する。
- `90-open-issues.md`は、issueまたは引き継ぐ警告が1件以上ある場合だけ作成する。
- 空ファイル、空の表だけを持つファイル、`該当なし`だけの分野別ファイルは作成しない。既存の不要な空Markdownが出力先にあれば削除する。
- 作成しなかった分野は`00-overview.md`の出力一覧へ`該当なし`として記録する。
- 仕様行にはRecord IDと出典を付ける。JSONに存在しない仕様を追加しない。
- 共通仕様を複数ファイルへ全文複製せず、Record IDまたはリンクで参照する。
- 評価結果はJ-90、人間確認状態はrunフォルダの`status.md`を正本とし、各Markdownへ重複保持しない。

## チャット応答

- 指定された成果物を作成または更新する。
- 最終応答は、結果、出力先、作成・省略・削除したファイル、件数、判定、blocking issueだけを簡潔に報告する。
