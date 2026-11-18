import puppeteer from 'puppeteer-core';
import os from 'node:os';
const url = process.argv[2];
const out = process.argv[3] || 'shots/prev.png';
const b = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  userDataDir: os.tmpdir() + '/pg-pv-' + Date.now(),
  args: ['--no-sandbox', '--hide-scrollbars', '--proxy-server=http://127.0.0.1:7897'],
});
const pg = await b.newPage();
await pg.setViewport({ width: 1440, height: 1000 });
const errs = [];
pg.on('pageerror', (e) => errs.push(e.message.slice(0, 70)));
await pg.goto(url, { waitUntil: 'load', timeout: 40000 });
await new Promise((r) => setTimeout(r, 4500));
await pg.screenshot({ path: out });
console.log('h1:', await pg.evaluate(() => document.querySelector('h1')?.innerText || ''));
console.log('errors:', errs.join('|') || 'none');
await b.close();
