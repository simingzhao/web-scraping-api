import puppeteer, { Page } from 'puppeteer';
import { getProxy } from './proxies';

export async function getBrowser() {
  const proxy = await getProxy();
  
  const options = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };

  if (proxy) {
    options.args = [
      ...options.args,
      `--proxy-server=${proxy.host}:${proxy.port}`,
    ];
  }

  const browser = await puppeteer.launch(options);

  if (proxy && proxy.username && proxy.password) {
    browser.on('targetcreated', async (target) => {
      const page = await target.page();
      if (page) {
        await page.authenticate({
          username: proxy.username!,
          password: proxy.password!,
        });
      }
    });
  }

  return browser;
}

export async function getPage(url: string) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  // Set common headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  });

  try {
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });
    return page;
  } catch (error) {
    await browser.close();
    throw error;
  }
}

export async function closeBrowser(page: Page) {
  const browser = page.browser();
  await browser.close();
} 