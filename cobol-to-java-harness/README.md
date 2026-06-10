# COBOL → Java 移行 AI駆動開発ハーネス（初期MVP）

GitHub Copilot を使って「設計書 → タスク分解 → TDD実装 → 仕様準拠レビュー」を回すための、`.github/` 設定一式のテンプレートです。
COBOLから起こした設計書（Excel → Markdown変換済み）を入力に、**カバレッジ100%のJava実装**を作ることをゴールにしています。

> ⚠️ **使うときの注意**: Copilotは**リポジトリのルート**にある `.github/` しか読みません。
> このディレクトリの中身を案件リポジトリのルートへコピーするか、このディレクトリ自体を新しいリポジトリのルートにしてください。

## 何ができるか（3つのコマンド）

| チャットで入力 | 何が起きるか |
| --- | --- |
| `/breakdown docs/designs/DS-001_振込手数料計算` | **planner** が設計書を読み、実装タスク群を `docs/tasks/` に生成 |
| `/implement docs/tasks/DS-001/T-001_….md` | **implementer** がタスク1件をTDD（テストファースト）で実装 |
| `/review docs/tasks/DS-001/T-001_….md` | **reviewer** が実装を設計書と突合し、承認/要修正を判定 |

各ステップの間には**人間の確認ゲート**があります。詳細は [docs/workflow.md](docs/workflow.md) を見てください。

## 5分で試す

1. このディレクトリをVS Codeで開く（Copilot拡張インストール済み・カスタムエージェント/プロンプト機能が有効なこと）
2. Copilot Chat を開き、`/breakdown docs/designs/DS-001_振込手数料計算` を実行
   - サンプル設計書「振込手数料計算」が入っているので、すぐ試せます
3. 生成された `docs/tasks/DS-001/_index.md` を確認
4. 最初のタスクを `/implement` → 完了したら `/review`
5. `mvn clean verify` が通り、レビューが承認されたら1タスク完了

> `/breakdown` 等の実行時にエージェントが自動で切り替わらない場合は、チャットのエージェント選択で `planner` / `implementer` / `reviewer` を手動で選んでから実行してください（VS Codeのバージョンによって挙動が異なります）。

## 仕組み — 5層の責務分離

修正したいとき「どこを直すか」が迷子にならないよう、設定を5層に分けています。

| 層 | 場所 | 責務 | 例えると |
| --- | --- | --- | --- |
| 共通の掟 | [.github/copilot-instructions.md](.github/copilot-instructions.md) | 全員が常に守るルール（設計書が正、TDD、カバレッジ100%…） | 就業規則 |
| 役割 | [.github/agents/](.github/agents/) | 誰が・何を・どこまでやるか（planner / implementer / reviewer） | 職務記述書 |
| 入口 | [.github/prompts/](.github/prompts/) | 作業の起動コマンド（`/breakdown` `/implement` `/review`） | 作業依頼書 |
| 規約 | [.github/instructions/](.github/instructions/) | ファイル種別ごとの書き方（対象ファイルを触ると自動適用） | コーディング規約 |
| 手順 | [.github/skills/](.github/skills/) | 具体的なやり方・コマンド・テンプレート | 作業手順書 |

```
人間 ──/breakdown──▶ planner ──タスク──▶ 人間が確認 ★
                                            │
人間 ──/implement──▶ implementer ──TDDで実装──▶ レビュー待ち
                                            │
人間 ──/review─────▶ reviewer ──承認/要修正──▶ 人間が確認 ★
                        （要修正なら /implement へ戻る）
```

## ディレクトリ構成

```
.
├── .github/                    # Copilot設定（このハーネスの本体）
│   ├── copilot-instructions.md # 全体共通ルール
│   ├── agents/                 # エージェント定義 ×3
│   ├── prompts/                # 起動コマンド ×3
│   ├── instructions/           # ファイル規約 ×3
│   └── skills/                 # 作業手順書 ×4
├── docs/
│   ├── workflow.md             # 運用ガイド（最初に読む）
│   ├── designs/                # 設計書を置く（サンプル: DS-001）
│   ├── tasks/                  # planner の出力先
│   ├── reviews/                # reviewer の出力先
│   └── questions/              # 仕様疑義の質問票（人間が回答する）
├── pom.xml                     # Java 21 / JUnit 5 / JaCoCo（100%ゲート付き）
└── src/                        # 実装の出力先（main / test）
```

## 品質を担保する仕掛け

- **TDDの強制** — テストより先に本番コードを書くことを禁止。Red（失敗確認）の証跡を残す
- **カバレッジゲート** — `mvn clean verify` がJaCoCoで line/branch 100% 未達なら失敗する。除外は人間の承認制
- **三点突合レビュー** — reviewer はタスクの転記を信用せず、設計書の**原文**とコードを突合する。`mvn clean verify` も自分で再実行する
- **質問票ドリブン** — 設計書が曖昧なとき、エージェントは推測せず `docs/questions/` に質問票を起こして止まる
- **権限分離** — reviewer はコードを修正できない（指摘するだけ）。planner は実装しない

## 案件に合わせてカスタマイズする

| 変えたいこと | 直す場所 |
| --- | --- |
| 技術スタック（Spring Boot導入、Java版数など） | `.github/copilot-instructions.md` の技術スタック表 + `pom.xml` |
| コーディング規約・テスト規約 | `.github/instructions/` |
| タスクの粒度・分割基準 | `.github/skills/design-to-tasks/SKILL.md` |
| レビューの観点追加 | `.github/skills/spec-compliance-review/SKILL.md` |
| カバレッジ目標の変更・除外 | `pom.xml` のJaCoCo設定（除外は承認手続きを経ること） |
| エージェントの役割そのもの | `.github/agents/` |

運用しながら「同じ指摘が繰り返される」と感じたら、その指摘を `instructions/` の規約に昇格させるのがコツです（規約に書けば最初から守られます）。

## 前提環境

- VS Code + GitHub Copilot（カスタムエージェント `.github/agents/` とプロンプトファイル `.github/prompts/` に対応したバージョン）
- Java 21 / Maven 3.9+（`mvn -v` で確認）
- GitHub Copilot CLI や Copilot coding agent でも、同じ `.github/` 定義がそのまま使えます

## このMVPに含まれないもの（今後の拡張候補）

- 結合テスト・E2Eテストのハーネス（現状は単体テストのみ）
- CI（GitHub Actions）での `mvn clean verify` 自動実行
- 複数設計書をまたぐ依存関係の管理
- COBOLソース自体の解析（このハーネスは「設計書化が済んでいる」前提）
