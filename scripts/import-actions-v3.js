/**
 * Gera os 10 arquivos de dados novos (src/data/challenges/*.ts) a partir de
 * scripts/data/actions-v3-source.txt — substituição total da base (não é incremental como o
 * antigo sync-challenges-v2.js). Ver plano de migração ("Novo modelo de ações") seção 3.
 *
 * Pipeline por item: defaults vazios (sem restrição) + padrões de texto de ALTA confiança
 * (Maps/Spotify/momento do dia/fim de semana/tipo de ação) — nunca heurística agressiva pra
 * campos que exigiriam julgamento (profile/priority/conceptGroup ficam vazios/default,
 * curadoria manual futura).
 */
const fs = require('fs');
const path = require('path');

const SOURCE_PATH = path.join(__dirname, 'data', 'actions-v3-source.txt');
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data', 'challenges');

// Header do doc -> { slug (ChallengeCategory), prefix (id), fileBase, exportName }
const CATEGORY_HEADERS = [
  { match: /Relacionamentos/, slug: 'relacionamentos', prefix: 'REL', fileBase: 'relationships', exportName: 'relationshipsChallenges' },
  { match: /^👨‍👩‍👧 Família\b|^Família\b/, slug: 'familia', prefix: 'FAM', fileBase: 'family', exportName: 'familyChallenges' },
  { match: /Aprendizado & Desenvolvimento/, slug: 'aprendizado_desenvolvimento', prefix: 'APR', fileBase: 'learning', exportName: 'learningChallenges' },
  { match: /Saúde & Bem-estar/, slug: 'saude_bemestar', prefix: 'SAU', fileBase: 'health', exportName: 'healthChallenges' },
  { match: /Rotina & Organização/, slug: 'rotina_organizacao', prefix: 'ROT', fileBase: 'routine', exportName: 'routineChallenges' },
  { match: /Trabalho & Finanças/, slug: 'trabalho_financas', prefix: 'TRA', fileBase: 'work', exportName: 'workChallenges' },
  { match: /Criatividade & Cultura/, slug: 'criatividade_cultura', prefix: 'CRI', fileBase: 'creativity', exportName: 'creativityChallenges' },
  { match: /Experiências & Lazer/, slug: 'experiencias_lazer', prefix: 'EXP', fileBase: 'leisure', exportName: 'leisureChallenges' },
  { match: /Casa & Ambiente/, slug: 'casa_ambiente', prefix: 'CAS', fileBase: 'home', exportName: 'homeChallenges' },
  { match: /Fé & Espiritualidade/, slug: 'fe_espiritualidade', prefix: 'FE', fileBase: 'faith', exportName: 'faithChallenges' },
];

const MAPS_QUERY_RULES = [
  [/museu/i, 'museu'],
  [/galeria de arte/i, 'galeria de arte'],
  [/espaço cultural/i, 'centro cultural'],
  [/espaço público/i, 'praça'],
  [/biblioteca/i, 'biblioteca'],
  [/livraria/i, 'livraria'],
  [/lugar histórico/i, 'ponto histórico'],
  [/ponto turístico/i, 'ponto turístico'],
  [/parque/i, 'parque'],
  [/ao ar livre/i, 'parque'],
  [/bairro/i, 'pontos turísticos'],
];

const MUSIC_QUERY_RULES = [
  [/instrumental/i, 'instrumental'],
  [/antes de você nascer/i, 'clássicos'],
  [/gênero que você normalmente não escuta/i, 'descobertas'],
  [/significado espiritual/i, 'gospel reflexão'],
  [/marcou uma época/i, 'nostalgia'],
  [/outro país|um país|internacional/i, 'top global'],
  [/idioma que você não entende|tradução/i, 'músicas internacionais'],
];

function isMusicLine(text) {
  if (/^Pesquise (como|qual|quem|por que)/i.test(text)) return false; // trivia informativa, não é ação de ouvir
  return /música/i.test(text) || /Spotify/.test(text);
}

function pickByRules(text, rules, fallback) {
  for (const [re, value] of rules) {
    if (re.test(text)) return value;
  }
  return fallback;
}

function classifyTipo(text) {
  const t = text.toLowerCase();
  if (/^(pergunte|ligue|envie|convide|agrade[cç]a pessoalmente|responda|converse|compartilhe)/.test(t)) return 'contato';
  if (/^(pense|reflita|reserve alguns minutos para (refletir|agradecer|meditar)|ore|fa[cç]a uma ora[cç][aã]o|perdoe)/.test(t)) return 'reflexao';
  if (/^(organize|guarde|limpe|separe|confira|revise|apague|cancele|devolva|jogue fora|retire)/.test(t)) return 'organizacao';
  return 'acao';
}

function classifyMomentos(text) {
  if (/antes de dormir/i.test(text)) return ['antes_dormir'];
  if (/ao acordar|ao come[cç]ar o dia/i.test(text)) return ['inicio_dia'];
  return ['qualquer'];
}

function classifyDiasIdeais(text) {
  if (/fim de semana/i.test(text)) return ['sab', 'dom'];
  return 'qualquer';
}

