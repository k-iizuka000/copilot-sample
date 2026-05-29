---
description: Playwright を使用してエンドツーエンドテストを生成して実行します。テストジャーニーを作成し、テストを実行し、スクリーンショット/ビデオ/トレースをキャプチャし、アーティファクトをアップロードします。
---

# E2E コマンド

このコマンドは **e2e-runner** エージェントを呼び出して、Playwright を使用してエンドツーエンドテストを生成、保守、実行します。

## このコマンドの機能

1. **テストジャーニー生成** - ユーザーフローの Playwright テストを作成
2. **E2E テスト実行** - 複数ブラウザ間でテストを実行
3. **アーティファクトキャプチャ** - 失敗時のスクリーンショット、ビデオ、トレース
4. **結果アップロード** - HTML レポートと JUnit XML
5. **不安定なテスト識別** - 不安定なテストを分離

## 使用するタイミング

以下の場合に `/e2e` を使用します：

* 重要なユーザージャーニーをテスト（ログイン、取引、支払い）
* マルチステップフローがエンドツーエンドで機能することを検証
* UI インタラクションとナビゲーションをテスト
* フロントエンドとバックエンド間の統合を検証
* 本番環境デプロイメント向けの準備

## 動作方法

e2e-runner エージェントは：

1. **ユーザーフローを分析**してテストシナリオを特定
2. **ページオブジェクトモデルパターンを使用して Playwright テストを生成**
3. **複数ブラウザ間（Chrome、Firefox、Safari）でテストを実行**
4. **失敗をキャプチャ**（スクリーンショット、ビデオ、トレース含む）
5. **結果とアーティファクトを含むレポートを生成**
6. **不安定なテストを特定**して修正を推奨

## 使用例

````
ユーザー: /e2e 市場の検索と表示フローをテストして

エージェント (e2e-runner):
# E2E テスト生成: 市場の検索と表示フロー

## 特定したテストシナリオ

**ユーザージャーニー:** 市場検索 → 結果表示 → 市場をクリック → 詳細表示

**テストカバレッジ:**
1. markets ページへ移動
2. セマンティック検索を実行
3. 検索結果を検証
4. 最初の結果をクリック
5. 市場詳細ページが読み込まれることを検証
6. チャートがレンダリングされることを検証

## 生成されたテストコード

