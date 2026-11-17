import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const OUT = 'shots';
fs.mkdirSync(OUT, { recursive: true });

const routes = [
  ['home', '/'],
  ['explore', '/explore'],
  ['game', '/game/neon-drift'],
  ['upload', '/upload'],
  ['creator', '/creator/mojian'],
  ['me', '/me'],
];

const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  userDataDir: path.join(os.tmpdir(), 'pg-chrome-profile'),
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
  ],
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


async function shoot(name, path, width, height) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[${name}@${width}] console: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`[${name}@${width}] pageerror: ${e.message}`));
  page.on('requestfailed', (r) => {
    const u = r.url();
    if (!u.includes('fonts.g')) errors.push(`[${name}@${width}] failed: ${u}`);
  });

  await page.goto(`http://127.0.0.1:5173${path}`, { waitUntil: 'load', timeout: 45000 });
  await page.waitForSelector('#main', { timeout: 20000 });
  await new Promise((r) => setTimeout(r, 600));
  await waitImages(page);

  await page.screenshot({ path: `${OUT}/${name}-${width}-top.png` });

  const overflow = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  if (overflow.scrollW > overflow.clientW + 1) {
    errors.push(`[${name}@${width}] 横向溢出 ${overflow.scrollW} > ${overflow.clientW}`);
  }

  if (width > 800) {
    await page.screenshot({ path: `${OUT}/${name}-${width}-full.png`, fullPage: true });
  }
  await page.close();
}

for (const [name, path] of routes) await shoot(name, path, 1440, 900);
for (const [name, path] of routes) await shoot(name, path, 390, 844);

await browser.close();
fs.writeFileSync(`${OUT}/report.txt`, errors.join('\n') || 'no errors');
console.log(errors.length ? errors.join('\n') : 'NO ERRORS');
