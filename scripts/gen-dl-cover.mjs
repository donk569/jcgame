import sharp from 'sharp';

const M = 'C:/Users/lenovo/.workbuddy/clipboard-images/clipboard-2026-11-18T10-16-19-799Z-9e49bfaa.jpg';
const meta = await sharp(M).metadata();

// 魔方盒中心（由紫/青像素包围盒测得），六边形整体高约 470
const CX = 471;
const CY = 450;

// 目标 3:4 → 宽 = 高 * 0.75
const PAD = Number(process.argv[2] || 760); // 画布高度（原图坐标）
const cropH = Math.min(PAD, meta.height);
const cropW = Math.round((cropH * 3) / 4);

let left = Math.round(CX - cropW / 2);
let top = Math.round(CY - cropH / 2);
// 贴边修正
left = Math.max(0, Math.min(left, meta.width - cropW));
top = Math.max(0, Math.min(top, meta.height - cropH));

const out = process.argv[3] || 'shots/cand-center.webp';
await sharp(M)
  .extract({ left, top, width: cropW, height: cropH })
  .resize({ width: 760, height: 1013, fit: 'fill', kernel: 'lanczos3' })
  .webp({ quality: 92, effort: 6 })
  .toFile(out);

console.log(`裁切 ${cropW}x${cropH} @ (${left},${top}) → ${out}`);
