# GitHub Copilot リバースエンジニアリング用サンプル集

このリポジトリは、GitHub Copilot に既存プロジェクトの理解と、
ソースコードからのローカル環境再構築を教えるための、コピーして使える
サンプル集です。

このサンプル集は、source-first と token-aware を重視します。Copilot には、
古いドキュメントを信じたり大きなファイルを読み込んだりする前に、manifest、
lockfile、CI、container、script、entrypoint を確認させます。

## 内容

| パス | 目的 |
| --- | --- |
| `.github/copilot-instructions.md` | Copilot が読み込むリポジトリ全体の指示です。 |
| `.github/agents/` | リバースエンジニアリング作業用の専門 custom agent です。 |
| `.github/skills/` | 環境再構築とコードベース解析の再利用可能な workflow です。 |
| `.github/instructions/` | manifest、検証、未知コード向けの path-specific instructions です。 |
| `office-markdown-vscode-extension/` | Office Markdown VS Code 拡張の実装、SPEC、テスト、VSIXをまとめた成果物ディレクトリです。 |

これらの配置は、GitHub Copilot の repository instructions、custom agents、
agent skills、path-specific instructions の実行面に合わせています。

## クイックスタート

このサンプル集の `.github` ディレクトリを対象リポジトリへコピーしてください。

その後、Copilot に次のように依頼します。

```text
source-first-env-reconstruction skill を使って、このリポジトリの開発環境を
再構築してください。README だけに依存しないでください。検証済み command、
未検証の assumption、残る不確実性を報告してください。
```

```text
reverse-engineering-orchestrator agent を使って、この既存プロジェクトの
compact map を作り、最も安全な build/test/run path を特定してください。
```

```text
reverse-engineering-harness skill を使ってください。まず repo surface snapshot を
作り、その後 source-controlled manifest から dependencies と runtime commands を
推定してください。
```

## 設計原則

- 古い可能性がある説明文より、source-controlled evidence を優先する。
- 低コストな発見から始める。`rg --files`、manifest、lockfile、CI、
  Docker、devcontainer、script を先に見る。
- ファイル全体を貼り付けず、必要な小さな範囲だけ読む。
- 「検証済み」「未検証」「残る不確実性」を分けて報告する。
- setup、build、test、smoke verification を別々の証拠レベルとして扱う。
- ユーザーが明示的に依頼するまで、対象プロジェクトを編集しない。

## 想定ワークフロー

1. 小さな repo surface map を作る。
2. 言語、package manager、runtime、command surface を特定する。
3. manifest と CI から install/build/test/run command を復元する。
4. 低コストな順に command を検証する。
5. ファイル根拠と残る不確実性を含めて結果を報告する。

## ファイルツリー

```text
.github/
  copilot-instructions.md
  agents/
    code-cartographer.agent.md
    environment-reconstructor.agent.md
    reverse-engineering-orchestrator.agent.md
    runtime-verifier.agent.md
  instructions/
    environment-manifests.instructions.md
    reverse-engineering.instructions.md
    verification.instructions.md
  skills/
    reverse-engineering-harness/
      SKILL.md
    source-first-env-reconstruction/
      SKILL.md
      scripts/
        manifest-scan.sh
        repo-surface.sh
```

## 補足

このサンプル集では、top-level の `agents/`、`skills/`、`instructions/` は
作成しません。Copilot が実際に解釈する surface は `.github/` 配下に置くため、
別リポジトリへ直接コピーして使えます。
