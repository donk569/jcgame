import sharp from 'sharp';

const W16 = 'C:/Users/lenovo/.workbuddy/clipboard-images/clipboard-2026-11-18T07-27-04-098Z-22601c57.png';
const W43 = 'C:/Users/lenovo/.workbuddy/clipboard-images/clipboard-2026-11-18T07-27-04-100Z-370577cd.png';

const DEBUG = process.argv.includes('--debug');

// ---- 1. 主视觉：16:9，裁掉底部水印带 ----
{
  const m = await sharp(W16).metadata();
  const keepH = m.height - 18;                 // 切掉底部 18px（水印所在）
  const keepW = Math.round((keepH * 16) / 9);  // 按 16:9 取宽
  const left = Math.round((m.width - keepW) / 2);
  const out = DEBUG ? 'shots/art-16x9-nomark.png' : 'public/art/keyart/rooftop-dash-keyart.webp';
  let img = sharp(W16).extract({ left, top: 0, width: keepW, height: keepH });
  img = DEBUG
    ? img.resize({ width: keepW * 2, kernel: 'nearest' })
    : img.resize({ width: 1600, height: 900, fit: 'fill', kernel: 'nearest' }).webp({ quality: 92, effort: 6 });
  await img.toFile(out);
  console.log('主视觉 16:9:', keepW + 'x' + keepH, '→', out);
}

// ---- 2. 封面：3:4，裁掉水印后取中间竖条 ----
{
  const m = await sharp(W43).metadata();
  const keepH = m.height - 18;
  const keepW = Math.round((keepH * 3) / 4);
  // 稍微偏右，保住月亮
  const left = Math.min(Math.round((m.width - keepW) * 0.62), m.width - keepW);
  const out = DEBUG ? 'shots/art-3x4-nomark.png' : 'public/art/covers/rooftop-dash.webp';
  let img = sharp(W43).extract({ left, top: 0, width: keepW, height: keepH });
  img = DEBUG
    ? img.resize({ width: keepW * 2, kernel: 'nearest' })
    : img.resize({ width: 760, height: 1013, fit: 'fill', kernel: 'nearest' }).webp({ quality: 92, effort: 6 });
  await img.toFile(out);
  console.log('封面 3:4:', keepW + 'x' + keepH, '→', out);
}
