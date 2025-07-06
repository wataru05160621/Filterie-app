import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('should perform global search', async ({ page }) => {
    await page.goto('/');
    
    // グローバル検索バーに入力
    const searchInput = page.locator('input[placeholder="検索..."]');
    await searchInput.fill('技術革新');
    await searchInput.press('Enter');
    
    // 検索結果ページに遷移
    await expect(page).toHaveURL(/\/search\?q=技術革新/);
    
    // 検索結果が表示される
    await expect(page.locator('h1')).toContainText('検索結果');
    await expect(page.locator('text=技術革新')).toBeVisible();
  });

  test('should filter search results', async ({ page }) => {
    await page.goto('/search?q=AI');
    
    // 日付フィルターを適用
    await page.click('button:has-text("期間")');
    await page.click('text=過去1週間');
    
    // Tierフィルターを適用
    await page.click('button:has-text("情報源Tier")');
    await page.click('label:has-text("Tier 1のみ")');
    
    // フィルターが適用されたことを確認
    await expect(page.locator('text=過去1週間')).toBeVisible();
    await expect(page.locator('[data-testid="tier-badge"]:has-text("Tier 1")')).toBeVisible();
  });

  test('should save search', async ({ page }) => {
    await page.goto('/search?q=量子コンピュータ');
    
    // 検索を保存
    await page.click('button:has-text("検索を保存")');
    
    // 保存名を入力
    await page.fill('input[placeholder="保存名を入力"]', '量子コンピュータ関連');
    await page.click('button:has-text("保存")');
    
    // 保存された検索に移動
    await page.goto('/saved-searches');
    
    // 保存した検索が表示される
    await expect(page.locator('text=量子コンピュータ関連')).toBeVisible();
  });

  test('should show search suggestions', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator('input[placeholder="検索..."]');
    await searchInput.fill('ブロック');
    
    // サジェストが表示されるのを待つ
    await page.waitForSelector('[data-testid="search-suggestions"]');
    
    // サジェスト項目を確認
    const suggestions = page.locator('[data-testid="search-suggestion"]');
    await expect(suggestions).toHaveCount(await suggestions.count());
    
    // サジェストをクリック
    await suggestions.first().click();
    
    // 検索が実行される
    await expect(page).toHaveURL(/\/search\?q=/);
  });

  test('should show recent searches', async ({ page }) => {
    // 複数の検索を実行
    const searches = ['AI', '量子コンピュータ', 'ブロックチェーン'];
    
    for (const term of searches) {
      await page.goto('/');
      const searchInput = page.locator('input[placeholder="検索..."]');
      await searchInput.fill(term);
      await searchInput.press('Enter');
      await page.waitForURL(/\/search/);
    }
    
    // ホームに戻る
    await page.goto('/');
    
    // 検索ボックスにフォーカス
    await page.click('input[placeholder="検索..."]');
    
    // 最近の検索が表示される
    await expect(page.locator('text=最近の検索')).toBeVisible();
    
    // 最近の検索項目が表示される
    for (const term of searches.reverse()) { // 新しい順
      await expect(page.locator(`[data-testid="recent-search"]:has-text("${term}")`)).toBeVisible();
    }
  });

  test('should export search results', async ({ page }) => {
    await page.goto('/search?q=AI');
    
    // エクスポートボタンをクリック
    await page.click('button:has-text("エクスポート")');
    
    // エクスポート形式を選択
    await page.click('text=CSV形式');
    
    // ダウンロードが開始されることを確認
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("ダウンロード")'),
    ]);
    
    // ファイル名を確認
    expect(download.suggestedFilename()).toMatch(/search-results.*\.csv/);
  });
});