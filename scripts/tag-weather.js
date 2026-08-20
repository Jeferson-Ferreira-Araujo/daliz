/**
 * Marca `weatherTags` nos desafios já gerados em src/data/challenges/*.ts — mesmo padrão
 * conservador de scripts/tag-interests.js e tag-relationships.js: só marca quando o texto
 * é explícito sobre estar dentro/fora de casa, nunca assume por palavras ambíguas
 * (ex: "caminhada" sozinha não vira "outdoor" — só quando o texto diz "ao ar livre",
 * "no parque" etc; "dentro de casa" é o sinal claro pro lado indoor).
 *
 * Uso: node scripts/tag-weather.js
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data', 'challenges');
const FILES = ['development', 'relationships', 'family', 'work', 'health', 'finance', 'learning', 'community', 'faith'];

const WEATHER_HINTS = {
  outdoor: ['ao ar livre', 'no parque', 'na rua', 'ao sol', 'ao ar livre'],
  indoor: ['dentro de casa', 'em casa mesmo', 'sem sair de casa'],
};

function normalize(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function inferWeatherTags(titulo) {
  const found = new Set();
  const haystack = normalize(titulo);
  for (const [tag, hints] of Object.entries(WEATHER_HINTS)) {
    if (hints.some((hint) => haystack.includes(hint))) found.add(tag);
  }
  return [...found];
}

let totalTagged = 0;

for (const name of FILES) {
  const filePath = path.join(DATA_DIR, `${name}.ts`);
  let src = fs.readFileSync(filePath, 'utf8');
  src = src.replace(/\n\s*weatherTags: \[[^\]]*\],/g, '');

  let taggedInFile = 0;
  src = src.replace(
    /(\n {4}categoria: '([^']+)',\n {4}titulo: '((?:[^'\\]|\\.)*)',[\s\S]*?\n {4}tags: \[[^\]]*\],(?:\n {4}(?:interests|relationships): \[[^\]]*\],)*(?:\n {4}(?:minAge|maxAge): \d+,)*(?:\n {4}requiresPresence: true,)?)/g,
    (match, block, categoria, titulo) => {
      const weatherTags = inferWeatherTags(titulo);
      if (weatherTags.length === 0) return block;
      taggedInFile += 1;
      const literal = weatherTags.map((t) => `'${t}'`).join(', ');
      return `${block}\n    weatherTags: [${literal}],`;
    },
  );

  fs.writeFileSync(filePath, src, 'utf8');
  totalTagged += taggedInFile;
  console.log(`${name}.ts: ${taggedInFile} desafio(s) marcado(s) com weatherTags`);
}

console.log(`\nTotal: ${totalTagged} desafios marcados em ${FILES.length} arquivos.`);
