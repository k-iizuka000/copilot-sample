# Copilot まとめセット（DWS）

GitHub Copilot（VS Code / Chat・Agent モード）向けのカスタマイズ一式。DWS の Copilot 支援作業で、**性能・品質を上げつつトークン（クレジット）消費を下げる**ための構成。

このディレクトリは claude-work 側のステージング場所。実際に使うときは、作業リポジトリのルート `.github/` へ一式を配置する（copilot-sample 経由で仕事 PC へ共有）。

## 仕組みと「いつ読まれるか」

Copilot が読むカスタマイズは 4 種類あり、読み込まれるタイミングが違う。これがトークン経済の土台になる。

| 場所 | 読まれるタイミング | 役割 |
|---|---|---|
| `copilot-instructions.md` | **毎回**（チャット・生成のたび） | 絶対ルールだけを薄く。ここが太るほど全リクエストが高くなる |
| `instructions/*.instructions.md` | applyTo の glob に合うファイルを扱うときだけ | ファイル種別ごとの規約（自動適用） |
| `prompts/*.prompt.md` | チャットで `/ファイル名` と打ったときだけ | 定型ワークフロー（スキル相当） |
| `agents/*.agent.md` | そのエージェントを選んでいる間 | 用途別カスタムエージェント（役割・使える道具・モデルの固定） |
| `templates/` | プロンプトから参照されたときだけ | 質問票などの共通テンプレート |

## ファイル一覧

```
.github/
├── copilot-instructions.md            常時読み込みの土台（絶対ルールのみ・薄く保つ）
├── instructions/
│   ├── spec.instructions.md           Markdown設計書規約＋消費マトリクス（正本）
│   ├── java.instructions.md           Java規約・トレーサビリティヘッダ
│   ├── thymeleaf.instructions.md      テンプレート規約
│   └── test.instructions.md           テスト規約（TDD・カバレッジ100%）
├── prompts/
│   │ --- 基盤づくり（今のフェーズ） ---
│   ├── excel-to-spec-md.prompt.md     Excel変換Markdownの整形・責務分割
│   ├── spec-format-check.prompt.md    設計書のフォーマット準拠チェック
│   ├── naming-convention-draft.prompt.md  DCS調査→命名規約ドラフト起草
│   ├── which-docs.prompt.md           作業前に読む資料の最小セットを決める
│   ├── session-handover.prompt.md     セッション終了前の引き継ぎ記録
│   │ --- Kiro式スペック開発（実装フェーズ） ---
│   ├── spec-to-requirements.prompt.md 工程1: 要件定義
│   ├── requirements-to-design.prompt.md   工程2: 詳細設計
│   ├── design-to-tasks.prompt.md      工程3: タスク分解
│   ├── implement-task.prompt.md       工程4: TDD実装
│   │ --- 補助ワークフロー ---
│   ├── refactor-existing.prompt.md    既存コードの挙動不変リファクタ
│   ├── review-fix.prompt.md           レビュー指摘の分類・反映修正
│   ├── dcs-compare.prompt.md          DWS実装とDCSパターンの照合
│   ├── impact-analysis.prompt.md      設計変更の影響範囲分析
│   └── browser-test-cases.prompt.md   設計書ベースのブラウザテストケース作成
├── agents/
│   ├── dws-research.agent.md          調査専用（mini・読み取りのみ）
│   ├── dws-spec-author.agent.md       設計書執筆（spec/ 以外を編集しない）
│   └── dws-implement.agent.md         実装用（TDD・質問票で停止）
└── templates/
    ├── questionnaire-template.md      質問票（種別の判定基準つき・表形式）
    ├── requirements-template.md       Kiro式 工程1（要件定義）の出力フォーマット
    ├── design-template.md             Kiro式 工程2（詳細設計）の出力フォーマット
    └── tasks-template.md              Kiro式 工程3（タスク分解）の出力フォーマット
```

## 導入手順（仕事 PC）

1. このディレクトリ一式を作業リポジトリのルート `.github/` に配置する。
2. VS Code 設定を確認する（最近の VS Code では既定で有効なことが多い）:

   ```json
   {
     "github.copilot.chat.codeGeneration.useInstructionFiles": true,
     "chat.promptFilesLocations": { ".github/prompts": true },
     "chat.instructionsFilesLocations": { ".github/instructions": true },
     "chat.agentFilesLocations": { ".github/agents": true }
   }
   ```

   上記の場所指定は既定値と同じなので、既定のままなら追記不要。旧キー `chat.promptFiles`（boolean）は非推奨。

