import puppeteer from 'puppeteer-core';
import os from 'node:os';
const b = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  userDataDir: os.tmpdir() + '/pg-gal-' + Date.now(),
  args: ['--no-sandbox', '--hide-scrollbars', '--proxy-server=http://127.0.0.1:7897'],
});
const pg = await b.newPage();
await pg.setViewport({ width: 1440, height: 1200 });
await pg.goto('https://donk569.github.io/jcgame/game/rooftop-dash', { waitUntil: 'load', timeout: 40000 });
await new Promise((r) => setTimeout(r, 4000));
await pg.evaluate(() => window.scrollTo(0, 560));
await new Promise((r) => setTimeout(r, 900));
await pg.screenshot({ path: 'shots/rd-v090.png' });
const info = await pg.evaluate(() => {
  const imgs = [...document.images].filter(i => i.src.includes('/shots/'));
  return { count: imgs.length, loaded: imgs.map(i => i.naturalWidth) };
});
console.log('画面区图片:', JSON.stringify(info));
await b.close();