```typescript
// tests/e2e/markets/search-and-view.spec.ts
import { test, expect } from '@playwright/test'
import { MarketsPage } from '../../pages/MarketsPage'
import { MarketDetailsPage } from '../../pages/MarketDetailsPage'

test.describe('市場の検索と表示フロー', () => {
  test('ユーザーが市場を検索して詳細を表示できる', async ({ page }) => {
    // 1. markets ページへ移動
    const marketsPage = new MarketsPage(page)
    await marketsPage.goto()

    // ページが読み込まれたことを検証
    await expect(page).toHaveTitle(/Markets/)
    await expect(page.locator('h1')).toContainText('Markets')

    // 2. セマンティック検索を実行
    await marketsPage.searchMarkets('election')

    // API レスポンスを待機
    await page.waitForResponse(resp =>
      resp.url().includes('/api/markets/search') && resp.status() === 200
    )

    // 3. 検索結果を検証
    const marketCards = marketsPage.marketCards
    await expect(marketCards.first()).toBeVisible()
    const resultCount = await marketCards.count()
    expect(resultCount).toBeGreaterThan(0)

    // 検索結果のスクリーンショットを撮影
    await page.screenshot({ path: 'artifacts/search-results.png' })

    // 4. 最初の結果をクリック
    const firstMarketTitle = await marketCards.first().textContent()
    await marketCards.first().click()

    // 5. 市場詳細ページが読み込まれることを検証
    await expect(page).toHaveURL(/\/markets\/[a-z0-9-]+/)

    const detailsPage = new MarketDetailsPage(page)
    await expect(detailsPage.marketName).toBeVisible()
    await expect(detailsPage.marketDescription).toBeVisible()

    // 6. チャートがレンダリングされることを検証
    await expect(detailsPage.priceChart).toBeVisible()

    // 市場名が一致することを検証
    const detailsTitle = await detailsPage.marketName.textContent()
    expect(detailsTitle?.toLowerCase()).toContain(
      firstMarketTitle?.toLowerCase().substring(0, 20) || ''
    )

    // 市場詳細のスクリーンショットを撮影
    await page.screenshot({ path: 'artifacts/market-details.png' })
  })

  test('結果がない検索では空状態が表示される', async ({ page }) => {
    const marketsPage = new MarketsPage(page)
    await marketsPage.goto()

    // 存在しない市場を検索
    await marketsPage.searchMarkets('xyznonexistentmarket123456')

    // 空状態を検証
    await expect(page.locator('[data-testid="no-results"]')).toBeVisible()
    await expect(page.locator('[data-testid="no-results"]')).toContainText(
      /no.*results|no.*markets/i
    )

    const marketCount = await marketsPage.marketCards.count()
    expect(marketCount).toBe(0)
  })

  test('検索をクリアしてすべての市場を再表示できる', async ({ page }) => {
    const marketsPage = new MarketsPage(page)
    await marketsPage.goto()

    // 初期の市場数
    const initialCount = await marketsPage.marketCards.count()

    // 検索を実行
    await marketsPage.searchMarkets('trump')
    await page.waitForLoadState('networkidle')

    // フィルタ後の結果を検証
    const filteredCount = await marketsPage.marketCards.count()
    expect(filteredCount).toBeLessThan(initialCount)

    // 検索をクリア
    await marketsPage.searchInput.clear()
    await page.waitForLoadState('networkidle')

    // すべての市場が再表示されることを検証
    const finalCount = await marketsPage.marketCards.count()
    expect(finalCount).toBe(initialCount)
  })
})
````

## テスト実行

```bash
# 生成されたテストを実行
npx playwright test tests/e2e/markets/search-and-view.spec.ts

3 件のテストを 3 ワーカーで実行中

  ✓  [chromium] › search-and-view.spec.ts:5:3 › ユーザーが市場を検索して詳細を表示できる (4.2s)
  ✓  [chromium] › search-and-view.spec.ts:52:3 › 結果がない検索では空状態が表示される (1.8s)
  ✓  [chromium] › search-and-view.spec.ts:67:3 › 検索をクリアしてすべての市場を再表示できる (2.9s)

  3 件成功 (9.1s)

生成されたアーティファクト:
- artifacts/search-results.png
- artifacts/market-details.png
- playwright-report/index.html
```

## テストレポート

```
╔══════════════════════════════════════════════════════════════╗
║                    E2E テスト結果                            ║
╠══════════════════════════════════════════════════════════════╣
║ ステータス: ✅ すべてのテストが成功                          ║
║ 合計:       3 件のテスト                                     ║
║ 成功:       3 (100%)                                         ║
║ 失敗:       0                                                ║
║ 不安定:     0                                                ║
║ 所要時間:   9.1s                                             ║
╚══════════════════════════════════════════════════════════════╝

アーティファクト:
📸 スクリーンショット: 2 ファイル
📹 ビデオ: 0 ファイル（失敗時のみ）
🔍 トレース: 0 ファイル（失敗時のみ）
📊 HTML レポート: playwright-report/index.html

レポートを表示: npx playwright show-report
```

✅ E2E テストスイートは CI/CD 統合の準備ができました！

````

## テストアーティファクト

テスト実行時には、以下のアーティファクトがキャプチャされます:

**すべてのテスト:**
- タイムラインと結果を含む HTML レポート
- CI 統合用の JUnit XML

**失敗時のみ:**
- 失敗状態のスクリーンショット
- テストのビデオ録画
- デバッグ用トレースファイル（ステップごとの再生）
- ネットワークログ
- コンソールログ

## アーティファクトの確認

```bash
# HTML レポートをブラウザで表示
npx playwright show-report

# 特定のトレースファイルを表示
npx playwright show-trace artifacts/trace-abc123.zip

