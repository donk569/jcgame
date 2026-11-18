import sharp from 'sharp';
const SRC = 'C:/Users/lenovo/.workbuddy/clipboard-images/clipboard-2026-11-18T07-24-20-319Z-fcbc7f70.jpg';

// 封面 3:4 —— 用 attention 策略自动找画面重点（角色 + 月亮）
await sharp(SRC)
  .resize({ width: 760, height: 1013, fit: 'cover', position: sharp.strategy.attention, kernel: 'nearest' })
  .webp({ quality: 92, effort: 6 })
  .toFile('public/art/covers/rooftop-dash.webp');

// 主视觉 16:9 —— 偏向画面上部，保住月亮与角色
await sharp(SRC)
  .resize({ width: 1800, height: 1012, fit: 'cover', position: 'north', kernel: 'nearest' })
  .webp({ quality: 90, effort: 6 })
  .toFile('public/art/keyart/rooftop-dash-keyart.webp');

const m1 = await sharp('public/art/covers/rooftop-dash.webp').metadata();
const m2 = await sharp('public/art/keyart/rooftop-dash-keyart.webp').metadata();
console.log('封面', m1.width + 'x' + m1.height);
console.log('主视觉', m2.width + 'x' + m2.height);