3. agents の `model:` はモデルピッカーの表示名と完全一致が必要。仕事 PC の Copilot でモデル名の表記（`GPT-5.4` 等）を確認し、違ったら書き換える。
4. 動作確認: チャットで `/which-docs` と打って候補に出るか。エージェント選択ドロップダウンに `dws-research` が出るか。

## 今のフェーズ（基盤づくり）での使い方

| やりたいこと | 使うもの |
|---|---|
| DCS を調べて命名規約を作る | エージェント `dws-research` で下調べ → `/naming-convention-draft` |
| Excel 変換した設計書を整形する | `/excel-to-spec-md`（`dws-spec-author` エージェントで自動実行） |
| 設計書のフォーマット準拠を確認する | `/spec-format-check` |
| 作業前に読む資料を絞る | `/which-docs` |
| セッションを閉じる前 | `/session-handover` |

## 実装フェーズでの使い方（引き継ぎ用）

Kiro 式の流れ（各工程の後に必ず人間チェック。ゲート未通過では次へ進めない）:

`/spec-to-requirements` → 人間チェック → `/requirements-to-design` → 人間チェック → `/design-to-tasks` → 人間チェック → `/implement-task`（タスクごとに人間レビュー）

補助: `/refactor-existing` `/review-fix` `/dcs-compare` `/impact-analysis` `/browser-test-cases`

## 運用ルール

- **copilot-instructions.md を太らせない。** 規約の追加は `instructions/` の該当ファイルへ。常時読み込みに置くのは「全作業で毎回必要な絶対ルール」だけ。
- モデル選択: 標準は GPT-5.4（high）。広く浅い調査は mini。間違えると手戻りが大きい判断（正誤・設計・DCS 差分）は mini で完結させない。各プロンプトの冒頭に推奨モデルを記載済み。
- 並列実行は最大 2 まで（PC 負荷の運用制約）。
- 質問票が出たら該当作業は止める（他の独立した作業は進めてよい）。
- 成果物の記録（質問票・要件・設計・タスク・テスト結果）は **Excel 転記前提の表形式**で書く（`templates/` 準拠）。セクション見出しの散文で書かない。表は `|` 区切りのため、Excel の「区切り位置」で列分割できる。
- **1 タスク = 1 セッション**を基本にする。従量課金では会話履歴全体が毎メッセージ再送信・再課金されるため、長いセッションほど 1 回あたりの単価が上がる。区切りで `/session-handover` を実行してから新しいセッションを始める。

## TODO（規約・フォーマット確定後に埋める場所）

各ファイル内の `<!-- TODO: -->` マーカーが正。主な場所:

| ファイル | 埋める内容 |
|---|---|
| `instructions/spec.instructions.md` | 必須セクション定義、Repository/Entity/DTO・バッチの消費マトリクス（代表機能の実物検証後） |
| `instructions/java.instructions.md` | 命名規約の転記、レイヤ責務の定義 |
| `instructions/thymeleaf.instructions.md` | フラグメント規約、id/name 命名 |
| `instructions/test.instructions.md` | テスト命名規約 |
| `prompts/spec-to-requirements.prompt.md` | 機能ごとの作業ディレクトリパス |
| `templates/requirements-template.md` | 要求の分類語彙の調整 |

## 追加候補（今回は見送り）

- `.github/skills/`（Agent Skills、形式: `.github/skills/<名前>/SKILL.md`）: 仕事 PC の Copilot で利用可能。自動発動させたい横断知識（DCS 調査の作法、表形式出力の流儀など）の移設候補。工程ゲートのある作業（Kiro 式）は、意図せず発動しないよう明示呼び出しの prompts のままにする。
- SQL / Repository 向け instructions（ORM・SQL の管理方式が判明したら）
- バッチ実装用プロンプト（バッチの消費マトリクス定義後）
- 検証スクリプト連携（lint 整備後、`/spec-format-check` を意味判断専用に縮小する）
- `AGENTS.md`: Copilot 以外の AI ツールとの併用時に使う仕組み。本案件は Copilot 限定のため `copilot-instructions.md` に一本化し、二重管理を避けている。