# スクリーンショットは artifacts/ ディレクトリに保存される
open artifacts/search-results.png
````

## 不安定なテスト検出

テストが断続的に失敗する場合：

```
⚠️  不安定なテストを検出: tests/e2e/markets/trade.spec.ts

テストは 10 回中 7 回成功（成功率 70%）

よくある失敗:
"Timeout waiting for element '[data-testid="confirm-btn"]'"

推奨修正:
1. 明示的な待機を追加: await page.waitForSelector('[data-testid="confirm-btn"]')
2. タイムアウトを増やす: { timeout: 10000 }
3. コンポーネント内の race condition を確認
4. 要素がアニメーションで隠れていないことを確認

隔離の推奨: 修正されるまで test.fixme() としてマーク
```

## ブラウザ設定

デフォルトでは、テストは複数のブラウザで実行されます：

* ✅ Chromium（デスクトップ Chrome）
* ✅ Firefox（デスクトップ）
* ✅ WebKit（デスクトップ Safari）
* ✅ Mobile Chrome（オプション）

`playwright.config.ts` で設定してブラウザを調整します。

## CI/CD 統合

CI パイプラインに追加：

```yaml
# .github/workflows/e2e.yml
- name: Playwright をインストール
  run: npx playwright install --with-deps

- name: E2E テストを実行
  run: npx playwright test

- name: アーティファクトをアップロード
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## PMX 固有の重要フロー

PMX の場合、以下の E2E テストを優先：

**🔴 重大（常に成功する必要）：**

1. ユーザーがウォレットを接続できる
2. ユーザーが市場をブラウズできる
3. ユーザーが市場を検索できる（セマンティック検索）
4. ユーザーが市場の詳細を表示できる
5. ユーザーが取引注文を出せる（テスト資金を使用）
6. 市場が正しく決済される
7. ユーザーが資金を引き出せる

**🟡 重要：**

1. 市場作成フロー
2. ユーザープロフィール更新
3. リアルタイム価格更新
4. チャートレンダリング
5. 市場のフィルタリングとソート
6. モバイルレスポンシブレイアウト

## ベストプラクティス

**すべき事：**

* ✅ 保守性を高めるためページオブジェクトモデルを使用
* ✅ セレクタとして data-testid 属性を使用
* ✅ 任意のタイムアウトではなく API レスポンスを待機
* ✅ 重要なユーザージャーニーのエンドツーエンドテスト
* ✅ main にマージする前にテストを実行
* ✅ テスト失敗時にアーティファクトをレビュー

**すべきでない事：**

* ❌ 不安定なセレクタを使用（CSS クラスは変わる可能性）
* ❌ 実装の詳細をテスト
* ❌ 本番環境に対してテストを実行
* ❌ 不安定なテストを無視
* ❌ 失敗時にアーティファクトレビューをスキップ
* ❌ E2E テストですべてのエッジケースをテスト（単体テストを使用）

## 重要な注意事項

**PMX にとって重大：**

* 実際の資金に関わる E2E テストは**テストネット/ステージング環境でのみ実行**する必要があります
* 本番環境に対して取引テストを実行しないでください
* 金融テストに `test.skip(process.env.NODE_ENV === 'production')` を設定
* 少量のテスト資金を持つテストウォレットのみを使用

## 他のコマンドとの統合

* `/plan` を使用してテストする重要なジャーニーを特定
* `/tdd` を単体テストに使用（より速く、より細粒度）
* `/e2e` を統合とユーザージャーニーテストに使用
* `/code-review` を使用してテスト品質を検証

## 関連エージェント

このコマンドは `~/.claude/agents/e2e-runner.md` の `e2e-runner` エージェントを呼び出します。

## クイックコマンド

```bash
# すべての E2E テストを実行
npx playwright test

# 特定のテストファイルを実行
npx playwright test tests/e2e/markets/search.spec.ts

# headed モードで実行（ブラウザを表示）
npx playwright test --headed

# テストをデバッグ
npx playwright test --debug

# テストコードを生成
npx playwright codegen http://localhost:3000

# レポートを表示
npx playwright show-report
```
