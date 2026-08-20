// Deriva os assets reais do app (assets/*.png) a partir da arte enviada em
// identidade/. `identidade/` é a fonte (arte de design, não usada direto no
// bundle); este script processa e grava o resultado em assets/, que É usado
// pelo app.json e pelos componentes.
//
// Uso: npm i -D sharp && node scripts/import-brand-assets.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SOURCE_ICON = path.join(ROOT, 'identidade', 'LOGO', 'icone_app_claro.png');
const SOURCE_BACKGROUND = path.join(ROOT, 'identidade', 'BACKGROUND', 'paisagem_tela_inicial.png');
const ASSETS = path.join(ROOT, 'assets');
const BRAND = path.join(ASSETS, 'brand');

const BG_COLOR = { r: 253, g: 248, b: 243 }; // fundo claro real da arte (~#FDF8F3)
// A arte original tem uma sombra/vinheta suave nos cantos (até ~51 de distância
// medida) — o limite de baixo precisa cobrir isso todo pra não sobrar um
// "fantasma" do cartão arredondado atrás do glifo extraído.
const CHROMA_THRESHOLD_IN = 60; // distância abaixo disso = totalmente transparente
const CHROMA_THRESHOLD_OUT = 100; // distância acima disso = totalmente opaco (cor original)

/** Remove o fundo quase-branco da arte original, virando um glifo transparente. */
async function extractTransparentGlyph(sourcePath) {
  const image = sharp(sourcePath);
  const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.from(data);

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const dist = Math.abs(r - BG_COLOR.r) + Math.abs(g - BG_COLOR.g) + Math.abs(b - BG_COLOR.b);

    let alpha;
    if (dist <= CHROMA_THRESHOLD_IN) alpha = 0;
    else if (dist >= CHROMA_THRESHOLD_OUT) alpha = 255;
    else alpha = Math.round(((dist - CHROMA_THRESHOLD_IN) / (CHROMA_THRESHOLD_OUT - CHROMA_THRESHOLD_IN)) * 255);

    out[i + 3] = alpha;
  }

  return sharp(out, { raw: { width, height, channels } }).png().trim();
}

