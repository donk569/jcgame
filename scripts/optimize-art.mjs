import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const RAW = 'public/art/raw';
const OUT = 'public/art';

const map = {
  'Vertical_video_game_cover_art__2026': 'neon-drift',
  'Vertical_game_cover_art__paint': 'tundra-courier',
  'Vertical_game_cover_art__hand__': 'paper-kite',
  'Vertical_game_cover_art__diese': 'iron-harvest',
  'Vertical_game_cover_art__cinem': 'last-train',
  'Vertical_game_cover_art__detai': 'pixel-ronin',
  'Vertical_game_cover_art__deep__': 'teeth-of-the-deep',
  'Vertical_game_cover_art__soft__': 'acorn-house',
  'Vertical_game_cover_art__styli': 'void-basket',
  'Vertical_game_cover_art__Chine': 'ink-tide',
  'Vertical_game_cover_art__geome': 'circuit-bloom',
  'Vertical_game_cover_art__layer': 'half-light',
  'Wide_cinematic_game_key_art__c': 'neon-drift-keyart',
};

const shots = [
  ['In_game_screenshot__low_camera', 'neon-drift-02'],
  ['In_game_screenshot__a_neon_lit', 'neon-drift-03'],
  ['In_game_screenshot__third_pers', 'neon-drift-01'],
];

const files = fs.readdirSync(RAW).filter((f) => f.endsWith('.png'));
fs.mkdirSync(`${OUT}/covers`, { recursive: true });
fs.mkdirSync(`${OUT}/shots`, { recursive: true });
fs.mkdirSync(`${OUT}/keyart`, { recursive: true });

const jobs = [];
for (const f of files) {
  const hit = Object.entries(map).find(([needle]) => f.startsWith(needle));
  if (hit) {
    const isWide = f.startsWith('Wide');
    jobs.push({ file: f, slug: hit[1], wide: isWide });
    continue;
  }
  const shot = shots.find(([needle]) => f.startsWith(needle));
  if (shot) jobs.push({ file: f, slug: shot[1], wide: true, kind: 'shot' });
}

for (const job of jobs) {
  const src = path.join(RAW, job.file);
  const img = sharp(src);
  const meta = await img.metadata();
  // crop away the bottom strip carrying the generator watermark
  const cropped = sharp(src).extract({
    left: 0,
    top: 0,
    width: meta.width,
    height: Math.round(meta.height * 0.94),
  });

  if (job.kind === 'shot') {
    await cropped
      .resize({ width: 1280 })
      .webp({ quality: 78 })
      .toFile(`${OUT}/shots/${job.slug}.webp`);
  } else if (job.wide) {
    await cropped.resize({ width: 1800 }).webp({ quality: 80 }).toFile(`${OUT}/keyart/${job.slug}.webp`);
  } else {
    await cropped.resize({ width: 760 }).webp({ quality: 80 }).toFile(`${OUT}/covers/${job.slug}.webp`);
  }
  console.log('ok', job.slug);
}
