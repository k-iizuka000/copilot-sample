---
applyTo: "**/*.java,**/pom.xml,**/build.gradle,**/build.gradle.kts,**/settings.gradle,**/settings.gradle.kts"
---

# Java / Spring 指示

- Spring Boot では Controller、Service、Repository、DTO の責務を分ける。
- コンストラクタインジェクションを優先し、フィールドインジェクションを避ける。
- 外部入力は Controller 境界で Bean Validation などにより検証する。
- Service にトランザクション境界を置き、読み取り処理は read-only を検討する。
- API レスポンスとエラー形式は既存形式に合わせる。
- 予期しない例外はログに文脈を残し、利用者向けには機密を含まないメッセージにする。
- ページング、ソート、レート制限、認可はエンドポイントの用途に合わせて確認する。
- Lombok、record、例外型、パッケージ構成は既存プロジェクトの規約に合わせる。
