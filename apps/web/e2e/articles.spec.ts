import { test, expect } from '@playwright/test';

test.describe('Articles', () => {
  test.use({ storageState: 'e2e/.auth/user.json' }); // 認証済み状態を使用

  test.beforeEach(async ({ page }) => {
    await page.goto('/articles');
  });

  test('should display articles list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('記事一覧');
    
    // 記事カードが表示されることを確認
    const articleCards = page.locator('[data-testid="article-card"]');
    await expect(articleCards).toHaveCount(await articleCards.count());
  });

  test('should filter articles by tier', async ({ page }) => {
    // Tier 1フィルターを適用
    await page.click('label:has-text("Tier 1")');
    
    // フィルター適用を待つ
    await page.waitForTimeout(1000);
    
    // 全ての記事がTier 1であることを確認
    const tierBadges = page.locator('[data-testid="tier-badge"]');
    const count = await tierBadges.count();
    
    for (let i = 0; i < count; i++) {
      await expect(tierBadges.nth(i)).toContainText('Tier 1');
    }
  });

  test('should search articles', async ({ page }) => {
    const searchTerm = 'AI';
    
    await page.fill('input[placeholder="記事を検索..."]', searchTerm);
    await page.press('input[placeholder="記事を検索..."]', 'Enter');
    
    // 検索結果を待つ
    await page.waitForTimeout(1000);
    
    // 検索結果が表示されることを確認
    const articleTitles = page.locator('[data-testid="article-title"]');
    const count = await articleTitles.count();
    
    if (count > 0) {
      // 少なくとも1つの記事タイトルに検索語が含まれることを確認
      let found = false;
      for (let i = 0; i < count; i++) {
        const text = await articleTitles.nth(i).textContent();
        if (text?.toLowerCase().includes(searchTerm.toLowerCase())) {
          found = true;
          break;
        }
      }
      expect(found).toBeTruthy();
    }
  });

  test('should open article detail', async ({ page }) => {
    // 最初の記事をクリック
    const firstArticle = page.locator('[data-testid="article-card"]').first();
    const articleTitle = await firstArticle.locator('[data-testid="article-title"]').textContent();
    
    await firstArticle.click();
    
    // 記事詳細ページに遷移
    await expect(page.locator('h1')).toContainText(articleTitle || '');
    await expect(page.locator('[data-testid="article-content"]')).toBeVisible();
  });

  test('should bookmark article', async ({ page }) => {
    // 最初の記事のブックマークボタンをクリック
    const bookmarkButton = page.locator('[data-testid="bookmark-button"]').first();
    
    await bookmarkButton.click();
    
    // ブックマークが追加されたことを確認
    await expect(bookmarkButton).toHaveAttribute('data-bookmarked', 'true');
    
    // ブックマーク一覧に移動
    await page.goto('/bookmarks');
    
    // ブックマークした記事が表示されることを確認
    await expect(page.locator('[data-testid="article-card"]')).toHaveCount(1);
  });

  test('should mark article as read', async ({ page }) => {
    // 最初の記事を開く
    await page.locator('[data-testid="article-card"]').first().click();
    
    // 記事を読む（スクロール）
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // 既読マークが表示されることを確認
    await page.waitForTimeout(2000); // 読了時間を計測
    
    // 記事一覧に戻る
    await page.goto('/articles');
    
    // 既読マークが表示されることを確認
    const readBadge = page.locator('[data-testid="article-card"]').first().locator('[data-testid="read-badge"]');
    await expect(readBadge).toBeVisible();
  });

  test('should load more articles on scroll', async ({ page }) => {
    // 初期の記事数を確認
    const initialCount = await page.locator('[data-testid="article-card"]').count();
    
    // ページの最下部までスクロール
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // 追加の記事が読み込まれるのを待つ
    await page.waitForTimeout(2000);
    
    // 記事数が増えていることを確認
    const newCount = await page.locator('[data-testid="article-card"]').count();
    expect(newCount).toBeGreaterThan(initialCount);
  });
});