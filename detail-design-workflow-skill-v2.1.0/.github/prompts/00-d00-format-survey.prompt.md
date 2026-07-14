---
name: '00-d00-format-survey'
description: '未知または改訂済みのExcel設計書フォーマットを調査'
argument-hint: 'sourcePath=... candidateProfileId=... outputPath=... profileOutputPath=...'
agent: 'agent'
---

# 00-d00-format-survey

## 実行パラメータ

- **sourcePath**: `${input:sourcePath:対象設計書1冊}`
- **outputPath**: `${input:outputPath:調査レポート出力先}`
- **candidateProfileId**: `${input:candidateProfileId:未使用のPROFILE-XXまたはPROFILE-XXA}`
- **profileOutputPath**: `${input:profileOutputPath:候補Profile JSON出力先}`

## 参照ファイル

- [共通Instructions](../copilot-instructions.md)
- [入力ソース契約](../skills/detail-design-workflow/contracts/input/I-00-source-input-contract.md)
- [プロファイルSchema](../skills/detail-design-workflow/profiles/PROFILE-00.schema.json)
- [既存プロファイル一覧](../skills/detail-design-workflow/profiles/PROFILE-INDEX.md)

## 使用条件

新しい設計書種類、改訂されたテンプレート、既存プロファイルにないシートを初めて扱うときだけ使用する。通常の変換では実行しない。

## 手順

1. 正確なシート名、表示・非表示状態、使用範囲を列挙する。
2. 各シートを`extract`、`metadata`、`asset`、`reference_only`、`ignore_candidate`、`unknown`へ分類する。
3. 各論理表の見出し、ヘッダ段数、繰り返し単位、主キー候補、ブロック境界を記録する。
4. 結合セル、数式、非表示行・列、コメント、drawing、media、画像、複数表の有無を記録する。
5. 既存プロファイルで処理可能か判定する。
6. 判断できない項目を、人間が回答可能な確認質問として記録する。
7. 調査結果から、`candidateProfileId`を使った`provisional`状態の候補Profileを作る。未確認のシートルールを推測で確定せず、`unknown`と`UNKNOWN`を使い、人間確認が必要な理由を`notes`へ記録する。

## 出力

- 読取状態、シート棚卸し、論理ブロック、関連キー、変換リスク、確認質問を含むMarkdownレポートを`outputPath`へ出力する。
- `PROFILE-00.schema.json`に適合する候補Profile JSONを`profileOutputPath`へ出力する。

候補Profileは既存の`profiles/`へ自動登録せず、`PROFILE-INDEX.md`も変更しない。人間が内容とSchema適合を確認し、承認して登録するまで`/01-e2j-inventory-route`へ進まない。
