import puppeteer from 'puppeteer-core';
import os from 'node:os';
import path from 'node:path';

const OUT = 'shots';
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = 'http://127.0.0.1:5173';

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  userDataDir: path.join(os.tmpdir(), 'pg-chrome-profile'),
  args: ['--no-sandbox', '--hide-scrollbars', '--no-first-run'],
});

const errors = [];

async function waitImages(page) {
  await page.evaluate(() => {
    document.querySelectorAll('img[loading="lazy"]').forEach((i) => {
      i.loading = 'eager';
    });
    window.scrollTo(0, document.body.scrollHeight);
  });
  await new Promise((r) => setTimeout(r, 700));
  await page.evaluate(async () => {
    await Promise.all(
      [...document.images]
        .filter((i) => !i.complete)
        .map(
          (i) =>
            new Promise((res) => {
              i.onload = res;
              i.onerror = res;
            }),
        ),
    );
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 400));
}

const page = await browser.newPage();
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});

async function go(url, w = 1440, h = 900) {
  await page.setViewport({ width: w, height: h });
  await page.goto(base + url, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 700));
  await waitImages(page);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// 1. 搜索
await go('/');
await page.click('button[aria-label="搜索游戏"]');
await wait(400);
await page.screenshot({ path: `${OUT}/i-search-1.png` });
await page.type('input[aria-label="搜索关键词"]', 'godot');
await wait(500);
await page.screenshot({ path: `${OUT}/i-search-2.png` });
await page.keyboard.press('Escape');
await wait(300);

// 2. 试玩弹窗
await go('/game/neon-drift');
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('开始试玩'));
  btn?.click();
});
await wait(700);
await page.screenshot({ path: `${OUT}/i-play-loading.png` });
await wait(5000);
await page.screenshot({ path: `${OUT}/i-play-running.png` });
await page.keyboard.press('Escape');
await wait(400);

// 3. 移动端菜单
await go('/', 390, 844);
await page.click('button[aria-label="打开菜单"]');
await wait(500);
await page.screenshot({ path: `${OUT}/i-menu-390.png` });
await page.click('button[aria-label="关闭菜单"]');
await wait(300);

// 4. 上传校验
await go('/upload');
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '下一步');
  btn?.click();
});
await wait(500);
await page.screenshot({ path: `${OUT}/i-upload-errors.png` });

// 5. 探索筛选态
await go('/explore?category=%E5%8A%A8%E4%BD%9C&mode=web&sort=hot');
await page.screenshot({ path: `${OUT}/i-explore-filter.png` });

// 6. 工作台草稿
await go('/me');
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('草稿'));
  btn?.click();
});
await wait(500);
await page.screenshot({ path: `${OUT}/i-dashboard-drafts.png` });

// 7. 404
await go('/game/does-not-exist');
await page.screenshot({ path: `${OUT}/i-404.png` });

await browser.close();
console.log(errors.length ? errors.join('\n') : 'NO ERRORS');
