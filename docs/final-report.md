# Final Report

今回の結論は、完全一致の公開サンプルを探して真似るのではなく、`Spring規約本文のサンプル群` と `LLMへ渡す文脈設計のサンプル群` を分けて組み合わせるのが正解です。調査範囲では「Java/Springの命名規約・MVC構成・コーディング規約をCopilot skillとして完成済みにした公開repo一式」は確認できませんでしたが、規約本文を書くための十分強い公開サンプルはあります。

確信度: 中。Spring公式、Spring PetClinic、GitHub Copilot公式、Agent Skills仕様、用語集/共有文脈の公開例は揃っています。一方で「Spring規約をCopilot skill化した完成repo一式」は未確認なので、そこは不在を断言しすぎない扱いにします。

## 用語

| 用語 | かんたんに言うと |
|---|---|
| Copilot | GitHub Copilot。コード生成や開発支援をするAI |
| skill | 必要な場面だけ読ませる作業手順パック |
| SKILL.md | skillの入口文書。何をいつ読むか、どう作業するかを書く |
| references | skill内の詳しい規約本文や表を置く場所 |
| Spring MVC | SpringでWeb画面やAPIの入口をController中心に分ける仕組み |
| Controller | HTTPリクエストを受け、画面やJSON応答へつなぐ層 |
| Repository | DBなど永続化データへの出入口 |
| Entity | DB上の主要データをJava側で表すクラス |
| DTO | APIや画面との受け渡し専用データ |
| Ubiquitous Language | 関係者全員で同じ意味で使う業務用語 |
| bounded context | 同じ言葉が同じ意味で通じる範囲 |
| path-scoped rule | 特定フォルダやファイルだけに効くルール |
| formatter | コードの見た目を自動整形する道具 |
| linter | コードの書き方違反を機械的に検査する道具 |
| progressive disclosure | 最初は要点だけ読ませ、必要な時だけ詳細を読ませる設計 |

## 調査軸A: 規約そのものをどう書くか

### 1. 命名規約は「Java表記」より先に「用語集」を作る

命名規約の先頭に置くべきなのは、クラス名の大文字小文字ではなく、ドメイン用語の正本です。Martin FowlerのUbiquitous Languageは、開発者とドメイン側が同じ言葉を使う重要性を示しており、Springの命名規約でもここが土台になります。

