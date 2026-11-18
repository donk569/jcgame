import sharp from 'sharp';
const S = 'D:/桌面/小游戏/Dimensional Leap/Assets/sprite/';
const MENU = 'C:/Users/lenovo/.workbuddy/clipboard-images/clipboard-2026-11-18T10-16-19-799Z-9e49bfaa.jpg';

const sprites = [
  ['1ea007b85fc89990c06bb5a4f39f6dac.png', 'dimension-1.webp'],
  ['51e2d1db437ff1803a9ee93f9c25cd24.png', 'dimension-2.webp'],
  ['408fa099f629f2bb71784ea8c66661f5.png', 'dimension-3.webp'],
  ['973abcb095ad3095458d55e7c39aaa92.png', 'dimension-4.webp'],
];

// 主视觉：主菜单自带游戏名，最适合横幅
await sharp(MENU)
  .resize({ width: 1600, height: 900, fit: 'cover', position: 'center' })
  .webp({ quality: 90, effort: 6 })
  .toFile('public/art/keyart/dimension-keyart.webp');
console.log('主视觉 1600x900');

// 截图 1：主菜单
await sharp(MENU).resize({ width: 1280 }).webp({ quality: 90, effort: 6 }).toFile('public/art/shots/dimension-menu.webp');

// 截图 2-5：四张等距画面（方形原图放进 4:3，用同色底补边，不裁掉内容）
for (const [src, out] of sprites) {
  const w = 1000, h = 750;
  await sharp(S + src)
    .resize({ width: w, height: h, fit: 'contain', background: { r: 22, g: 20, b: 26, alpha: 1 } })
    .webp({ quality: 90, effort: 6 })
    .toFile('public/art/shots/' + out);
  console.log(out, w + 'x' + h);
}

// 封面 3:4：主菜单左半边（保住彩色六边形标志）
await sharp(MENU)
  .resize({ width: 760, height: 1013, fit: 'cover', position: 'left' })
  .webp({ quality: 91, effort: 6 })
  .toFile('public/art/covers/dimension-leap.webp');
console.log('封面 760x1013');
