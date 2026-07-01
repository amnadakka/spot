import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '..', 'assets');
const sourcePath = join(assetsDir, 'map-pin.png');
const BACKGROUND = '#FFFFFF';

async function buildIcon(size, { padding = 0.12 } = {}) {
  const contentSize = Math.round(size * (1 - padding * 2));

  const resized = await sharp(sourcePath)
    .resize(contentSize, contentSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function writePng(filename, size, options) {
  const outPath = join(assetsDir, filename);
  const buffer = await buildIcon(size, options);
  await sharp(buffer).toFile(outPath);
  console.log(`Wrote ${outPath} (${size}x${size})`);
}

mkdirSync(assetsDir, { recursive: true });

// Android adaptive icons keep key artwork inside the center 66% safe zone.
await writePng('icon.png', 1024, { padding: 0.12 });
await writePng('adaptive-icon.png', 1024, { padding: 0.17 });
await writePng('splash-icon.png', 1024, { padding: 0.12 });
await writePng('favicon.png', 48, { padding: 0.08 });
