import sharp from 'sharp';

const W = 1800, H = 1000;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0.2" y2="1">
      <stop offset="0%" stop-color="#12100E"/>
      <stop offset="60%" stop-color="#1B1612"/>
      <stop offset="100%" stop-color="#0A0908"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.68" cy="0.62" r="0.55">
      <stop offset="0%" stop-color="#F0603C" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="#F0603C" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- 远景天际线：三层楼群，越远越暗 -->
  <g fill="#241D18">
    <rect x="0" y="470" width="92" height="530"/><rect x="102" y="520" width="70" height="480"/>
    <rect x="184" y="430" width="86" height="570"/><rect x="282" y="500" width="60" height="500"/>
    <rect x="352" y="455" width="98" height="545"/><rect x="462" y="515" width="66" height="485"/>
    <rect x="540" y="420" width="90" height="580"/><rect x="642" y="498" width="62" height="502"/>
    <rect x="716" y="448" width="104" height="552"/><rect x="832" y="512" width="68" height="488"/>
    <rect x="912" y="432" width="92" height="568"/><rect x="1016" y="495" width="64" height="505"/>
    <rect x="1092" y="458" width="100" height="542"/><rect x="1204" y="508" width="70" height="492"/>
    <rect x="1286" y="425" width="94" height="575"/><rect x="1392" y="500" width="66" height="500"/>
    <rect x="1470" y="450" width="102" height="550"/><rect x="1584" y="512" width="68" height="488"/>
    <rect x="1664" y="438" width="96" height="562"/>
  </g>

  <!-- 近景天台：脚下那一层 -->
  <rect x="0" y="856" width="${W}" height="3" fill="#3E352E"/>
  <rect x="0" y="859" width="${W}" height="141" fill="#080706"/>

  <!-- 窗光：稀疏，只有几盏是品牌橙 -->
  <g fill="#F0603C" opacity="0.6">
    <rect x="196" y="470" width="9" height="13"/><rect x="228" y="512" width="9" height="13"/>
    <rect x="368" y="500" width="9" height="13"/><rect x="556" y="462" width="9" height="13"/>
    <rect x="736" y="490" width="9" height="13"/><rect x="928" y="474" width="9" height="13"/>
    <rect x="1108" y="500" width="9" height="13"/><rect x="1302" y="466" width="9" height="13"/>
    <rect x="1486" y="492" width="9" height="13"/><rect x="1680" y="480" width="9" height="13"/>
  </g>
  <g fill="#C6C0B6" opacity="0.14">
    <rect x="118" y="560" width="8" height="12"/><rect x="312" y="545" width="8" height="12"/>
    <rect x="480" y="556" width="8" height="12"/><rect x="660" y="540" width="8" height="12"/>
    <rect x="850" y="552" width="8" height="12"/><rect x="1032" y="542" width="8" height="12"/>
    <rect x="1218" y="556" width="8" height="12"/><rect x="1410" y="544" width="8" height="12"/>
    <rect x="1600" y="558" width="8" height="12"/>
  </g>

  <!-- 右侧留白给压字用，左侧保持空 -->
  <text x="1230" y="742" font-family="'IBM Plex Mono',Consolas,monospace" font-size="14" fill="#6B645B" letter-spacing="4">WINDOWS 64-BIT</text>
</svg>`;

await sharp(Buffer.from(svg)).webp({ quality: 86, effort: 6 }).toFile('public/art/keyart/rooftop-dash-keyart.webp');
console.log('主视觉已生成 1800x1000');
