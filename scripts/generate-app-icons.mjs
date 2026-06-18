import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '..', 'assets');

const BLUE = '#2563EB';
const RED = '#EF4444';
const BACKGROUND = '#FFFFFF';

function pinSvg(fill, cx, cy, scale) {
  const w = 64 * scale;
  const h = 80 * scale;
  const x = cx - w / 2;
  const y = cy - h * 0.18;
  const holeR = 8 * scale;
  const holeCy = y + 20 * scale;

  return `
    <g transform="translate(${x}, ${y}) scale(${scale})">
      <path
        d="M32 4 C20.5 4 12 13.5 12 25.5 C12 41 32 76 32 76 C32 76 52 41 52 25.5 C52 13.5 43.5 4 32 4 Z"
        fill="${fill}"
      />
      <circle cx="32" cy="20" r="8" fill="${BACKGROUND}" />
    </g>
  `;
}

function buildIconSvg(size, { redPin = 'bottom' } = {}) {
  const cx = size / 2;
  const cy = size / 2;
  const offset = size * 0.19;

  const positions = {
    top: { x: cx, y: cy - offset, color: BLUE },
    bottom: { x: cx, y: cy + offset, color: redPin === 'bottom' ? RED : BLUE },
    left: { x: cx - offset, y: cy, color: BLUE },
    right: { x: cx + offset, y: cy, color: BLUE },
  };

  if (redPin === 'top') positions.top.color = RED;
  if (redPin === 'left') positions.left.color = RED;
  if (redPin === 'right') positions.right.color = RED;

  const scale = size / 1024;

  const pins = Object.values(positions)
    .map(({ x, y, color }) => pinSvg(color, x, y, scale * 2.35))
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BACKGROUND}" />
  ${pins}
</svg>`;
}

async function writePng(filename, size) {
  const svg = buildIconSvg(size);
  const outPath = join(assetsDir, filename);
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`Wrote ${outPath} (${size}x${size})`);
}

mkdirSync(assetsDir, { recursive: true });

await writePng('icon.png', 1024);
await writePng('adaptive-icon.png', 1024);
await writePng('splash-icon.png', 1024);
await writePng('favicon.png', 48);
