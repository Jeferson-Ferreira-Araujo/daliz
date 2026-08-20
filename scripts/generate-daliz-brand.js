// SUPERADO por scripts/apply-real-brand-assets.js — mantido só como histórico. Este script
// desenhava o mark à mão em SVG (fita em gradiente formando um "D", figura de pessoa,
// rastro-cometa + estrela) por não existir arte real da "Daliz" na época. A arte real
// chegou em identidade/LOGO/logo.png + identidade/BACKGROUND/paisagem_tela_inicial.png —
// use o script novo pra regenerar os assets.
//
// Uso: node scripts/generate-daliz-brand.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const BRAND = path.join(ASSETS, 'brand');

const COLORS = {
  cream: '#FBF7F1',
  navy: '#16233F',
  teal: '#2F9E8F',
  purple: '#8B7FE8',
  energy: '#F2994A',
  optimism: '#F7C948',
  white: '#FFFFFF',
};

/** Path do mark (fita/anel + figura + cometa+estrela), num viewBox 0 0 200 200. */
function markSvgBody({ ringGradId, cometGradId, figureColor }) {
  return `
    <rect x="46" y="46" width="20" height="108" rx="10" fill="url(#${ringGradId})" />
    <path d="M 41.7 78.8 A 62 62 0 1 1 41.7 121.2" fill="none" stroke="url(#${ringGradId})"
      stroke-width="26" stroke-linecap="round" />
    <circle cx="90" cy="74" r="9" fill="${figureColor}" />
    <path d="M 78 128 C 78 106 80 92 90 92 C 100 92 102 106 102 128
             C 102 133 98 136 90 136 C 82 136 78 133 78 128 Z" fill="${figureColor}" />
    <path d="M 96 94 L 114 70" stroke="${figureColor}" stroke-width="7" stroke-linecap="round" />
    <path d="M 32 172 C 70 150 120 110 168 30" fill="none" stroke="url(#${cometGradId})"
      stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />
    <path d="M 172 24 Q 176 15 179 11 Q 182 15 186 24 Q 182 27 179 30 Q 176 27 172 24 Z"
      fill="${COLORS.optimism}" />
  `;
}

function markDefs() {
  return `
    <linearGradient id="ringGrad" x1="20" y1="170" x2="170" y2="20" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${COLORS.teal}" />
      <stop offset="0.55" stop-color="${COLORS.purple}" />
      <stop offset="1" stop-color="#6E5FD8" />
    </linearGradient>
    <linearGradient id="cometGrad" x1="32" y1="172" x2="180" y2="10" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${COLORS.energy}" />
      <stop offset="1" stop-color="${COLORS.optimism}" />
    </linearGradient>
    <linearGradient id="ringGradMono" x1="20" y1="170" x2="170" y2="20" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${COLORS.white}" />
      <stop offset="1" stop-color="${COLORS.white}" />
    </linearGradient>
  `;
}

/** Só o mark, transparente — usado no ícone, no app (LogoMark) e como base do adaptive icon. */
function markOnlySvg({ figureColor = COLORS.teal } = {}) {
  return `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>${markDefs()}</defs>
    ${markSvgBody({ ringGradId: 'ringGrad', cometGradId: 'cometGrad', figureColor })}
  </svg>`;
}

/** Versão monocromática (silhueta branca única) — Android themed icon (API 33+). */
function markMonoSvg() {
  return `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <rect x="46" y="46" width="20" height="108" rx="10" fill="${COLORS.white}" />
    <path d="M 41.7 78.8 A 62 62 0 1 1 41.7 121.2" fill="none" stroke="${COLORS.white}"
      stroke-width="26" stroke-linecap="round" />
    <circle cx="90" cy="74" r="9" fill="${COLORS.white}" />
    <path d="M 78 128 C 78 106 80 92 90 92 C 100 92 102 106 102 128
             C 102 133 98 136 90 136 C 82 136 78 133 78 128 Z" fill="${COLORS.white}" />
    <path d="M 96 94 L 114 70" stroke="${COLORS.white}" stroke-width="7" stroke-linecap="round" />
    <path d="M 32 172 C 70 150 120 110 168 30" fill="none" stroke="${COLORS.white}"
      stroke-width="6" stroke-linecap="round" opacity="0.9" />
    <path d="M 172 24 Q 176 15 179 11 Q 182 15 186 24 Q 182 27 179 30 Q 176 27 172 24 Z" fill="${COLORS.white}" />
  </svg>`;
}

