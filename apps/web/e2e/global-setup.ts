import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // アプリケーションが起動するまで待つ
  try {
    await page.goto(baseURL!);
    await page.waitForLoadState('networkidle');
  } catch (error) {
    console.log('Waiting for application to start...');
    await page.waitForTimeout(5000);
    await page.goto(baseURL!);
  }
  
  await browser.close();
}

export default globalSetup;