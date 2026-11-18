import sharp from 'sharp';

const M = 'C:/Users/lenovo/.workbuddy/clipboard-images/clipboard-2026-11-18T10-16-19-799Z-9e49bfaa.jpg';
const W = 1600, H = 900;
const CX = 471, CY = 450;        // 魔方盒中心
const FOCUS_H = 780;             // 取魔方盒为主体的竖条高度
const FOCUS_W = Math.round((FOCUS_H * 3) / 4);

// 1) 背景：原图铺满 + 强模糊 + 压暗，只留色块氛围
const bg = await sharp(M)
  .resize({ width: W, height: H, fit: 'cover' })
  .blur(42)
  .modulate({ brightness: 0.62, saturation: 1.1 })
  .toBuffer();

// 2) 前景：以魔方盒为中心的竖条，等比缩到画布高度
const meta = await sharp(M).metadata();
let left = Math.max(0, Math.min(CX - FOCUS_W / 2, meta.width - FOCUS_W));
let top = Math.max(0, Math.min(CY - FOCUS_H / 2, meta.height - FOCUS_H));
const fgW = Math.round((FOCUS_W * H) / FOCUS_H);

const fg = await sharp(M)
  .extract({ left: Math.round(left), top: Math.round(top), width: FOCUS_W, height: FOCUS_H })
  .resize({ width: fgW, height: H, fit: 'fill', kernel: 'lanczos3' })
  .toBuffer();

// 3) 合成：前景居中
await sharp(bg)
  .composite([{ input: fg, left: Math.round((W - fgW) / 2), top: 0 }])
  .webp({ quality: 90, effort: 6 })
  .toFile('shots/cand-hero-16x9.webp');

console.log(`前景 ${fgW}x${H} 居中于 ${W}x${H}`);