function buildChallenge(titulo, categoryDef, index) {
  const id = `${categoryDef.prefix}_${String(index).padStart(3, '0')}`;
  const isMaps = /\bMaps\b/.test(titulo);
  const isMusic = isMusicLine(titulo);
  const isSearch = /^Pesquise\b|^Descubra\b/i.test(titulo) && !isMaps;

  /** @type {Record<string, unknown>} */
  const challenge = {
    id,
    categoria: categoryDef.slug,
    type: 'acao',
    titulo,
    tipo: classifyTipo(titulo),
    horariosIdeais: ['qualquer'],
    diasIdeais: classifyDiasIdeais(titulo),
    tags: [],
    momentos: classifyMomentos(titulo),
    tiposDia: ['qualquer'],
    contexto: ['qualquer'],
    repetition: { allowed: true, minIntervalDays: 7, maxUsesPerPeriod: null },
    interests: { required: [], preferred: [], excluded: [] },
    resources: { required: [], optional: isSearch ? ['google_search'] : [] },
    location: { required: false, type: null },
    situations: [],
    profile: { required: [], preferred: [], excluded: [] },
    difficulty: 2,
    effort: { time: 'short', mental: 'medium', physical: 'low', emotional: 'medium' },
    priority: 3,
    variants: [],
  };

  if (isMaps) {
    const query = pickByRules(titulo, MAPS_QUERY_RULES, 'pontos turísticos');
    challenge.resources.optional = [...new Set([...challenge.resources.optional, 'maps'])];
    challenge.location = { required: true, type: 'nearby' };
    challenge.supportType = 'maps';
    challenge.supportData = { query };
  } else if (isMusic) {
    // Só supportType/supportData (ActionSupport.tsx) — nunca também `musicQuery`: os dois juntos
    // no mesmo desafio faziam o botão do Spotify aparecer duplicado no ChallengeCard (campo
    // legado, removido do tipo Challenge; ver histórico do bug).
    const query = pickByRules(titulo, MUSIC_QUERY_RULES, 'descobertas');
    challenge.resources.optional = [...new Set([...challenge.resources.optional, 'spotify'])];
    challenge.supportType = 'spotify';
    challenge.supportData = { query };
  }

  return challenge;
}

function parseSource(text) {
  const lines = text.split('\n').map((l) => l.trim());
  /** @type {Record<string, string[]>} */
  const byCategory = {};
  let current = null;

  for (const line of lines) {
    if (!line) continue;
    const header = CATEGORY_HEADERS.find((h) => h.match.test(line));
    if (header) {
      current = header;
      byCategory[header.slug] = byCategory[header.slug] ?? [];
      continue;
    }
    if (!current) continue; // linha antes do primeiro header (não deveria acontecer)
    byCategory[current.slug].push(line);
  }
  return byCategory;
}

function serializeChallenge(c) {
  const lines = [];
  lines.push(`  {`);
  lines.push(`    id: ${JSON.stringify(c.id)},`);
  lines.push(`    categoria: ${JSON.stringify(c.categoria)},`);
  lines.push(`    type: ${JSON.stringify(c.type)},`);
  lines.push(`    titulo: ${JSON.stringify(c.titulo)},`);
  lines.push(`    tipo: ${JSON.stringify(c.tipo)},`);
  lines.push(`    horariosIdeais: ${JSON.stringify(c.horariosIdeais)},`);
  lines.push(`    diasIdeais: ${JSON.stringify(c.diasIdeais)},`);
  lines.push(`    tags: ${JSON.stringify(c.tags)},`);
  lines.push(`    momentos: ${JSON.stringify(c.momentos)},`);
  lines.push(`    tiposDia: ${JSON.stringify(c.tiposDia)},`);
  lines.push(`    contexto: ${JSON.stringify(c.contexto)},`);
  lines.push(`    repetition: ${JSON.stringify(c.repetition)},`);
  lines.push(`    interests: ${JSON.stringify(c.interests)},`);
  lines.push(`    resources: ${JSON.stringify(c.resources)},`);
  lines.push(`    location: ${JSON.stringify(c.location)},`);
  lines.push(`    situations: ${JSON.stringify(c.situations)},`);
  lines.push(`    profile: ${JSON.stringify(c.profile)},`);
  lines.push(`    difficulty: ${c.difficulty},`);
  lines.push(`    effort: ${JSON.stringify(c.effort)},`);
  lines.push(`    priority: ${c.priority},`);
  lines.push(`    variants: ${JSON.stringify(c.variants)},`);
  if (c.supportType) lines.push(`    supportType: ${JSON.stringify(c.supportType)},`);
  if (c.supportData) lines.push(`    supportData: ${JSON.stringify(c.supportData)},`);
  lines.push(`  },`);
  return lines.join('\n');
}

function main() {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8');
  const byCategory = parseSource(source);

  let total = 0;
  const summary = [];

  for (const categoryDef of CATEGORY_HEADERS) {
    const titles = byCategory[categoryDef.slug] ?? [];
    const challenges = titles.map((titulo, i) => buildChallenge(titulo, categoryDef, i + 1));

    const fileContent =
      `import type { Challenge } from '@/types';\n\n` +
      `export const ${categoryDef.exportName}: Challenge[] = [\n` +
      challenges.map(serializeChallenge).join('\n') +
      `\n];\n`;

    const outPath = path.join(OUTPUT_DIR, `${categoryDef.fileBase}.ts`);
    fs.writeFileSync(outPath, fileContent, 'utf8');
    summary.push(`${categoryDef.fileBase}.ts (${categoryDef.slug}): ${challenges.length} ações`);
    total += challenges.length;
  }

  console.log(summary.join('\n'));
  console.log(`Total: ${total} ações`);
}

main();
