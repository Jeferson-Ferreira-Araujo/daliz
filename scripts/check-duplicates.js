// Uso: node scripts/check-duplicates.js
//
// Ferramenta de autoria offline — NÃO faz parte do app nem do motor de seleção (o
// ChallengeEngine só evita repetição por id exato via cooldownDias, ver plano de
// expansão da biblioteca). Roda uma vez sobre o corpus combinado (base oficial +
// expansão contextual) e reporta pares de título com alta sobreposição de palavras
// (índice de Jaccard), pra revisão manual antes de finalizar a expansão — evita que
// dois desafios de arquivos diferentes acabem sendo, na prática, a mesma ação.
'use strict';
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'src', 'data', 'challenges');
const THRESHOLD = 0.72; // acima disso, os dois títulos compartilham quase todas as palavras relevantes.

const STOPWORDS = new Set([
  'de','da','do','das','dos','uma','um','para','pra','com','sem','que','se','seu','sua','seus','suas',
  'voce','você','alguem','alguém','algo','hoje','amanha','amanhã','antes','depois','mais','menos','nao','não',
  'ao','aos','as','às','os','na','no','nas','nos','em','por','e','ou','a','o','sobre','onde','ele','ela',
  'quando','qual','quais','como','está','esta','estao','estão','ser','ter','fazer','faça','faca','durante',
  'pessoa','alguma','algum','vai','vao','vão','já','ja','ainda','bem','bom','boa','mesmo','mesma',
]);

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\{pessoa\}/g, '')
    .replace(/[".:,!?()📱]/g, '');
}

function tokenSet(titulo) {
  const words = normalize(titulo)
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  return new Set(words);
}

function jaccard(a, b) {
  let intersection = 0;
  for (const w of a) if (b.has(w)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function loadAllChallenges() {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.ts') && f !== 'index.ts');
  const all = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(DIR, file), 'utf8');
    const idMatches = [...content.matchAll(/id:\s*'([^']+)'/g)];
    const tituloMatches = [...content.matchAll(/titulo:\s*'((?:[^'\\]|\\.)*)'/g)];
    const len = Math.min(idMatches.length, tituloMatches.length);
    for (let i = 0; i < len; i++) {
      const titulo = tituloMatches[i][1].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
      all.push({ file, id: idMatches[i][1], titulo });
    }
  }
  return all;
}

const challenges = loadAllChallenges();
console.log(`Total de desafios carregados: ${challenges.length}`);

const withTokens = challenges.map((c) => ({ ...c, tokens: tokenSet(c.titulo) }));
const pairs = [];

for (let i = 0; i < withTokens.length; i++) {
  if (withTokens[i].tokens.size === 0) continue;
  for (let j = i + 1; j < withTokens.length; j++) {
    if (withTokens[j].tokens.size === 0) continue;
    const score = jaccard(withTokens[i].tokens, withTokens[j].tokens);
    if (score >= THRESHOLD) {
      pairs.push({ score, a: withTokens[i], b: withTokens[j] });
    }
  }
}

pairs.sort((x, y) => y.score - x.score);

if (pairs.length === 0) {
  console.log('Nenhum par acima do limiar de similaridade — nada pra revisar.');
} else {
  console.log(`${pairs.length} par(es) acima do limiar (${THRESHOLD}):\n`);
  for (const p of pairs) {
    console.log(`[${p.score.toFixed(2)}] ${p.a.id} (${p.a.file}): "${p.a.titulo}"`);
    console.log(`       ${p.b.id} (${p.b.file}): "${p.b.titulo}"\n`);
  }
}
