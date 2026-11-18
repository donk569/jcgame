import sharp from 'sharp';

const W = 760, H = 1072;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#14110F"/>
      <stop offset="55%" stop-color="#1A1512"/>
      <stop offset="100%" stop-color="#0C0A09"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F0603C" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#F0603C" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <ellipse cx="380" cy="700" rx="420" ry="260" fill="url(#glow)"/>

  <!-- 远景天际线（很暗，只做氛围） -->
  <g fill="#221C18">
    <rect x="0" y="640" width="70" height="432"/>
    <rect x="78" y="700" width="52" height="372"/>
    <rect x="140" y="600" width="64" height="472"/>
    <rect x="214" y="672" width="44" height="400"/>
    <rect x="268" y="628" width="76" height="444"/>
    <rect x="354" y="690" width="50" height="382"/>
    <rect x="414" y="612" width="68" height="460"/>
    <rect x="492" y="668" width="46" height="404"/>
    <rect x="548" y="636" width="72" height="436"/>
    <rect x="630" y="696" width="54" height="376"/>
    <rect x="694" y="650" width="66" height="422"/>
  </g>

  <!-- 近景天台边缘：一条干净的水平线，就是脚下那一层 -->
  <rect x="0" y="908" width="${W}" height="2" fill="#3A322C"/>
  <rect x="0" y="910" width="${W}" height="162" fill="#0A0908"/>

  <!-- 少量窗光：只点几盏，不铺满 -->
  <g fill="#F0603C" opacity="0.55">
    <rect x="156" y="640" width="7" height="10"/>
    <rect x="176" y="668" width="7" height="10"/>
    <rect x="286" y="660" width="7" height="10"/>
    <rect x="428" y="644" width="7" height="10"/>
    <rect x="562" y="672" width="7" height="10"/>
  </g>
  <g fill="#C6C0B6" opacity="0.18">
    <rect x="96" y="728" width="6" height="9"/>
    <rect x="232" y="700" width="6" height="9"/>
    <rect x="376" y="716" width="6" height="9"/>
    <rect x="508" y="692" width="6" height="9"/>
    <rect x="652" y="728" width="6" height="9"/>
  </g>

  <!-- 标题区：靠排版，不加装饰 -->
  <text x="64" y="150" font-family="'IBM Plex Mono',Consolas,monospace" font-size="15" fill="#8F8880" letter-spacing="3">ROOFTOP DASH</text>
  <text x="60" y="256" font-family="'Noto Serif SC','Songti SC','SimSun',serif" font-size="86" fill="#F5F2ED" letter-spacing="2">天台</text>
  <text x="60" y="352" font-family="'Noto Serif SC','Songti SC','SimSun',serif" font-size="86" fill="#F5F2ED" letter-spacing="2">疾行</text>

  <rect x="64" y="404" width="52" height="3" fill="#F0603C"/>

  <text x="64" y="452" font-family="'Noto Sans SC','Microsoft YaHei',sans-serif" font-size="17" fill="#C6C0B6">自动奔跑 · 判断跳跃与挥剑的时机</text>

  <text x="64" y="980" font-family="'IBM Plex Mono',Consolas,monospace" font-size="13" fill="#5F5952" letter-spacing="1">WINDOWS 64-BIT</text>
  <text x="${W - 64}" y="980" text-anchor="end" font-family="'IBM Plex Mono',Consolas,monospace" font-size="13" fill="#5F5952" letter-spacing="1">v1.0.0</text>
</svg>`;

await sharp(Buffer.from(svg)).webp({ quality: 88, effort: 6 }).toFile('public/art/covers/rooftop-dash.webp');
console.log('封面已生成 760x1072');
