# 設計書プロファイル一覧（v3.2.0）

設計書フォーマットごとのシート分類ルール。プロファイル自体の構造は [PROFILE-00.schema.json](./PROFILE-00.schema.json) に従う。

| ID | 対象 | 状態 |
|---|---|---|
| PROFILE-01 | 画面帳票設計書 | stable |
| PROFILE-02 | 処理機能記述書 | stable |
| PROFILE-02B | バッチ設計書 | provisional（暫定） |
| PROFILE-03 | エンティティ・データモデル定義書 | stable |
| PROFILE-04 | VIEW定義書 | stable |
| PROFILE-05 | 権限マトリクス | stable |
| PROFILE-06 | 共通規約・文書（調査用の入口） | provisional（暫定） |

## roleTag 優先ルール（重要）

シートの**固定セル A1 に役割タグの明記（roleTag）があれば、シート名マッチング（pattern）より roleTag を優先する。**
役割タグの候補値は `docs/design-doc-request.md` の一覧（レイアウト / 画面項目(Form) / バリデーション / 項目制御 / イベント / メッセージ / 処理記述 / 検索要領 / 更新要領 / DB項目対応 / エンティティ定義(DTO) / DAOレコード定義 / 権限 / コード値 / 共通規約 / 改訂履歴 / その他）に対応する。
役割タグが無い設計書ではプロファイルのシート名 pattern で推定し、推定であることを J-01 の `sheets[].matchSource`（`inferred`）に記録する。

## 抽出対象 → 出力契約の対応（旧 PROFILE-00 allOf の代替）

PROFILE-00 にあった skill⇔outputContract の双方向強制（allOf）は撤去し、対応をこの表（ドキュメント）で示す。各 profile の `sheetRules[].outputContracts` はこの対応に沿う。recordType→spec 出力先の詳細は `spec-format/routing-table.md` を正本とする。

| 抽出対象（シート役割） | 出力契約 |
|---|---|
| 改訂履歴・ヘッダ等のメタデータ | J-01 |
| 画面項目・レイアウト・パラメータ | J-10（レイアウト画像は J-60 併用） |
| 項目制御・バリデーション・イベント・メッセージ | J-11 |
| 処理機能記述・検索要領・更新要領・バッチ制御 | J-20 |
| 項目DB対応・検索/更新要領のDB面・エンティティ定義・VIEW・外部IF・エンティティ関連 | J-30 |
| 権限マトリクス・案件参照権限・ロール・共通規約 | J-40 |
| 画像・図形・コメント等のアセット | J-60 |

## 暫定プロファイルの扱い

`provisional` のプロファイル（PROFILE-02B / PROFILE-06）は、記載前提と実物が一致する場合だけ通常変換に使う。実物のシート名・見出しと一致しない場合は、推測で既存プロファイルを流用せず、01-setup を調査モードで実行して候補 Profile を作り人間確認へ戻す（停止はしない。機械FAILのみ停止・人間レビューは非ブロッキング）。
