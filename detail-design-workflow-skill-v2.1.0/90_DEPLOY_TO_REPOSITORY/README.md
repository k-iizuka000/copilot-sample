# リポジトリへの配置手順（CLI不要）

このフォルダでは、隠しフォルダ問題を避けるため、`.github`を`github`、`.vscode`を`vscode`という可視名で収録しています。

## 配置手順

1. 対象リポジトリのルートをVS Codeまたはエクスプローラーで開く。
2. リポジトリ直下に`.github`フォルダがなければ作る。
3. このフォルダの`github`配下の中身を、リポジトリの`.github`配下へコピーする。
4. リポジトリ直下に`.vscode`フォルダがなければ作る。
5. このフォルダの`vscode/settings.json`を、リポジトリの`.vscode/settings.json`へコピーする。既存設定がある場合は上書きせず、`json.schemas`と`chat.promptFilesLocations`を統合する。
6. VS Codeを再読込する。
7. Copilot Chatで`/01-e2j-inventory-route`が候補に出ることを確認する。

`github/prompts`には、参照先リンクだけではなく全文指示を含むPrompt Filesが入っています。
