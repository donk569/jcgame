import sharp from 'sharp';
const M = 'C:/Users/lenovo/.workbuddy/clipboard-images/clipboard-2026-11-18T10-16-19-799Z-9e49bfaa.jpg';
const meta = await sharp(M).metadata();

// 以魔方盒为中心裁 4:3，右侧菜单文字自然落在画面外
const CX = 471, CY = 450;
// 左边距受限（魔方盒中心 x=471），最大可用宽 = 2*471，据此反推裁切高度
const maxW = Math.min(2 * CX, meta.width);
const cropH = Math.min(Math.floor((maxW * 3) / 4), meta.height);
const cropW = Math.round((cropH * 4) / 3);
let left = Math.round(CX - cropW / 2);
let top = Math.round(CY - cropH / 2);
left = Math.max(0, Math.min(left, meta.width - cropW));
top = Math.max(0, Math.min(top, meta.height - cropH));

await sharp(M)
  .extract({ left, top, width: cropW, height: cropH })
  .resize({ width: 1200, kernel: 'lanczos3' })
  .webp({ quality: 91, effort: 6 })
  .toFile('public/art/shots/dimension-menu.webp');

console.log(`主菜单截图 ${cropW}x${cropH} @(${left},${top}) → 魔方盒居中`);
