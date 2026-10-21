import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = resolve(root, 'public');
const faviconSvg = await readFile(resolve(pub, 'favicon.svg'));

// Favicon ordenador: siglas SBs.
// Accesos directos de iOS y Android: logotipo COMPLETO SOUTHBEAR STUDIO.
const brandLogo = (await readFile(resolve(pub, 'southbear-logo.svg'), 'utf8'))
  .replace(/<!DOCTYPE[^>]*>/i, '')
  .replace('width="100%" height="100%"', 'width="1731" height="316"');
const green = '#DDFF9A';

async function faviconPng(size) {
  return sharp(faviconSvg).resize(size, size).png().toBuffer();
}

async function mobilePng(size, maskable = false) {
  // Reproduce el diseño cuadrado verde con el logo completo centrado.
  // En Android "maskable" se deja margen adicional contra recortes circulares.
  const logoWidth = Math.round(size * (maskable ? 0.70 : 0.938));
  const logo = await sharp(Buffer.from(brandLogo))
    .resize({width: logoWidth})
    .png()
    .toBuffer();
  const {width, height} = await sharp(logo).metadata();
  return sharp({create: {width: size, height: size, channels: 4, background: green}})
    .composite([{
      input: logo,
      left: Math.round((size - width) / 2),
      top: Math.round((size - height) / 2)
    }])
    .png()
    .toBuffer();
}

for (const [file, size] of [
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32]
]) {
  await writeFile(resolve(pub, file), await faviconPng(size));
}

// Se generan las rutas estándar y las versionadas para que el móvil no use
// el icono antiguo guardado en caché.
for (const [file, size] of [
  ['apple-touch-icon.png', 180],
  ['apple-touch-icon-v2.png', 180],
  ['android-chrome-192x192.png', 192],
  ['android-chrome-192x192-v2.png', 192],
  ['android-chrome-512x512.png', 512],
  ['android-chrome-512x512-v2.png', 512]
]) {
  await writeFile(resolve(pub, file), await mobilePng(size));
}
for (const file of [
  'android-chrome-maskable-512x512.png',
  'android-chrome-maskable-512x512-v2.png'
]) {
  await writeFile(resolve(pub, file), await mobilePng(512, true));
}

// El formato ICO contiene los tamaños pequeños con las siglas.
const icoSizes = [16, 32, 48];
const images = await Promise.all(icoSizes.map(faviconPng));
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
console.log('SouthBear: siglas en navegador; logo completo en iOS y Android.');
