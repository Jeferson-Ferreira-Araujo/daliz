// Uso: node scripts/list-all-challenges.js > relatorio.md
// Ferramenta de relatório, não faz parte do app — lista todos os desafios agrupados
// por categoria (ChallengeCategory) e subcategoria (arquivo/tema de origem).
'use strict';
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'src', 'data', 'challenges');

const CATEGORY_LABELS = {
  desenvolvimento_pessoal: 'Desenvolvimento pessoal',
  relacionamentos: 'Relacionamentos',
  familia_presenca: 'Família e presença',
  trabalho_produtividade: 'Trabalho e produtividade',
  saude_energia: 'Saúde e energia',
  financas_consumo: 'Finanças e consumo',
  aprendizado_curiosidade: 'Aprendizado e curiosidade',
  bondade_comunidade: 'Bondade, comunidade e vida prática',
  fe_espiritualidade: 'Fé e espiritualidade',
};

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

const FILE_SUBCATEGORY = {
  'development.ts': 'Base oficial (900)',
  'relationships.ts': 'Base oficial (900)',
  'family.ts': 'Base oficial (900)',
  'work.ts': 'Base oficial (900)',
  'health.ts': 'Base oficial (900)',
  'finance.ts': 'Base oficial (900)',
  'learning.ts': 'Base oficial (900)',
  'community.ts': 'Base oficial (900)',
  'faith.ts': 'Base oficial (900) — Fé e espiritualidade',
  'interestCombos.ts': 'Combos por interesse/hobby',
  'personCombos.ts': 'Combos por pessoa importante',
  'eventCombos.ts': 'Datas comemorativas (combos originais)',
  'familyExpansion.ts': 'Expansão — Família (geral)',
  'childrenChallenges.ts': 'Expansão — Filhos',
  'partnerChallenges.ts': 'Expansão — Parceiro(a)',
  'parentsChallenges.ts': 'Expansão — Pais / figuras importantes',
  'friendsChallenges.ts': 'Expansão — Amigos',
  'rainChallenges.ts': 'Expansão — Clima: chuva',
  'coldChallenges.ts': 'Expansão — Clima: frio',
  'hotChallenges.ts': 'Expansão — Clima: calor',
  'pleasantWeatherChallenges.ts': 'Expansão — Clima: tempo agradável',
  'sunnyChallenges.ts': 'Expansão — Clima: sol',
  'stormChallenges.ts': 'Expansão — Clima: tempestade',
  'seasonChallenges.ts': 'Expansão — Estações do ano',
  'indoorChallenges.ts': 'Expansão — Atividades indoor',
  'outdoorChallenges.ts': 'Expansão — Atividades outdoor',
  'holidayExpansion.ts': 'Expansão — Datas comemorativas',
};

function parseFile(file) {
  const content = fs.readFileSync(path.join(DIR, file), 'utf8');
  const objRegex = /\{\s*id:\s*'([^']+)',\s*categoria:\s*'([^']+)',\s*titulo:\s*'((?:[^'\\]|\\.)*)'/g;
  const results = [];
  let m;
  while ((m = objRegex.exec(content))) {
    const titulo = m[3].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
    results.push({ id: m[1], categoria: m[2], titulo });
  }
  return results;
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.ts') && f !== 'index.ts');

// grouped[categoria][subcategoria] = [challenges]
const grouped = {};
let total = 0;

for (const file of files) {
  const sub = FILE_SUBCATEGORY[file] || file;
  const challenges = parseFile(file);
  for (const c of challenges) {
    if (!grouped[c.categoria]) grouped[c.categoria] = {};
    if (!grouped[c.categoria][sub]) grouped[c.categoria][sub] = [];
    grouped[c.categoria][sub].push(c);
    total += 1;
  }
}

const lines = [];
lines.push('# Lista completa de ações — Melhor que Ontem');
lines.push('');
lines.push(`Total: ${total} ações, organizadas por categoria e subcategoria.`);
lines.push('');

const allCategories = [...CATEGORY_ORDER, ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c))];

for (const categoria of allCategories) {
  const subs = grouped[categoria];
  if (!subs) continue;
  const catTotal = Object.values(subs).reduce((sum, arr) => sum + arr.length, 0);
  lines.push(`## ${CATEGORY_LABELS[categoria] || categoria} (${catTotal})`);
  lines.push('');
  const subNames = Object.keys(subs).sort();
  for (const sub of subNames) {
    const items = subs[sub];
    lines.push(`### ${sub} (${items.length})`);
    lines.push('');
    for (const item of items) {
      lines.push(`- ${item.titulo}`);
    }
    lines.push('');
  }
}

fs.writeFileSync(path.join(__dirname, '..', 'lista-de-acoes.md'), lines.join('\n'), 'utf8');
console.log(`Total: ${total} ações. Arquivo gerado em lista-de-acoes.md`);
