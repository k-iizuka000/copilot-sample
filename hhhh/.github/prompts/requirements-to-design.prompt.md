---
agent: agent
description: "Kiro式 工程2: 要件定義から詳細設計を作成する（矛盾は質問票）"
---

# 詳細設計（Kiro 式 工程 2）

推奨モデル: GPT-5.4（high）

## 入力

- 対象機能: ${input:funcId:機能ID（例 FUNC-0123）}

## 前提確認（ゲート）

- status.md を確認し、requirements.md が**人間チェック済み**であること。未チェックなら停止して報告する。
- 未回答の質問票が残っていれば、その要求に依存する設計は保留とし、保留箇所を明記する。

## 読むもの / 読まないもの

- 読む: 対象機能の requirements.md、そこで根拠として参照されている設計書、該当する db/
- 読まない: 他機能の設計書、要求に関係しない設計書

## 手順

1. [詳細設計テンプレート](../templates/design-template.md)の表形式で design.md を作成する: クラス一覧（1 画面 ≒ Controller / Service / Repository / Entity / DTO / Form / テンプレート）、メソッド一覧、使用テーブル、画面遷移。
2. クラス構成・処理の置き場所は DCS のパターン（[java.instructions.md](../instructions/java.instructions.md) のレイヤ責務）に合わせる。**業務ロジックの中身は設計書のみを根拠にする。**
3. 各設計要素に、根拠となる要求 ID を付ける（トレーサビリティ）。
4. 要求の解釈が分かれる箇所は[質問票](../templates/questionnaire-template.md)へ。

## 出力

- design.md
- （あれば）質問票
- status.md の更新（工程 2 完了・人間チェック待ち）

## 停止条件

- 完了後は必ず人間チェック待ちで停止する。次工程（タスク分解）へ自動で進まない。
