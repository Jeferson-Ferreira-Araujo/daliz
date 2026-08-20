// Sincroniza o catálogo de desafios com a lista V2 revisada colada pelo usuário
// (scripts/data/challenges-v2.md, no mesmo formato que scripts/list-all-challenges.js gera).
//
// Estratégia (decidida com o usuário): diff por texto exato, por subcategoria/arquivo.
//   - título igual em ambos -> mantém o objeto Challenge original intacto (id, tags, momentos,
//     musicQuery, bibleQuery, opensCamera, relationships, etc. — tudo preservado).
//   - título só existe na lista antiga -> removido (reformulação = remover + adicionar; sem
//     usuários reais além do dev testando, então não precisa "aposentar" ids).
//   - título só existe na lista nova -> vira um Challenge novo, gerado com a mesma heurística
//     usada pelos scripts de geração originais (scripts/challengeHeuristics.js).
//
// Uso: node scripts/sync-challenges-v2.js
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const heuristics = require('./challengeHeuristics');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data', 'challenges');
const MD_PATH = path.join(__dirname, 'data', 'challenges-v2.md');

const CATEGORY_LABEL_TO_KEY = {
  'Desenvolvimento pessoal': 'desenvolvimento_pessoal',
  'Relacionamentos': 'relacionamentos',
  'Família e presença': 'familia_presenca',
  'Trabalho e produtividade': 'trabalho_produtividade',
  'Saúde e energia': 'saude_energia',
  'Finanças e consumo': 'financas_consumo',
  'Aprendizado e curiosidade': 'aprendizado_curiosidade',
  'Bondade, comunidade e vida prática': 'bondade_comunidade',
  'Fé e espiritualidade': 'fe_espiritualidade',
};

const BASE_FILE_BY_CATEGORIA = {
  desenvolvimento_pessoal: 'development.ts',
  relacionamentos: 'relationships.ts',
  familia_presenca: 'family.ts',
  trabalho_produtividade: 'work.ts',
  saude_energia: 'health.ts',
  financas_consumo: 'finance.ts',
  aprendizado_curiosidade: 'learning.ts',
  bondade_comunidade: 'community.ts',
  fe_espiritualidade: 'faith.ts',
};

const SUBLABEL_TO_FILE = {
  'Combos por interesse/hobby': 'interestCombos.ts',
  'Combos por pessoa importante': 'personCombos.ts',
  'Datas comemorativas': 'eventCombos.ts',
  'Expansão — Amigos': 'friendsChallenges.ts',
  'Expansão — Atividades indoor': 'indoorChallenges.ts',
  'Expansão — Atividades outdoor': 'outdoorChallenges.ts',
  'Expansão — Clima: calor': 'hotChallenges.ts',
  'Expansão — Clima: chuva': 'rainChallenges.ts',
  'Expansão — Clima: frio': 'coldChallenges.ts',
  'Expansão — Clima: sol': 'sunnyChallenges.ts',
  'Expansão — Clima: tempestade': 'stormChallenges.ts',
  'Expansão — Clima: tempo agradável': 'pleasantWeatherChallenges.ts',
  'Expansão — Datas comemorativas': 'holidayExpansion.ts',
  'Expansão — Estações do ano': 'seasonChallenges.ts',
  'Expansão — Família': 'familyExpansion.ts',
  'Expansão — Filhos': 'childrenChallenges.ts',
  'Expansão — Parceiro(a)': 'partnerChallenges.ts',
  'Expansão — Pais / figuras importantes': 'parentsChallenges.ts',
};

