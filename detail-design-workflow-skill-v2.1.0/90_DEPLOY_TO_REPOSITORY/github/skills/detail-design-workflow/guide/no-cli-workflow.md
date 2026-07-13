# CLIを使わない標準運用

- 実行入口はVS CodeのCopilot Chatに表示される番号付きPrompt Files。
- ファイル作成・編集はCopilot AgentとVS Codeのエディタ機能で行う。
- JSON SchemaエラーはVS CodeのProblemsとエディタ表示で確認する。
- テストはVS CodeのTest Explorer等、利用可能なIDE機能で実行する。
- IDEから実行できないテストは、成功と報告せず`未実施`と理由をR-10へ残す。
- ターミナルやシェルコマンドを前提とする手順は標準フローへ含めない。
