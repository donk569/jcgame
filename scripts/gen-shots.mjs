import sharp from 'sharp';
const S = 'C:/Users/lenovo/.workbuddy/clipboard-images/';
const files = [
  ['clipboard-2026-11-18T07-45-24-235Z-40c4927e.png', 'rooftop-dash-1.webp'], // 游戏内：200 米
  ['clipboard-2026-11-18T07-45-24-236Z-090e7ce9.png', 'rooftop-dash-2.webp'], // 游戏内：Rush
  ['clipboard-2026-11-18T07-45-24-232Z-631ed19c.png', 'rooftop-dash-menu.webp'], // 主菜单
];
for (const [src, out] of files) {
  // 游戏截图保留原生比例；不放大，只按宽度收敛到 1280
  await sharp(S + src)
    .resize({ width: 1280, withoutEnlargement: true })
    .webp({ quality: 92, effort: 6 })
    .toFile('public/art/shots/' + out);
  const m = await sharp('public/art/shots/' + out).metadata();
  console.log(out, m.width + 'x' + m.height, (m.width / m.height).toFixed(2));
}