// varName + prefixo base (usado só pra numerar ids novos: `${prefix}v2_NNN`) por arquivo.
const FILE_META = {
  'development.ts': { varName: 'developmentChallenges', prefix: 'dev' },
  'relationships.ts': { varName: 'relationshipsChallenges', prefix: 'rel' },
  'family.ts': { varName: 'familyChallenges', prefix: 'fam' },
  'work.ts': { varName: 'workChallenges', prefix: 'trab' },
  'health.ts': { varName: 'healthChallenges', prefix: 'saude' },
  'finance.ts': { varName: 'financeChallenges', prefix: 'fin' },
  'learning.ts': { varName: 'learningChallenges', prefix: 'apr' },
  'community.ts': { varName: 'communityChallenges', prefix: 'bond' },
  'faith.ts': { varName: 'faithChallenges', prefix: 'fe' },
  'interestCombos.ts': { varName: 'interestComboChallenges', prefix: 'combo' },
  'personCombos.ts': { varName: 'personComboChallenges', prefix: 'person' },
  'eventCombos.ts': { varName: 'eventComboChallenges', prefix: 'event' },
  'familyExpansion.ts': { varName: 'familyExpansionChallenges', prefix: 'famx', opts: { requerFamilia: true } },
  'childrenChallenges.ts': { varName: 'childrenChallenges', prefix: 'fil', opts: { relationships: ['filho', 'neto'] } },
  'partnerChallenges.ts': { varName: 'partnerChallenges', prefix: 'par', opts: { relationships: ['conjuge', 'companheiro', 'namorado', 'noivo'] } },
  'parentsChallenges.ts': { varName: 'parentsChallenges', prefix: 'pai', opts: { relationships: ['pai', 'mae'] } },
  'friendsChallenges.ts': { varName: 'friendsChallenges', prefix: 'ami', opts: { relationships: ['amigo'] } },
  'rainChallenges.ts': { varName: 'rainChallenges', prefix: 'chu', opts: { weatherTags: ['rain', 'indoor'] } },
  'coldChallenges.ts': { varName: 'coldChallenges', prefix: 'fri', opts: { weatherTags: ['cold', 'indoor'] } },
  'hotChallenges.ts': { varName: 'hotChallenges', prefix: 'cal', opts: { weatherTags: ['hot'] } },
  'pleasantWeatherChallenges.ts': { varName: 'pleasantWeatherChallenges', prefix: 'agr', opts: { weatherTags: ['comfortable', 'outdoor'] } },
  'sunnyChallenges.ts': { varName: 'sunnyChallenges', prefix: 'sol', opts: { weatherTags: ['sunny'] } },
  'stormChallenges.ts': { varName: 'stormChallenges', prefix: 'tem', opts: { weatherTags: ['rain', 'indoor'] } },
  'seasonChallenges.ts': { varName: 'seasonChallenges', prefix: 'sea' },
  'indoorChallenges.ts': { varName: 'indoorChallenges', prefix: 'ind', opts: { weatherTags: ['indoor'] } },
  'outdoorChallenges.ts': { varName: 'outdoorChallenges', prefix: 'outd', opts: { weatherTags: ['outdoor'] } },
  'holidayExpansion.ts': { varName: 'holidayExpansionChallenges', prefix: 'holv2' },
};

function normalize(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function seasonTagFor(titulo) {
  const n = normalize(titulo);
  if (n.includes('outono')) return ['autumn'];
  if (n.includes('inverno')) return ['winter'];
  if (n.includes('primavera')) return ['spring'];
  if (n.includes('verao')) return ['summer'];
  return undefined;
}

function eventTagFor(titulo) {
  const n = normalize(titulo);
  if (n.includes('natal')) return ['natal'];
  if (n.includes('mulher')) return ['dia_mulher'];
  if (n.includes('materna') || n.includes(' mae') || n.startsWith('mae')) return ['maternal'];
  if (n.includes('paterna') || n.includes(' pai') || n.startsWith('pai')) return ['paternal'];
  if (n.includes('amigo') || n.includes('amizade')) return ['dia_amigo'];
  if (n.includes('crianca')) return ['dia_criancas'];
  if (n.includes('namorad')) return ['namorados'];
  if (n.includes('pascoa')) return ['pascoa'];
  if (n.includes('saude mental')) return ['saude_mental'];
  if (n.includes('ano novo') || n.includes('proximo ano') || n.includes('ano que vem') || n.includes('ano esta terminando') || n.includes('novo ciclo')) return ['ano_novo'];
  return undefined;
}

// ---------------------------------------------------------------------------
// 1. Parse do markdown V2
// ---------------------------------------------------------------------------

// Tag explícita no início da linha (base curada v3) — [AÇÃO] = actionKind 'acao', [DICA] (ou
// [SUGESTÃO], mesmo conceito com nome diferente) = 'sugestao'. Ausência de tag (base antiga, sem
// curadoria de tipo) cai no default 'acao', com aviso — nunca quebra o parse.
const ACTION_KIND_TAG = /^\[(AÇÃO|AC[AÃ]O|DICA|SUGEST[ÃA]O)\]\s*/i;
const DICA_TAGS = new Set(['DICA', 'SUGESTAO', 'SUGESTÃO']);

function parseTaggedTitulo(rawTitulo) {
  const match = ACTION_KIND_TAG.exec(rawTitulo);
  if (!match) return { titulo: rawTitulo, actionKind: null };
  const tag = match[1].toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); // remove acento pra comparar
  const actionKind = DICA_TAGS.has(tag) || tag.startsWith('SUGEST') ? 'sugestao' : 'acao';
  return { titulo: rawTitulo.slice(match[0].length).trim(), actionKind };
}

