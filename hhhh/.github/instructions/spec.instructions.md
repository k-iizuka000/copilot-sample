---
applyTo: "**/spec/**/*.md"
description: "Markdown設計書の構造・記法・トレーサビリティ規約"
---

# Markdown 設計書規約

## ディレクトリ構造（責務分割）

```
spec/
├── front/FUNC-XXXX/
│   ├── layout.md       ← 画面レイアウト
│   ├── items.md        ← 項目定義
│   └── validation.md   ← バリデーション
├── back/FUNC-XXXX/
│   ├── methods.md      ← 画面で使うメソッド
│   └── logic.md        ← 業務ロジック
├── db/T_XXXX.md        ← テーブル単位
├── rules/BR-XXXX.md    ← 業務ルール（ID 台帳）
└── common/             ← 全画面共通部（各機能へ複製しない）
```

- 1 ファイル 1 責務。分割する理由は「読むタスク（消費者）が違う」場合のみ。1 タスクが読むのは 2〜4 ファイルに収まるようにする。
- ファイル名・機能 ID は固定。**リネーム禁止**（リンク切れの主因になるため）。

## 消費マトリクス（生成タスクごとに読む設計書）

| 生成対象 | 読む設計書 |
|---|---|
| Form | items.md + validation.md |
| Thymeleaf | layout.md + items.md |
| Controller | methods.md + validation.md |
| Service | methods.md + logic.md + 該当テーブル（db/） |
| Repository / Entity / DTO | <!-- TODO: 代表機能の実物検証（vertical dig）後に確定 --> |
| バッチ | <!-- TODO: 画面系とは別マトリクスを定義する --> |

## 必須セクション

<!-- TODO: フォーマット定義の確定後、ファイル種別ごと（layout / items / validation / methods / logic / db）の必須見出しをここに列挙する。検証スクリプトの lint 対象と一致させること -->

## 記法

- 業務ルールの参照は ID（BR-XXXX）で書き、ルール本文を複製しない。
- 他設計書への参照は相対パスの Markdown リンクで書く。実在しないリンクを書かない。
- 全画面共通の内容は common/ を参照し、各機能へ複製しない。

## 禁止

- 設計書への実装コードの記載（処理は設計書の語彙で書く）
- 設計書にない仕様の追記（追記が必要と考えたら質問票へ）
