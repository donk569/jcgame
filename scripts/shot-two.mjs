import puppeteer from 'puppeteer-core';
import os from 'node:os';
const base = process.argv[2] || 'http://127.0.0.1:4173';
const b = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  userDataDir: os.tmpdir() + '/pg-two-' + Date.now(),
  args: ['--no-sandbox', '--hide-scrollbars', '--proxy-server=http://127.0.0.1:7897'],
});
for (const [slug, out] of [['dimension-leap', 'shots/dl-detail.png'], ['rooftop-dash', 'shots/rd-detail2.png']]) {
  const pg = await b.newPage();
  await pg.setViewport({ width: 1440, height: 1100 });
  const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message.slice(0, 60)));
  await pg.goto(`${base}/game/${slug}`, { waitUntil: 'load', timeout: 40000 });
  await new Promise((r) => setTimeout(r, 4200));
  await pg.screenshot({ path: out });
  const info = await pg.evaluate(() => ({
    h1: document.querySelector('h1')?.innerText || '',
    imgs: [...document.images].filter(i => i.naturalWidth > 0).length,
    hasVer: /v\d/.test(document.body.innerText),
  }));
  console.log(slug, '→', info.h1, '| 图', info.imgs, '| 版本显示', info.hasVer, '|', errs.join('|') || 'ok');
  await pg.close();
}
await b.close();
