import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login form', async ({ page }) => {
    await page.click('text=ログイン');
    
    await expect(page.locator('h1')).toContainText('ログイン');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.click('text=ログイン');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // ログイン成功後のリダイレクトを確認
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=ダッシュボード')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.click('text=ログイン');
    
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=メールアドレスまたはパスワードが正しくありません')).toBeVisible();
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.click('text=ログイン');
    await page.click('text=アカウントを作成');
    
    await expect(page).toHaveURL('/register');
    await expect(page.locator('h1')).toContainText('アカウント作成');
  });

  test('should register new user', async ({ page }) => {
    await page.goto('/register');
    
    const timestamp = Date.now();
    const email = `user${timestamp}@example.com`;
    
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 登録成功後のリダイレクトを確認
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Test User')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // まずログイン
    await page.click('text=ログイン');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    
    // ログアウト
    await page.click('button[aria-label="ユーザーメニュー"]');
    await page.click('text=ログアウト');
    
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=ログイン')).toBeVisible();
  });
});