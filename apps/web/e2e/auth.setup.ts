import { test as setup } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // ログインページに移動
  await page.goto('/login');
  
  // ログイン情報を入力
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  
  // ログインボタンをクリック
  await page.click('button[type="submit"]');
  
  // ログイン後のリダイレクトを待つ
  await page.waitForURL('/dashboard');
  
  // 認証状態を保存
  await page.context().storageState({ path: authFile });
});