/**
 * Deriva todos os assets de marca (ícone, splash, adaptive icon, favicon, logo-mark, background
 * de boas-vindas) a partir da arte REAL fornecida em `identidade/LOGO/logo.png` (lockup horizontal
 * ícone+wordmark) e `identidade/BACKGROUND/paisagem_tela_inicial.png` (fundo abstrato retrato,
 * 853x1844) — substitui `generate-daliz-brand.js`, que desenhava tudo à mão via SVG por falta de
 * arte real na época. Nenhum arquivo de código precisa mudar: os componentes (`LogoMark.tsx`,
 * `welcome.tsx`) e o `app.json` já apontam pros mesmos caminhos de saída, só o CONTEÚDO desses
 * arquivos muda.
 *
 * Rodar: node scripts/apply-real-brand-assets.js
 */
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const LOGO_SOURCE = path.join(ROOT, 'identidade/LOGO/logo.png');
const BACKGROUND_SOURCE = path.join(ROOT, 'identidade/BACKGROUND/paisagem_tela_inicial.png');

const CREAM = { r: 0xfb, g: 0xf7, b: 0xf1, alpha: 1 };
const NAVY = { r: 0x16, g: 0x23, b: 0x3f, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

function out(...segments) {
  return path.join(ROOT, 'assets', ...segments);
}

/** Recorta só o ícone (lado esquerdo do lockup) — a marca "D" + figura + cometa + estrela — sem o
 * texto "DALIZ", que fica bem à direita, fora dessa janela de corte. */
async function extractIconMark() {
  const cropped = await sharp(LOGO_SOURCE)
    .extract({ left: 0, top: 0, width: 555, height: 530 })
    .png()
    .toBuffer();
  return sharp(cropped).trim({ threshold: 10 }).png().toBuffer();
}

/** Ícone redimensionado (mantendo proporção, sem cortar) dentro de uma caixa quadrada, com fundo
 * sólido ou transparente — a peça reutilizada por quase toda saída abaixo. */
async function iconOnCanvas(iconBuffer, { canvasSize, iconSize, background }) {
  const resizedIcon = await sharp(iconBuffer)
    .resize(iconSize, iconSize, { fit: 'contain', background: TRANSPARENT })
    .png()
    .toBuffer();
  const offset = Math.round((canvasSize - iconSize) / 2);
  return sharp({ create: { width: canvasSize, height: canvasSize, channels: 4, background } })
    .composite([{ input: resizedIcon, left: offset, top: offset }])
    .png()
    .toBuffer();
}

/** Versão monocromática (branca) do ícone, pro Android 13+ themed icon — deriva do próprio canal
 * alpha do ícone real (silhueta), não uma reconstrução manual de path como antes. */
async function monochromeIconOnCanvas(iconBuffer, { canvasSize, iconSize }) {
  const resizedIcon = await sharp(iconBuffer)
    .resize(iconSize, iconSize, { fit: 'contain', background: TRANSPARENT })
    .ensureAlpha()
    .png()
    .toBuffer();
  // 'dest-in' mantém o branco (destino) só onde o alfa da própria arte (fonte) não é zero —
  // usa a transparência real do ícone como máscara, sem precisar extrair o canal à parte
  // (extractChannel devolve uma imagem sem alfa, que o dest-in não consegue usar como máscara).
  const whiteSilhouette = await sharp({
    create: { width: iconSize, height: iconSize, channels: 4, background: WHITE },
  })
    .composite([{ input: resizedIcon, blend: 'dest-in' }])
    .png()
    .toBuffer();
  const offset = Math.round((canvasSize - iconSize) / 2);
  return sharp({ create: { width: canvasSize, height: canvasSize, channels: 4, background: TRANSPARENT } })
    .composite([{ input: whiteSilhouette, left: offset, top: offset }])
    .png()
    .toBuffer();
}

/** Lockup completo (ícone + wordmark "DALIZ") tal como veio da arte real, só cortado nas bordas
 * transparentes — usado onde a marca precisa aparecer por extenso, sem o app "reescrever" o
 * texto (ex: menu lateral). Devolve a imagem inteira, sem separar ícone de texto ainda. */
async function extractFullLockup() {
  const buffer = await sharp(LOGO_SOURCE).png().toBuffer();
  return sharp(buffer).trim({ threshold: 10 }).png().toBuffer();
}

/** O lockup completo vem com o texto "DALIZ" em azul-marinho fixo — perfeito em fundo claro,
 * ilegível em fundo escuro (quase a mesma cor do fundo). Gera a variante escura recolorindo só a
 * região do texto pra branco (usando o próprio alfa como máscara, mesma técnica do ícone
 * monocromático — preserva o anti-aliasing das letras), mantendo o ícone colorido intacto. */
async function buildDarkLockup(fullLockupBuffer, iconRegionWidth) {
  const meta = await sharp(fullLockupBuffer).metadata();
  const iconPart = await sharp(fullLockupBuffer)
    .extract({ left: 0, top: 0, width: iconRegionWidth, height: meta.height })
    .png()
    .toBuffer();
  const textWidth = meta.width - iconRegionWidth;
  const textPart = await sharp(fullLockupBuffer)
    .extract({ left: iconRegionWidth, top: 0, width: textWidth, height: meta.height })
    .ensureAlpha()
    .png()
    .toBuffer();
  const whiteText = await sharp({
    create: { width: textWidth, height: meta.height, channels: 4, background: WHITE },
  })
    .composite([{ input: textPart, blend: 'dest-in' }])
    .png()
    .toBuffer();
  return sharp({ create: { width: meta.width, height: meta.height, channels: 4, background: TRANSPARENT } })
    .composite([
      { input: iconPart, left: 0, top: 0 },
      { input: whiteText, left: iconRegionWidth, top: 0 },
    ])
    .png()
    .toBuffer();
}

async function main() {
  const icon = await extractIconMark();
  const iconMeta = await sharp(icon).metadata();
  console.log(`Ícone recortado: ${iconMeta.width}x${iconMeta.height}`);

  // Lockup completo (ícone + "DALIZ") — claro (arte original) e escuro (texto recolorido pra
  // branco). Usado onde o app quer a imagem inteira, e não o ícone + AppText separados.
  const fullLockup = await extractFullLockup();
  const fullLockupMeta = await sharp(fullLockup).metadata();
  await sharp(fullLockup).toFile(out('brand/logo-full-light.png'));
  // 526 = primeira coluna com a cor sólida do texto ("DALIZ"), achada varrendo os pixels da
  // imagem em busca da cor exata do texto — ícone e texto ficam praticamente colados, sem
  // faixa de respiro, então precisa ser exato: um valor a mais corta a perna esquerda do "D".
  await sharp(await buildDarkLockup(fullLockup, 526)).toFile(out('brand/logo-full-dark.png'));
  console.log(`Lockup completo: ${fullLockupMeta.width}x${fullLockupMeta.height}`);

  // Ícone do app — fundo creme, mesma proporção de respiro (~62%) do app.json/App Store.
  const iconCanvas1024 = await iconOnCanvas(icon, { canvasSize: 1024, iconSize: 635, background: CREAM });
  await sharp(iconCanvas1024).toFile(out('icon.png'));

  // Prévia em fundo escuro (não referenciada no app.json, só documentação visual).
  await sharp(await iconOnCanvas(icon, { canvasSize: 512, iconSize: 320, background: NAVY })).toFile(
    out('brand/icon-dark-preview.png'),
  );

  // Marca isolada, transparente — usada por LogoMark.tsx.
  await sharp(await iconOnCanvas(icon, { canvasSize: 600, iconSize: 600, background: TRANSPARENT })).toFile(
    out('brand/logo-mark.png'),
  );

  // Favicon web — mesmo canvas do ícone, reduzido.
  await sharp(iconCanvas1024).resize(48, 48).toFile(out('favicon.png'));

  // Adaptive icon Android — foreground transparente, background sólido, monochrome (Android 13+).
  await sharp(await iconOnCanvas(icon, { canvasSize: 1024, iconSize: 680, background: TRANSPARENT })).toFile(
    out('android-icon-foreground.png'),
  );
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: NAVY } })
    .png()
    .toFile(out('android-icon-background.png'));
  await sharp(await monochromeIconOnCanvas(icon, { canvasSize: 1024, iconSize: 680 })).toFile(
    out('android-icon-monochrome.png'),
  );

  // Ícone solto (compat com o template padrão do Expo, não referenciado diretamente).
  await sharp(await iconOnCanvas(icon, { canvasSize: 512, iconSize: 512, background: TRANSPARENT })).toFile(
    out('splash-icon.png'),
  );

  // Background de boas-vindas — a arte real, sem nenhum retoque (welcome.tsx desenha o
  // logo/texto por cima via componentes React, não precisa de nada pré-composto aqui).
  await sharp(BACKGROUND_SOURCE).png().toFile(out('brand/background-welcome.png'));

  // Splash nativo (expo-splash-screen só aceita UMA imagem estática, mostrada antes do JS
  // carregar) — mesma arte de fundo, com a marca centrada na área vazia do meio.
  const bgMeta = await sharp(BACKGROUND_SOURCE).metadata();
  const splashIconSize = 300;
  const splashIcon = await sharp(icon)
    .resize(splashIconSize, splashIconSize, { fit: 'contain', background: TRANSPARENT })
    .png()
    .toBuffer();
  const splashLeft = Math.round((bgMeta.width - splashIconSize) / 2);
  const splashTop = Math.round(bgMeta.height * 0.42 - splashIconSize / 2);
  await sharp(BACKGROUND_SOURCE)
    .composite([{ input: splashIcon, left: splashLeft, top: splashTop }])
    .png()
    .toFile(out('splash-background.png'));

  console.log('Assets de marca regenerados a partir da arte real em identidade/.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