/** Ícone completo (mark centralizado num cartão arredondado). */
function iconSvg({ bg, figureColor, canvas = 1024, radiusPct = 0.22, coverage = 0.62 }) {
  const r = Math.round(canvas * radiusPct);
  return `<svg width="${canvas}" height="${canvas}" viewBox="0 0 ${canvas} ${canvas}" xmlns="http://www.w3.org/2000/svg">
    <defs>${markDefs()}</defs>
    <rect width="${canvas}" height="${canvas}" rx="${r}" fill="${bg}" />
    <g transform="translate(${(canvas * (1 - coverage)) / 2}, ${(canvas * (1 - coverage)) / 2}) scale(${(canvas * coverage) / 200})">
      ${markSvgBody({ ringGradId: 'ringGrad', cometGradId: 'cometGrad', figureColor })}
    </g>
  </svg>`;
}

/** Fundo abstrato do splash — gradiente suave nos tons da marca, sem foto/paisagem
 * (não existe arte fotográfica nova enviada pra essa marca ainda). */
function splashBackgroundSvg(width, height) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bgGrad" cx="30%" cy="20%" r="90%">
        <stop offset="0" stop-color="#EAF6F3" />
        <stop offset="45%" stop-color="${COLORS.cream}" />
        <stop offset="100%" stop-color="#F3EFFC" />
      </radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
  </svg>`;
}

async function svgToPng(svgString) {
  return sharp(Buffer.from(svgString)).png();
}

async function main() {
  fs.mkdirSync(BRAND, { recursive: true });

  // 1) Ícone claro (fundo creme) e escuro (fundo navy) — mesma dupla mostrada na prancha.
  await (await svgToPng(iconSvg({ bg: COLORS.cream, figureColor: COLORS.teal }))).toFile(path.join(ASSETS, 'icon.png'));
  await (await svgToPng(iconSvg({ bg: COLORS.navy, figureColor: '#5FD9C4' })))
    .resize(512, 512)
    .toFile(path.join(BRAND, 'icon-dark-preview.png'));

  // 2) Mark isolado, transparente — usado dentro do app (LogoMark.tsx).
  await (await svgToPng(markOnlySvg({ figureColor: COLORS.teal })))
    .resize(600, 600, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile(path.join(BRAND, 'logo-mark.png'));

  // 3) Adaptive icon (Android): foreground (mark na zona segura ~66%), background (cor
  //    sólida da marca), monochrome (silhueta branca única, Android 13+).
  await (await svgToPng(markOnlySvg({ figureColor: COLORS.teal })))
    .resize(680, 680, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 172, bottom: 172, left: 172, right: 172, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile(path.join(ASSETS, 'android-icon-foreground.png'));

  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: COLORS.navy } })
    .png()
    .toFile(path.join(ASSETS, 'android-icon-background.png'));

  await (await svgToPng(markMonoSvg()))
    .resize(680, 680, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 172, bottom: 172, left: 172, right: 172, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile(path.join(ASSETS, 'android-icon-monochrome.png'));

  // 4) Favicon (web) — ícone claro em tamanho pequeno.
  await (await svgToPng(iconSvg({ bg: COLORS.cream, figureColor: COLORS.teal, canvas: 256 })))
    .resize(48, 48)
    .toFile(path.join(ASSETS, 'favicon.png'));

  // 5) Splash — fundo em gradiente + mark centralizado (sem paisagem/foto: não existe
  //    arte fotográfica nova enviada pra essa marca ainda).
  const splashW = 853;
  const splashH = 1844;
  const splashBg = await (await svgToPng(splashBackgroundSvg(splashW, splashH))).toBuffer();
  const markPng = await (await svgToPng(markOnlySvg({ figureColor: COLORS.teal })))
    .resize(360, 360, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp(splashBg)
    .composite([{ input: markPng, left: Math.round((splashW - 360) / 2), top: Math.round(splashH / 2 - 260) }])
    .png()
    .toFile(path.join(ASSETS, 'splash-background.png'));

  // splash-icon.png (não referenciado no app.json hoje, mantido só por compatibilidade
  // com o template padrão do Expo) — mark isolado, mesmo padrão do logo-mark.png.
  await (await svgToPng(markOnlySvg({ figureColor: COLORS.teal })))
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile(path.join(ASSETS, 'splash-icon.png'));

  console.log('✅ Assets da marca "Daliz" gerados em assets/ e assets/brand/.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
