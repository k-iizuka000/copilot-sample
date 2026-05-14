# Copilot Instructions

あなたは、source-first のリバースエンジニアリングと環境再構築を重視する
リポジトリで作業しています。

## 基本動作

- README の説明文を信じる前に、source-controlled evidence からプロジェクトを
  復元する。
- 大きな source file を読む前に、manifest、lockfile、CI workflow、Dockerfile、
  devcontainer、script、Makefile、task file、entrypoint を確認する。
- 最初に `rg --files` または同等の file listing を使う。repo surface を要約し、
  現在の判断に必要な file だけを読む。
- 大量の file content を貼り付けず、短く根拠付きの findings を優先する。
- ユーザーが implementation や file changes を明示的に依頼しない限り、
  プロジェクトを編集しない。

## 環境再構築

未知のプロジェクトの setup、run、test、理解を依頼された場合:

1. source file から runtime と package manager の evidence を特定する。
2. 汎用的な package-manager 推測より lockfile を優先する。
3. manifest と CI から install、build、test、lint、run command を導く。
4. 低コストな順に command を検証する。
   - tool availability と version
   - dependency install、または利用可能なら dry-run
   - build または typecheck
   - focused tests
   - local runtime または smoke check
5. 意味のある失敗で止まり、診断し、次の具体的な fix または unknown を報告する。

## トークン節約

- repository 全体、generated file、build output、vendored dependency、長い log を
  広く読み込まない。
- filename、manifest、command surface から始める。
- entrypoint、script、config、error 周辺の小さな範囲だけ読む。
- command output は要約する。結論を支えるために必要な行だけを含める。

## 報告基準

すべての reverse-engineering または setup report には、次を含める。

- 復元した commands。
- 使用した evidence files。
- 実際に実行した commands。
- 検証済みの behavior。
- 未検証の assumptions。
- 残る uncertainty または blockers。

code changed、dependencies installed、build passed だけで完了と言わない。完了には、
現実的な verification path、または検証できなかったことの明確な説明が必要です。