function parseMarkdown() {
  const raw = fs.readFileSync(MD_PATH, 'utf8');
  const lines = raw.split('\n');
  let categoria = null;
  let file = null;
  const byFile = {}; // file -> [{ titulo, categoria, actionKind }]
  const unmapped = new Set();
  let untaggedCount = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('## ')) {
      const label = line.slice(3).replace(/\s*\(\d+\)\s*$/, '').trim();
      categoria = CATEGORY_LABEL_TO_KEY[label] || null;
      if (!categoria) console.warn(`Categoria não reconhecida: "${label}"`);
      file = null;
      continue;
    }
    if (line.startsWith('### ')) {
      const label = line.slice(4).replace(/\s*\(\d+\)\s*$/, '').trim();
      if (label === 'Base oficial') {
        file = categoria ? BASE_FILE_BY_CATEGORIA[categoria] : null;
      } else {
        file = SUBLABEL_TO_FILE[label] || null;
      }
      if (!file) unmapped.add(label);
      continue;
    }
    if (line.startsWith('- ')) {
      if (!file || !categoria) continue;
      const rawTitulo = line.slice(2).trim();
      const { titulo, actionKind } = parseTaggedTitulo(rawTitulo);
      if (!actionKind) untaggedCount += 1;
      if (!byFile[file]) byFile[file] = [];
      byFile[file].push({ titulo, categoria, actionKind: actionKind || 'acao' });
    }
  }

  if (unmapped.size > 0) {
    console.warn('Subcategorias sem arquivo mapeado (ignoradas):', [...unmapped]);
  }
  if (untaggedCount > 0) {
    console.warn(`${untaggedCount} linha(s) sem tag [AÇÃO]/[DICA] — assumido 'acao'.`);
  }
  return byFile;
}

// ---------------------------------------------------------------------------
// 2. Carrega os arquivos .ts atuais como dados JS (são literais puros, válidos como JS)
// ---------------------------------------------------------------------------

function loadCurrentChallenges(file) {
  const filePath = path.join(DATA_DIR, file);
  const src = fs.readFileSync(filePath, 'utf8');
  const varMatch = src.match(/export const (\w+): Challenge\[\] = /);
  if (!varMatch) throw new Error(`Não achei "export const X: Challenge[] =" em ${file}`);
  const js = src
    .replace(/^import type[^\n]*\n/m, '')
    .replace(/export const \w+: Challenge\[\] = /, 'module.exports = ');
  const tmpPath = path.join(os.tmpdir(), `sync-challenges-${file}.${Date.now()}.cjs`);
  fs.writeFileSync(tmpPath, js, 'utf8');
  try {
    delete require.cache[require.resolve(tmpPath)];
    const items = require(tmpPath);
    return { varName: varMatch[1], items };
  } finally {
    fs.unlinkSync(tmpPath);
  }
}

// ---------------------------------------------------------------------------
// 3. Serialização genérica (preserva QUALQUER campo presente no objeto)
// ---------------------------------------------------------------------------

const KEY_ORDER = [
  'id', 'categoria', 'actionKind', 'titulo', 'descricao', 'tempoEstimado', 'nivel', 'tipo',
  'horariosIdeais', 'diasIdeais', 'tags', 'socialContext', 'socialActionType',
  'momentos', 'tiposDia', 'contexto', 'requerFamilia', 'requerTempoLivre',
  'cooldownDias', 'interests', 'relationships', 'minAge', 'maxAge',
  'requiresPresence', 'weatherTags', 'seasonTags', 'eventTags', 'contentLevel',
  'musicQuery', 'bibleQuery', 'opensCamera', 'timing',
];