/** Centraliza `glyphBuffer` num canvas quadrado `canvas`x`canvas`, ocupando `coverage` da largura. */
async function composeOnCanvas(glyphBuffer, canvas, coverage, background) {
  const glyphSize = Math.round(canvas * coverage);
  const resizedGlyph = await sharp(glyphBuffer).resize(glyphSize, glyphSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  const offset = Math.round((canvas - glyphSize) / 2);

  let base = sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

  return base.composite([{ input: resizedGlyph, left: offset, top: offset }]).png();
}

/**
 * Nome do app + tagline como SVG rasterizado, pra compor no splash nativo.
 * Não consegui carregar a fonte Nunito Sans no rasterizador (librsvg não
 * pegou nem @font-face embutido nem FONTCONFIG_PATH apontando pro .ttf
 * local) — usa Arial bold como aproximação só nesta imagem estática; o app
 * em si (telas reais) usa Nunito Sans de verdade via expo-font.
 */
function buildWordmarkSvg(width) {
  const titleSize = Math.round(width * 0.062);
  const taglineSize = Math.round(width * 0.033);
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${Math.round(width * 0.34)}">
      <text x="50%" y="${titleSize}" text-anchor="middle" font-family="Arial" font-weight="700" font-size="${titleSize}" fill="#16233F">Melhor que Ontem</text>
      <rect x="${width / 2 - width * 0.04}" y="${titleSize * 1.35}" width="${width * 0.08}" height="${Math.max(3, width * 0.005)}" fill="#2F9E8F" />
      <text x="50%" y="${titleSize * 1.35 + taglineSize * 1.8}" text-anchor="middle" font-family="Arial" font-weight="400" font-size="${taglineSize}" fill="#2F9E8F">Pequenas ações melhoram seu dia.</text>
    </svg>
  `);
}

/** Versão monocromática (silhueta branca) do glifo, preservando o alfa original. */
async function toMonochrome(glyphBuffer) {
  const { data, info } = await sharp(glyphBuffer).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);
  for (let i = 0; i < data.length; i += info.channels) {
    out[i] = 255;
    out[i + 1] = 255;
    out[i + 2] = 255;
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: info.channels } }).png();
}

async function main() {
  fs.mkdirSync(BRAND, { recursive: true });

  console.log('Extraindo glifo transparente de', path.relative(ROOT, SOURCE_ICON));
  const glyphSharp = await extractTransparentGlyph(SOURCE_ICON);
  const glyphBuffer = await glyphSharp.png().toBuffer();

  // Cópia do glifo transparente pra uso dentro do app (Image em componentes).
  await sharp(glyphBuffer).resize(600, 600, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(BRAND, 'logo-mark.png'));
  console.log('✓ assets/brand/logo-mark.png');

  // Ícone iOS/geral — opaco, com o fundo real da arte.
  // (usa removeAlpha em vez de flatten: com canvas sintético + composite, o
  // flatten do sharp 0.35 não derruba o canal alpha mesmo já opaco)
  const iconCanvas = await composeOnCanvas(glyphBuffer, 1024, 0.72, { ...BG_COLOR, alpha: 1 });
  await iconCanvas.removeAlpha().png().toFile(path.join(ASSETS, 'icon.png'));
  console.log('✓ assets/icon.png');

  // Ícone adaptativo Android — camadas separadas.
  const foreground = await composeOnCanvas(glyphBuffer, 1024, 0.6, null);
  await foreground.toFile(path.join(ASSETS, 'android-icon-foreground.png'));
  console.log('✓ assets/android-icon-foreground.png');

  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { ...BG_COLOR, alpha: 1 } } })
    .png()
    .toFile(path.join(ASSETS, 'android-icon-background.png'));
  console.log('✓ assets/android-icon-background.png');

  const monoGlyph = await (await toMonochrome(glyphBuffer)).png().toBuffer();
  const monochrome = await composeOnCanvas(monoGlyph, 1024, 0.6, null);
  await monochrome.toFile(path.join(ASSETS, 'android-icon-monochrome.png'));
  console.log('✓ assets/android-icon-monochrome.png');

  // Splash — só o glifo, transparente, com bastante respiro.
  const splash = await composeOnCanvas(glyphBuffer, 512, 0.78, null);
  await splash.toFile(path.join(ASSETS, 'splash-icon.png'));
  console.log('✓ assets/splash-icon.png');

  // Favicon web — usa o ícone já emoldurado original, só reduzido.
  await sharp(SOURCE_ICON).resize(48, 48).flatten({ background: BG_COLOR }).png().toFile(path.join(ASSETS, 'favicon.png'));
  console.log('✓ assets/favicon.png');

  // Ícones de apoio do onboarding — copiados como estão (já vêm emoldurados).
  const iconMap = {
    notificacao: 'icon-notificacao.png',
    conquista: 'icon-conquista.png',
    novo_dia: 'icon-novo-dia.png',
    progresso: 'icon-progresso.png',
  };
  for (const [src, dest] of Object.entries(iconMap)) {
    const srcPath = path.join(ROOT, 'identidade', 'ICONES', `${src}.png`);
    await sharp(srcPath).resize(200, 200).png().toFile(path.join(BRAND, dest));
    console.log('✓ assets/brand/' + dest);
  }

  // Paisagem — cópia pra usar como ImageBackground na tela de boas-vindas
  // (o logo ali é o componente <LogoMark> normal, por cima, não faz parte desta imagem).
  await sharp(SOURCE_BACKGROUND).png().toFile(path.join(BRAND, 'background-welcome.png'));
  console.log('✓ assets/brand/background-welcome.png');

  // Splash nativo — o expo-splash-screen só aceita UMA imagem (+ cor de fundo),
  // então aqui a paisagem, o glifo e o nome do app são compostos numa imagem
  // só, pra usar com resizeMode "cover" no app.json.
  const bgMeta = await sharp(SOURCE_BACKGROUND).metadata();
  const splashLogoWidth = Math.round(bgMeta.width * 0.26);
  const splashLogo = await sharp(glyphBuffer)
    .resize(splashLogoWidth, splashLogoWidth, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const logoTop = Math.round(bgMeta.height * 0.4);
  const wordmarkWidth = Math.round(bgMeta.width * 0.86);
  const wordmarkSvg = buildWordmarkSvg(wordmarkWidth);
  const wordmarkPng = await sharp(wordmarkSvg).png().toBuffer();
  await sharp(SOURCE_BACKGROUND)
    .composite([
      {
        input: splashLogo,
        left: Math.round((bgMeta.width - splashLogoWidth) / 2),
        top: logoTop,
      },
      {
        input: wordmarkPng,
        left: Math.round((bgMeta.width - wordmarkWidth) / 2),
        top: logoTop + splashLogoWidth + Math.round(bgMeta.width * 0.03),
      },
    ])
    .png()
    .toFile(path.join(ASSETS, 'splash-background.png'));
  console.log('✓ assets/splash-background.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
