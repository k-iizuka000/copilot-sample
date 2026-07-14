---
id: "{{機能ID or 画面ID or ジョブID}}"
generatedFrom:
  - "{{このランで扱った設計書ファイル名のリスト}}"
generatedAt: "{{生成日時 ISO8601}}"
model: "{{生成/検証を行ったモデル or verify.ps1}}"
provisional: {{true|false}}
---

# {{機能ID}} 警告一覧（warnings）

<!--
使い方: このテンプレートをコピーして runs/{ID}/20-check/warnings.md を作る。
役割: このランで検出された機械FAIL・意味照合の指摘・未レビュー・矛盾検出を1箇所に集約する追記型の台帳。
運用: /01-setup /02-run /03-check・verify.ps1 が検出のたびに1行追記する。解消したら「状態」を 解消 に更新する。
種別の意味:
  - 機械FAIL : JSON 破損・sourceRefs 欠落・routingPlan に無いシート等（決定#7 の停止条件。verify.ps1 も出力）
  - 機械WARN : verify.ps1 の非ブロッキング警告（ルーティング未生成・リンク切れ・lint 指摘等。停止はしない）
  - EV指摘   : /03-check（意味照合）の findings
  - 未レビュー: 人間レビュー未実施のまま進行中（非ブロッキング。停止はしない）
  - 矛盾検出 : 共有領域（db/ common/ rules/）で既存記述と矛盾する定義を検出（両論併記のうえ人間判断待ち）
「内容」には対象の Record ID・ファイルを含めて追跡できるようにする。
-->

| # | 種別（機械FAIL / 機械WARN / EV指摘 / 未レビュー / 矛盾検出） | 内容 | 発生工程 | 状態（未解消 / 解消） |
|---|---|---|---|---|
| {{連番}} | {{種別}} | {{内容（対象 Record ID・ファイルを含む）}} | {{01-setup / 02-run / 03-check / verify.ps1}} | {{未解消 / 解消}} |