function serializeValue(value) {
  if (typeof value === 'string') return heuristics.quote(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.map(serializeValue).join(', ')}]`;
  return JSON.stringify(value);
}

function serializeChallenge(obj) {
  const keys = [...KEY_ORDER.filter((k) => obj[k] !== undefined), ...Object.keys(obj).filter((k) => !KEY_ORDER.includes(k))];
  const lines = keys.map((k) => `    ${k}: ${serializeValue(obj[k])},`);
  return `  {\n${lines.join('\n')}\n  },`;
}

function writeChallengeFile(file, varName, items) {
  const body = items.map(serializeChallenge).join('\n');
  const content = `import type { Challenge } from '@/types';\n\nexport const ${varName}: Challenge[] = [\n${body}\n];\n`;
  fs.writeFileSync(path.join(DATA_DIR, file), content, 'utf8');
}

// ---------------------------------------------------------------------------
// 4. Diff + geração de itens novos
// ---------------------------------------------------------------------------

function syncFile(file, newEntries) {
  const meta = FILE_META[file];
  if (!meta) throw new Error(`Sem FILE_META para ${file}`);
  const { varName, items: currentItems } = loadCurrentChallenges(file);

  // fila por título (pode haver textos repetidos) — consome do início a cada match
  const queue = new Map();
  for (const item of currentItems) {
    const key = item.titulo.trim();
    if (!queue.has(key)) queue.set(key, []);
    queue.get(key).push(item);
  }

  let maxIndex = 0;
  for (const item of currentItems) {
    const m = /_(\d+)$/.exec(item.id);
    if (m) maxIndex = Math.max(maxIndex, Number(m[1]));
  }

  const finalItems = [];
  let kept = 0;
  let created = 0;
  // Bug real (achado rodando o sync uma 2ª vez sobre um arquivo já sincronizado antes): `maxIndex`
  // era calculado mas nunca usado — `newIndex` sempre começava em 1, colidindo com ids v2 já
  // existentes de uma rodada anterior que foram mantidos (título igual = objeto preservado,
  // id incluso). Resultado: dois desafios de TEXTO diferente com o MESMO id, o que quebra
  // cooldown/histórico por id no ChallengeEngine (o mais recente sobrescreve o outro em
  // `challengeById`). Sempre continuar a partir do maior índice já usado no arquivo.
  let newIndex = maxIndex + 1;

  for (const entry of newEntries) {
    const key = entry.titulo.trim();
    const bucket = queue.get(key);
    if (bucket && bucket.length > 0) {
      const existing = bucket.shift();
      // categoria/actionKind podem ter sido corrigidos na lista nova — mantém o resto do objeto
      // intacto (id, momentos, tiposDia, contexto, tags, etc.).
      finalItems.push({ ...existing, categoria: entry.categoria, actionKind: entry.actionKind });
      kept += 1;
    } else {
      const opts = { ...(meta.opts || {}) };
      if (file === 'seasonChallenges.ts') {
        const st = seasonTagFor(entry.titulo);
        if (st) opts.seasonTags = st;
      }
      if (file === 'holidayExpansion.ts' || file === 'eventCombos.ts') {
        const et = eventTagFor(entry.titulo);
        if (et) opts.eventTags = et;
      }
      const id = `${meta.prefix}v2_${String(newIndex).padStart(3, '0')}`;
      newIndex += 1;
      const challenge = heuristics.buildChallenge(entry.categoria, meta.prefix + 'v2', 0, entry.titulo, undefined, undefined, opts);
      challenge.id = id;
      challenge.actionKind = entry.actionKind;
      finalItems.push(challenge);
      created += 1;
    }
  }

  const removed = currentItems.length - kept;
  writeChallengeFile(file, varName, finalItems);
  return { file, before: currentItems.length, after: finalItems.length, kept, created, removed };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

const byFile = parseMarkdown();
const report = [];
let totalBefore = 0;
let totalAfter = 0;

for (const file of Object.keys(FILE_META)) {
  const entries = byFile[file] || [];
  if (entries.length === 0) {
    console.warn(`Nenhuma entrada nova pra ${file} — pulando (arquivo mantido como está).`);
    continue;
  }
  const r = syncFile(file, entries);
  report.push(r);
  totalBefore += r.before;
  totalAfter += r.after;
}

console.log('\nArquivo'.padEnd(32) + 'antes'.padStart(7) + 'depois'.padStart(8) + 'mantidos'.padStart(10) + 'novos'.padStart(8) + 'removidos'.padStart(11));
for (const r of report) {
  console.log(r.file.padEnd(32) + String(r.before).padStart(7) + String(r.after).padStart(8) + String(r.kept).padStart(10) + String(r.created).padStart(8) + String(r.removed).padStart(11));
}
console.log('-'.repeat(78));
console.log(`TOTAL`.padEnd(32) + String(totalBefore).padStart(7) + String(totalAfter).padStart(8));
