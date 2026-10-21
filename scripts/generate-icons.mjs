import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = resolve(root, 'public');

// Todas las variantes, ordenador, iOS y Android, comparten el mismo monograma.
const iconSvg = await readFile(resolve(pub, 'favicon.svg'));
const green = '#DDFF9A';

async function png(size) {
  return sharp(iconSvg).resize(size, size).png().toBuffer();
}

async function maskablePng() {
  return sharp(iconSvg)
    .resize(380, 380)
    .extend({top: 66, bottom: 66, left: 66, right: 66, background: green})
    .png().toBuffer();
}

for (const [file, size] of [
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32],
  ['apple-touch-icon.png', 180],
  ['apple-touch-icon-v3.png', 180],
  ['android-chrome-192x192.png', 192],
  ['android-chrome-192x192-v3.png', 192],
  ['android-chrome-512x512.png', 512],
  ['android-chrome-512x512-v3.png', 512]
]) {
  await writeFile(resolve(pub, file), await png(size));
}

for (const file of [
  'android-chrome-maskable-512x512.png',
  'android-chrome-maskable-512x512-v3.png'
]) {
  await writeFile(resolve(pub, file), await maskablePng());
}

// Favicon ICO clásico con la misma imagen en 16, 32 y 48 píxeles.
const icoSizes = [16, 32, 48];
const images = await Promise.all(icoSizes.map(png));
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
for (let i = 0; i < images.length; i++) {
  const entry = 6 + 16 * i;
  header.writeUInt8(icoSizes[i], entry);
  header.writeUInt8(icoSizes[i], entry + 1);
  header.writeUInt8(0, entry + 2);
  header.writeUInt8(0, entry + 3);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(images[i].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += images[i].length;
}
await writeFile(resolve(pub, 'favicon.ico'), Buffer.concat([header, ...images]));
console.log('Monograma SBS de cristal generado para todos los dispositivos.');
