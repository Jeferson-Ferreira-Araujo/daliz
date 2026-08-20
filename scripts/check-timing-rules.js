// Uso: node scripts/check-timing-rules.js
//
// Ferramenta de autoria offline — NÃO faz parte do app nem do motor de seleção, mesmo
// espírito de check-duplicates.js (regex sobre o código-fonte, sem precisar compilar TS).
// Nasceu de uma rodada real de bugs "notificação chegou na hora errada": ação de
// aprendizado sobre o filho caindo no meio do expediente, "Ligue pro seu filho" chegando no
// trajeto de volta pra casa, "Termine um dia de inverno..." aparecendo às 16h. A causa raiz
// nos dois primeiros era o MOTOR (campos como requerFamilia/relationships/contexto existiam
// no dado mas não eram lidos — já corrigido em ChallengeEngine.ts); a causa no terceiro era o
// CONTEÚDO (título promete "fim de dia" mas `momentos` não restringia nada). Esse script
// varre o catálogo inteiro atrás da mesma classe de problema, pra pegar antes de virar
// notificação errada — roda em segundos, sem precisar simular nada no Modo Dev.
'use strict';
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'src', 'data', 'challenges');

// Frases que amarram o texto a um momento específico do dia — se o desafio usa uma dessas,
// `momentos` precisa refletir isso, senão o motor pode mandar às 10h uma ação que promete
// "fim de dia" ou "antes de dormir".
const TIME_WORDING_RULES = [
  { pattern: /\btermine (o|um) dia\b/i, label: 'fim de dia', expectedMomentos: ['fim_dia', 'antes_dormir'] },
  { pattern: /\bantes de dormir\b/i, label: 'antes de dormir', expectedMomentos: ['antes_dormir'] },
  { pattern: /\bao (acordar|despertar)\b/i, label: 'ao acordar', expectedMomentos: ['inicio_dia'] },
  { pattern: /\blogo que (acordar|acordou)\b/i, label: 'ao acordar', expectedMomentos: ['inicio_dia'] },
  { pattern: /\bpela manhã\b/i, label: 'pela manhã', expectedMomentos: ['inicio_dia'] },
  { pattern: /\bno fim do (dia|expediente)\b/i, label: 'fim de dia/expediente', expectedMomentos: ['fim_dia', 'transicao', 'antes_dormir'] },
  { pattern: /\bantes de (começar|sair para) o (trabalho|expediente)\b/i, label: 'antes do trabalho', expectedMomentos: ['inicio_dia'] },
];

const MIN_LONG_DURATION = 15; // minutos — acima disso, dificilmente cabe num intervalo curto de trabalho/trajeto

function parseChallenges() {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.ts') && f !== 'index.ts');
  const all = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(DIR, file), 'utf8');
    // Cada objeto de desafio começa em `id: '...'` e vai até o próximo `id: '...'` (ou fim do
    // arquivo) — suficiente pra extrair os campos com regex simples, sem precisar de um parser
    // de verdade (mesma técnica de check-duplicates.js).
    const idPositions = [...content.matchAll(/\{\s*\n\s*id:\s*'([^']+)'/g)];
    for (let i = 0; i < idPositions.length; i++) {
      const start = idPositions[i].index;
      const end = i + 1 < idPositions.length ? idPositions[i + 1].index : content.length;
      const block = content.slice(start, end);
      const id = idPositions[i][1];
      all.push({ file, id, block });
    }
  }
  return all;
}

function extractString(block, field) {
  const m = block.match(new RegExp(`${field}:\\s*'((?:[^'\\\\]|\\\\.)*)'`));
  return m ? m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\') : '';
}

function extractArray(block, field) {
  const m = block.match(new RegExp(`${field}:\\s*\\[([^\\]]*)\\]`));
  if (!m) return [];
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}

function extractNumber(block, field) {
  const m = block.match(new RegExp(`${field}:\\s*(\\d+)`));
  return m ? Number(m[1]) : null;
}

function extractBool(block, field) {
  return new RegExp(`${field}:\\s*true`).test(block);
}

const challenges = parseChallenges().map((c) => ({
  file: c.file,
  id: c.id,
  titulo: extractString(c.block, 'titulo'),
  descricao: extractString(c.block, 'descricao'),
  categoria: extractString(c.block, 'categoria'),
  momentos: extractArray(c.block, 'momentos'),
  tempoEstimado: extractNumber(c.block, 'tempoEstimado'),
  requerTempoLivre: extractBool(c.block, 'requerTempoLivre'),
  requerFamilia: extractBool(c.block, 'requerFamilia'),
  hasRelationships: /relationships:\s*\[/.test(c.block),
  contexto: extractArray(c.block, 'contexto'),
}));

console.log(`Total de desafios carregados: ${challenges.length}\n`);

let issues = 0;

console.log('--- Texto promete um momento específico, mas `momentos` não restringe ---');
let wordingIssues = 0;
for (const c of challenges) {
  for (const rule of TIME_WORDING_RULES) {
    if (rule.pattern.test(c.titulo) || rule.pattern.test(c.descricao)) {
      const isRestricted = !c.momentos.includes('qualquer') && c.momentos.some((m) => rule.expectedMomentos.includes(m));
      if (!isRestricted) {
        wordingIssues += 1;
        console.log(`[${rule.label}] ${c.id} (${c.file}) | momentos=${JSON.stringify(c.momentos)} | "${c.titulo}"`);
      }
      break;
    }
  }
}
if (wordingIssues === 0) console.log('Nenhum encontrado.');
issues += wordingIssues;

console.log('\n--- Ação de família (categoria familia_presenca) sem nenhum sinal que a tire do expediente/trajeto ---');
let familyIssues = 0;
for (const c of challenges) {
  if (c.categoria !== 'familia_presenca') continue;
  const hasBlockSignal = c.requerFamilia || c.requerTempoLivre || c.hasRelationships || (c.contexto.includes('em_casa') && !c.contexto.includes('qualquer'));
  if (!hasBlockSignal) {
    familyIssues += 1;
    console.log(`${c.id} (${c.file}) | "${c.titulo}"`);
  }
}
if (familyIssues === 0) console.log('Nenhum encontrado.');
issues += familyIssues;

console.log(`\n--- Duração >= ${MIN_LONG_DURATION}min sem requerTempoLivre nem nenhum outro sinal de bloqueio ---`);
let durationIssues = 0;
for (const c of challenges) {
  if (c.tempoEstimado == null || c.tempoEstimado < MIN_LONG_DURATION) continue;
  const hasBlockSignal = c.requerFamilia || c.requerTempoLivre || c.hasRelationships || (c.contexto.includes('em_casa') && !c.contexto.includes('qualquer'));
  if (!hasBlockSignal) {
    durationIssues += 1;
    console.log(`${c.id} (${c.file}) | ${c.tempoEstimado}min | "${c.titulo}"`);
  }
}
if (durationIssues === 0) console.log('Nenhum encontrado.');
issues += durationIssues;

console.log(`\n${issues === 0 ? '✅ Tudo certo.' : `⚠️  ${issues} ponto(s) pra revisar.`}`);
process.exitCode = issues === 0 ? 0 : 1;
