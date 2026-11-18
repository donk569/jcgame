import puppeteer from 'puppeteer-core';
import os from 'node:os';
const b = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  userDataDir: os.tmpdir() + '/pg-vg-' + Date.now(),
  args: ['--no-sandbox', '--hide-scrollbars', '--proxy-server=http://127.0.0.1:7897'],
});
const pg = await b.newPage();
await pg.setViewport({ width: 1440, height: 1000 });
const errs = [];
pg.on('pageerror', (e) => errs.push(e.message.slice(0, 70)));
await pg.goto('http://127.0.0.1:5173/explore?sort=new', { waitUntil: 'load', timeout: 40000 });
await new Promise((r) => setTimeout(r, 4000));
console.log('探索页出现天台疾行:', await pg.evaluate(() => document.body.innerText.includes('天台疾行')) ? 'OK' : 'FAIL');
await pg.goto('http://127.0.0.1:5173/game/rooftop-dash', { waitUntil: 'load', timeout: 40000 });
await new Promise((r) => setTimeout(r, 4500));
console.log('详情页 h1:', await pg.evaluate(() => document.querySelector('h1')?.innerText || ''));
const info = await pg.evaluate(() => {
  const imgs = [...document.images].map(i => ({ src: i.getAttribute('src'), w: i.naturalWidth }));
  return { imgs: imgs.slice(0, 2), hasDownload: document.body.innerText.includes('Windows 客户端'),
    req: document.body.innerText.includes('DirectX 11') };
});
console.log('封面:', JSON.stringify(info.imgs[0]));
console.log('下载区:', info.hasDownload ? 'OK' : 'FAIL', '| 系统需求:', info.req ? 'OK' : 'FAIL');
await pg.screenshot({ path: 'shots/rooftop-detail.png' });
console.log('errors:', errs.join('|') || 'none');
await b.close();
