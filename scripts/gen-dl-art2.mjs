import sharp from 'sharp';
const S = 'D:/桌面/小游戏/Dimensional Leap/Assets/sprite/';
const M = 'C:/Users/lenovo/.workbuddy/clipboard-images/clipboard-2026-11-18T10-16-19-799Z-9e49bfaa.jpg';

// ---------- 封面：魔方盒精准居中 ----------
{
  const meta = await sharp(M).metadata();
  const CX = 471, CY = 450;
  const cropH = 760;
  const cropW = Math.round((cropH * 3) / 4);
  let left = Math.round(CX - cropW / 2);
  let top = Math.round(CY - cropH / 2);
  left = Math.max(0, Math.min(left, meta.width - cropW));
  top = Math.max(0, Math.min(top, meta.height - cropH));
  await sharp(M)
    .extract({ left, top, width: cropW, height: cropH })
    .resize({ width: 760, height: 1013, fit: 'fill', kernel: 'lanczos3' })
    .webp({ quality: 92, effort: 6 })
    .toFile('public/art/covers/dimension-leap.webp');
  console.log('封面：魔方盒居中 ' + cropW + 'x' + cropH + ' @(' + left + ',' + top + ')');
}

// ---------- 截图：补边色改成图自身的边缘平均色 ----------
const sprites = [
  ['1ea007b85fc89990c06bb5a4f39f6dac.png', 'dimension-1.webp'],
  ['51e2d1db437ff1803a9ee93f9c25cd24.png', 'dimension-2.webp'],
  ['408fa099f629f2bb71784ea8c66661f5.png', 'dimension-3.webp'],
  ['973abcb095ad3095458d55e7c39aaa92.png', 'dimension-4.webp'],
];

for (const [src, out] of sprites) {
  const img = S + src;
  const m = await sharp(img).metadata();
  // 取顶部一条的平均色，做补边色（这些图的天空占比大，顶部最能代表环境色）
  const { data, info } = await sharp(img)
    .extract({ left: 0, top: 0, width: m.width, height: Math.max(1, Math.round(m.height * 0.06)) })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
  }
  const bg = { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n), alpha: 1 };
  await sharp(img)
    .resize({ width: 1000, height: 750, fit: 'contain', background: bg })
    .webp({ quality: 90, effort: 6 })
    .toFile('public/art/shots/' + out);
  console.log(out, '补边色 rgb(' + bg.r + ',' + bg.g + ',' + bg.b + ')');
}