| 書く項目 | 目的 | 参考サンプル |
|---|---|---|
| 正式用語 | AIと人間が同じ名前を使う | [Martin Fowler: Ubiquitous Language](https://martinfowler.com/bliki/UbiquitousLanguage.html) |
| 日本語名 / 英語名 | 日本語業務語とJava名を接続する | [mattpocock/skills CONTEXT.md](https://github.com/mattpocock/skills/blob/main/CONTEXT.md) |
| 定義 | 似た言葉との差を固定する | Fowler / CONTEXT.md |
| bounded context | 同じ言葉の意味が通じる範囲を限定する | Fowler |
| 許可alias / 禁止alias | `user` と `account` のような揺れを防ぐ | CONTEXT.md |
| code mapping | 用語とpackage/class/API/tableを対応させる | Spring PetClinicのdomain package |
| business rule | 名前の背後にある制約を残す | DDD系用語集設計 |
| example phrase | 実際にどう呼ぶかを残す | CONTEXT.md |
| owner / version | 誰が用語変更を承認するかを固定する | LLM文脈設計の運用項目 |

Java表記規則はその次です。クラス名、メソッド名、定数名、package名の粒度は[Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)が参考になります。ただし整形は[google-java-format](https://github.com/google/google-java-format)など機械に寄せ、文章規約には「formatterを正本にする」と書くのがよいです。

### 2. Spring MVC構成はSpring Boot公式とPetClinicを主サンプルにする

Spring Boot公式は固定レイアウトを要求していません。ただし、root packageの下にdomain/feature別packageを置き、その中に`Controller`、`Service`、`Repository`、Entity相当を置くtypical layoutを示しています。

規約本文を書くときの最有力サンプルは[Spring PetClinic](https://github.com/spring-projects/spring-petclinic)です。理由は、単なる説明ではなく、Spring MVCのdomain package、Controller、Repository、view名、testが実アプリとして揃っているからです。

| 規約項目 | 書くべき内容 | 参考サンプル |
|---|---|---|
| root package | `Application` classを上位packageへ置き、default packageを避ける | [Spring Boot: Structuring Your Code](https://docs.spring.io/spring-boot/reference/using/structuring-your-code.html) |
| package方針 | 原則domain/feature単位。layer単位だけに固定しない | Spring Boot公式 / PetClinic |
| Controller責務 | requestを受け、model/viewまたはresponseへつなぐ。業務判断を厚くしない | [Spring Framework: Annotated Controllers](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller.html) |
| MVC画面 | `@Controller`、Model、view nameの責務を分ける | [Spring Guide: Serving Web Content](https://spring.io/guides/gs/serving-web-content/) |
| REST API | `@RestController`、request/response DTO、JSON応答を分ける | [Spring Guide: REST Service](https://spring.io/guides/gs/rest-service/) |
| Entity / Repository | 永続化モデルとデータアクセスを分ける | [Spring Guide: Accessing Data with JPA](https://spring.io/guides/gs/accessing-data-jpa/) |
| Service | transactionや複数Repository調整が必要な時に置く。常に必須とは書かない | PetClinic / PetClinic REST |
| module境界 | 大規模化する場合だけpackage公開範囲や依存方向を強める | [Spring Modulith: Fundamentals](https://docs.spring.io/spring-modulith/reference/fundamentals.html) |

### 3. コーディング規約は「文章で守るもの」と「機械で守るもの」を分ける

文章規約にformatterで直せる話を書きすぎると、LLMにも人間にもノイズになります。規約本文では、設計判断・例外処理・validation・transaction・DTO/Entity分離・test方針を中心にし、整形はformatter/linter/CIへ寄せます。

| 領域 | 必須項目 | 正本候補 |
|---|---|---|
| Java命名 | package、class、method、field、constant、test名 | Google Java Style Guide + project glossary |
| Spring命名 | `Controller`、`RestController`、`Repository`、`Service`、`Dto`、`Mapper` suffix | Spring公式guide / PetClinic |
| validation | 入力検証の場所、Controllerでやること、Serviceでやること | Spring MVC公式 |
| error handling | 例外分類、HTTP status、共通handler、ログ方針 | Spring MVC annotated controllers |
| transaction | transaction境界をControllerに置かない | Spring/Spring Data設計判断 |
| DTO / Entity | REST入出力と永続化Entityを混ぜない条件 | REST guide / PetClinic REST |
| tests | Controller slice test、Repository test、full integration testの追加条件 | PetClinic tests / Spring testing guide |
| formatting | formatterを正本にし、文章規約で重複しない | google-java-format or Spring Java Format |

## 調査軸B: LLM / Copilot skillへどう渡すか

Copilot側は、常時読ませるinstructionsと、必要時だけ読ませるskillを分けるのが現行公式ドキュメントと整合します。GitHub Copilot公式は、repository instructionsは短く自己完結した補助文脈として扱い、agent skillsは`SKILL.md`、scripts、resources、examplesを関連タスク時に使うものとして説明しています。

### SKILL.mdに書く内容

`SKILL.md`は規約本文の置き場ではなく、規約を読ませるための入口です。ここに書くべき内容は次です。

| SKILL.md項目 | 書く内容 |
|---|---|
| description | どの作業でこのskillを使うか。例: Spring Controller追加、domain model追加、規約レビュー |
| required context | 作業前に読むreferenceの順番 |
| procedure | 変更前確認、設計、実装、自己レビューの手順 |
| output contract | 生成物に含めるべきもの、含めないもの |
| validation checklist | 規約違反、test、formatter、依存方向の確認 |
| escalation condition | 用語未定義、責務境界不明、例外ルール未定義の時に人間へ確認する条件 |

### referencesに置く内容

規約の本文は、LLMが必要時に読む詳しい参照として分けます。

| reference | 置く内容 |
|---|---|
| `domain-glossary.md` | 用語、定義、禁止alias、code mapping、business rule |
| `naming-rules.md` | Java/Spring/package/API/DB/testの命名表 |
| `spring-mvc-structure.md` | Controller/Service/Repository/Entity/DTO/Viewの責務表 |
| `coding-rules.md` | validation、error handling、transaction、logging、testing |
| `examples.md` | 良い命名、悪い命名、責務違反、修正例 |
| `review-checklist.md` | 生成後にLLM自身が確認する項目 |

この分け方は[Agent Skills Specification](https://agentskills.io/specification)の`SKILL.md` + supporting filesという構造、GitHub Copilotのskills/resources説明、Claude/AGENTS系のprogressive disclosureパターンと矛盾しません。

## 公開サンプル対応表

| 目的 | 最優先サンプル | 何が分かる |
|---|---|---|
| Spring package構成を書く | [Spring Boot: Structuring Your Code](https://docs.spring.io/spring-boot/reference/using/structuring-your-code.html) | root package、default package禁止、domain/feature package例 |
| Spring MVC規約本文を書く | [spring-projects/spring-petclinic](https://github.com/spring-projects/spring-petclinic) | Controller/Repository/test/view名の実アプリ例 |
| Controller責務を書く | [Spring Framework: Annotated Controllers](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller.html) | request mapping、input、exception handlingの責務 |
| MVC viewの例を書く | [Spring Guide: Serving Web Content](https://spring.io/guides/gs/serving-web-content/) | `@Controller`とview名の最小例 |
| REST APIの例を書く | [Spring Guide: REST Service](https://spring.io/guides/gs/rest-service/) | `@RestController`とJSON応答の最小例 |
| Entity/Repositoryを書く | [Spring Guide: Accessing Data with JPA](https://spring.io/guides/gs/accessing-data-jpa/) | EntityとRepositoryの分け方 |
| Java命名規約を書く | [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html) | Javaの命名・整形・コメント粒度 |
| 整形正本を決める | [google-java-format](https://github.com/google/google-java-format) | formatterで守る範囲 |
| domain用語集を書く | [Martin Fowler: Ubiquitous Language](https://martinfowler.com/bliki/UbiquitousLanguage.html) | 用語統一がなぜ必要か |
| shared context例を見る | [mattpocock/skills CONTEXT.md](https://github.com/mattpocock/skills/blob/main/CONTEXT.md) | glossary的な文脈ファイルの公開例 |
| Copilot文脈を分ける | [GitHub Copilot custom instructions](https://docs.github.com/en/copilot/concepts/about-customizing-github-copilot-chat-responses) | repository instructionsを短く保つ考え方 |
| Copilot skillへ渡す | [GitHub Copilot: Add skills](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/add-skills) | `SKILL.md`、scripts/resources/examplesの扱い |
| skill構造を設計する | [Agent Skills Specification](https://agentskills.io/specification) | `references/`などsupporting filesの分け方 |

## 設計方法

1. domain glossaryを先に作る。命名規約は用語集の派生物として扱う。
2. Spring MVC構成を責務表にする。Controller、Service、Repository、Entity、DTO、Viewで「置くもの」「置かないもの」「例外条件」を書く。
3. Java/Spring命名表を作る。Java表記、Spring suffix、package、API、DB、test名を1つの表でつなぐ。
4. formatter/linter/CIの正本範囲を決める。文章規約と機械検査を重複させない。
5. 規約本文をreferenceに分ける。LLMが必要な時だけ読む粒度にする。
6. SKILL.mdには読む順序と検証手順を書く。規約全文を詰めない。
7. 最後にreview checklistを作る。LLMが生成後に、用語・責務・命名・test・formatterを自己確認できる形にする。

## 最終判断

この調査で採用すべき完成形は、「Spring規約本文はSpring公式 + PetClinic + Google Java Style + Fowlerで作る」「LLMへの渡し方はGitHub Copilot公式 + Agent Skills仕様のprogressive disclosureで作る」です。

特に重要なのは、命名規約を単なる命名スタイルにしないことです。最初に用語集を作り、そこからpackage名、class名、DTO名、API名、DB名へ落とすと、LLMが規約を読み込んだ時に一貫した名前を出しやすくなります。

人間レビューが必要な未確定点は、Spring Boot version、MVCがserver-rendered中心かREST中心か、formatterをGoogle Java FormatにするかSpring Java Formatにするか、domain glossaryの承認者を誰にするかです。
