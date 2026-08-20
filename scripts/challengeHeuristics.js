// Funções heurísticas compartilhadas entre scripts/generate-challenges.js (base oficial de
// ~900 desafios) e scripts/generate-challenge-expansion.js (expansão contextual). Extraído
// pra um módulo único pra não duplicar a lógica de inferência em dois lugares (ver plano de
// expansão da biblioteca de desafios).
'use strict';
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'src', 'data', 'challenges');

// ---------------------------------------------------------------------------
// Heurísticas de classificação (tipo/nivel/horário/tempo/tags) — nenhum desses
// campos é usado para filtrar candidatos no motor (ver src/engine/scoring.ts),
// então uma heurística razoável é suficiente; o texto do desafio em si (título)
// é sempre reproduzido verbatim do texto bruto de origem.
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'de','da','do','das','dos','uma','um','para','pra','com','sem','que','se','seu','sua','seus','suas',
  'voce','você','alguem','alguém','algo','hoje','amanha','amanhã','antes','depois','mais','menos','nao','não',
  'ao','aos','as','às','os','na','no','nas','nos','em','por','e','ou','a','o','sobre','sua','seu','onde',
  'quando','qual','quais','como','está','esta','estao','estão','ser','ter','fazer','faça','faca','durante',
]);

const CONTATO_VERBS = ['ligue','pergunte','envie','mande','converse','convide','agradeça','agradeca','elogie',
  'parabenize','ensine','responda','cumprimente','informe','avise','chame','diga','peça desculpas','peça ajuda',
  'compartilhe','ore por','incentive','visite'];
const REFLEXAO_VERBS = ['escreva','anote','pense','reflita','identifique','nomeie','lembre','relembre',
  'reconheça','reconheca','releia','pare por um minuto','observe algo'];
const ORGANIZACAO_VERBS = ['organize','confira','verifique','limpe','separe','guarde','revise','renomeie',
  'exclua','arquive','cancele','prepare','ajuste','feche','abra','defina','marque','coloque','divida',
  'elimine','resolva','planeje','remova'];
const HABITO_VERBS = ['beba','caminhe','levante','alongue','respire','dance','fique','evite','passe',
  'aproveite','use','tome','coma','durma','acorde','adicione','apague'];

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function inferTipo(line) {
  const norm = normalize(line);
  for (const verb of CONTATO_VERBS) if (norm.startsWith(normalize(verb))) return 'contato';
  for (const verb of REFLEXAO_VERBS) if (norm.startsWith(normalize(verb))) return 'reflexao';
  for (const verb of ORGANIZACAO_VERBS) if (norm.startsWith(normalize(verb))) return 'organizacao';
  for (const verb of HABITO_VERBS) if (norm.startsWith(normalize(verb))) return 'habito';
  return 'acao';
}

const MEDIO_HINTS = ['desculp', 'perdã', 'perdo', 'confront', 'critiqu', 'admita', 'reconheç', 'reconhec',
  'recus', 'diga "não"', 'diga não', 'discord'];
const DESAFIADOR_HINTS = ['saia de uma conversa', 'diga "não" a', 'diga não a', 'confronte'];

function inferNivel(line) {
  const norm = normalize(line);
  for (const hint of DESAFIADOR_HINTS) if (norm.includes(normalize(hint))) return 'desafiador';
  for (const hint of MEDIO_HINTS) if (norm.includes(normalize(hint))) return 'medio';
  return 'facil';
}

function inferHorarios(line) {
  const norm = normalize(line);
  if (norm.includes('antes de dormir') || norm.includes('antes de deitar') || norm.includes('a noite') || norm.includes('à noite')) {
    return ['noite'];
  }
  if (norm.includes('ao acordar') || norm.includes('pela manha') || norm.includes('de manha')) {
    return ['manha'];
  }
  return ['qualquer'];
}

function inferTempo(line, tipo) {
  const match = line.match(/(\d+)\s*minutos?/i);
  if (match) return Math.max(1, Math.min(30, Number(match[1])));
  const defaults = { contato: 3, reflexao: 5, organizacao: 5, habito: 4, acao: 4 };
  return defaults[tipo] ?? 4;
}

function inferTags(line, extraTag) {
  const norm = normalize(line).replace(/[".:,!?()]/g, '');
  const words = norm.split(/\s+/).filter((w) => w.length >= 5 && !STOPWORDS.has(w));
  const tags = [...new Set(words)].slice(0, 2);
  if (extraTag) tags.push(extraTag);
  return tags.length > 0 ? tags : extraTag ? [extraTag] : ['geral'];
}

// ---------------------------------------------------------------------------
// Heurísticas do motor de contexto (momento do dia / tipo de dia / contexto) —
// eixo de FILTRO RÍGIDO no ChallengeEngine (ver src/engine/dayModel.ts), então
// o fallback é sempre 'qualquer' quando não há evidência clara no texto: mais
// seguro deixar um desafio flexível demais do que travá-lo no momento errado.
// ---------------------------------------------------------------------------

const ANTES_DORMIR_HINTS = ['antes de dormir', 'antes de deitar', 'antes de dorm'];
const INICIO_DIA_HINTS = [
  'ao acordar', 'pela manha', 'de manha', 'prioridades do dia', 'tarefa mais importante de hoje',
  'antes de comecar', 'escolha a tarefa mais importante', 'organize sua mesa antes de comecar',
  'defina uma intencao', 'defina o resultado esperado antes de comecar',
];
const FIM_DIA_HINTS = [
  'termine o dia', 'no fim do dia', 'termine o expediente', 'prepare a lista de amanha',
  'antes de encerrar', 'ao encerrar', 'prepare o ambiente para amanha', 'termine o expediente deixando',
];
const TRANSICAO_HINTS = ['depois do trabalho', 'ao chegar em casa', 'fim do expediente'];

const TRABALHO_HINTS = ['reuniao', 'colega', 'equipe', 'expediente', 'chefe', 'escritorio'];

function inferMomentos(line, categoria) {
  const norm = normalize(line);
  if (ANTES_DORMIR_HINTS.some((h) => norm.includes(normalize(h)))) return ['antes_dormir'];
  if (INICIO_DIA_HINTS.some((h) => norm.includes(normalize(h)))) return ['inicio_dia'];
  if (TRANSICAO_HINTS.some((h) => norm.includes(normalize(h)))) return ['transicao'];
  if (FIM_DIA_HINTS.some((h) => norm.includes(normalize(h)))) return ['fim_dia'];
  if (categoria === 'trabalho_produtividade' && TRABALHO_HINTS.some((h) => norm.includes(normalize(h)))) {
    return ['durante_dia'];
  }
  return ['qualquer'];
}

function inferTiposDia(line) {
  const norm = normalize(line);
  if (TRABALHO_HINTS.some((h) => norm.includes(normalize(h)))) return ['trabalho'];
  return ['qualquer'];
}

const EM_CASA_HINTS = ['em casa', 'familia', 'filho', 'filha', 'crianca', 'cozinha', 'quarto', 'parceiro', 'parceira'];
const NO_TRABALHO_HINTS = ['mesa', 'reuniao', 'colega', 'escritorio', 'expediente', 'equipe'];

function inferContexto(line) {
  const norm = normalize(line);
  if (EM_CASA_HINTS.some((h) => norm.includes(normalize(h)))) return ['em_casa'];
  if (NO_TRABALHO_HINTS.some((h) => norm.includes(normalize(h)))) return ['no_trabalho'];
  return ['qualquer'];
}

function inferRequerFamilia(line, categoria) {
  if (categoria === 'familia_presenca') return true;
  const norm = normalize(line);
  const hints = ['filho', 'filha', 'crianca', 'parceiro', 'parceira', 'familia'];
  return hints.some((h) => norm.includes(h));
}

function inferRequerTempoLivre(tempoEstimado) {
  return tempoEstimado >= 10;
}

const COOLDOWN_BY_TIPO = { contato: 5, reflexao: 3, organizacao: 2, habito: 1, acao: 3 };

function inferCooldownDias(tipo) {
  return COOLDOWN_BY_TIPO[tipo] ?? 3;
}

function parseLines(raw) {
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^\d+\.\s+/.test(l))
    .map((l) => l.replace(/^\d+\.\s+/, ''));
}

/** Constrói um Challenge base (mesmos campos que a base oficial gera). `opts` extras
 * (weatherTags, seasonTags, eventTags, relationships, contentLevel, minAge, maxAge,
 * requiresPresence, requerFamilia/requerTempoLivre/cooldownDias override, interests) são
 * aplicados por cima — usados pela expansão contextual, ignorados pela base oficial. */
function buildChallenge(categoria, prefix, index, rawLine, tipoBias, extraTag, opts) {
  const options = opts || {};
  const social = /📱/.test(rawLine);
  const titulo = rawLine.replace(/\s*📱\s*$/, '').trim();
  const tipo = tipoBias ?? inferTipo(titulo);
  const nivel = inferNivel(titulo);
  const horariosIdeais = inferHorarios(titulo);
  const tempoEstimado = inferTempo(titulo, tipo);
  const tags = inferTags(titulo, extraTag);
  const momentos = options.momentos ?? inferMomentos(titulo, categoria);
  const tiposDia = options.tiposDia ?? inferTiposDia(titulo);
  const contexto = options.contexto ?? inferContexto(titulo);
  const requerFamilia = options.requerFamilia ?? inferRequerFamilia(titulo, categoria);
  const requerTempoLivre = options.requerTempoLivre ?? inferRequerTempoLivre(tempoEstimado);
  const cooldownDias = options.cooldownDias ?? inferCooldownDias(tipo);

  const challenge = {
    id: `${prefix}_${String(index).padStart(3, '0')}`,
    categoria,
    titulo,
    descricao: options.descricao ?? titulo,
    tempoEstimado,
    nivel,
    tipo,
    horariosIdeais,
    diasIdeais: 'qualquer',
    tags,
    momentos,
    tiposDia,
    contexto,
    cooldownDias,
  };
  if (social) {
    challenge.socialContext = true;
  }
  if (requerFamilia) challenge.requerFamilia = true;
  if (requerTempoLivre) challenge.requerTempoLivre = true;
  if (options.weatherTags) challenge.weatherTags = options.weatherTags;
  if (options.seasonTags) challenge.seasonTags = options.seasonTags;
  if (options.eventTags) challenge.eventTags = options.eventTags;
  if (options.contentLevel) challenge.contentLevel = options.contentLevel;
  if (options.relationships) challenge.relationships = options.relationships;
  if (options.minAge != null) challenge.minAge = options.minAge;
  if (options.maxAge != null) challenge.maxAge = options.maxAge;
  if (options.requiresPresence) challenge.requiresPresence = true;
  if (options.interests) challenge.interests = options.interests;
  return challenge;
}

function quote(str) {
  return `'${str.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function quoteArray(arr) {
  return `[${arr.map(quote).join(', ')}]`;
}

function toTS(challenge) {
  const lines = [
    '  {',
    `    id: ${quote(challenge.id)},`,
    `    categoria: ${quote(challenge.categoria)},`,
    `    titulo: ${quote(challenge.titulo)},`,
    `    descricao: ${quote(challenge.descricao)},`,
    `    tempoEstimado: ${challenge.tempoEstimado},`,
    `    nivel: ${quote(challenge.nivel)},`,
    `    tipo: ${quote(challenge.tipo)},`,
    `    horariosIdeais: ${quoteArray(challenge.horariosIdeais)},`,
    `    diasIdeais: 'qualquer',`,
    `    tags: ${quoteArray(challenge.tags)},`,
  ];
  if (challenge.socialContext) lines.push('    socialContext: true,');
  if (challenge.socialActionType) lines.push(`    socialActionType: ${quote(challenge.socialActionType)},`);
  lines.push(`    momentos: ${quoteArray(challenge.momentos)},`);
  lines.push(`    tiposDia: ${quoteArray(challenge.tiposDia)},`);
  lines.push(`    contexto: ${quoteArray(challenge.contexto)},`);
  if (challenge.requerFamilia) lines.push('    requerFamilia: true,');
  if (challenge.requerTempoLivre) lines.push('    requerTempoLivre: true,');
  lines.push(`    cooldownDias: ${challenge.cooldownDias},`);
  if (challenge.weatherTags) lines.push(`    weatherTags: ${quoteArray(challenge.weatherTags)},`);
  if (challenge.seasonTags) lines.push(`    seasonTags: ${quoteArray(challenge.seasonTags)},`);
  if (challenge.eventTags) lines.push(`    eventTags: ${quoteArray(challenge.eventTags)},`);
  if (challenge.contentLevel) lines.push(`    contentLevel: ${quote(challenge.contentLevel)},`);
  if (challenge.relationships) lines.push(`    relationships: ${quoteArray(challenge.relationships)},`);
  if (challenge.minAge != null) lines.push(`    minAge: ${challenge.minAge},`);
  if (challenge.maxAge != null) lines.push(`    maxAge: ${challenge.maxAge},`);
  if (challenge.requiresPresence) lines.push('    requiresPresence: true,');
  if (challenge.interests) lines.push(`    interests: ${quoteArray(challenge.interests)},`);
  lines.push('  },');
  return lines.join('\n');
}

function writeFile(fileName, varName, challenges) {
  const body = challenges.map(toTS).join('\n');
  const content = `import type { Challenge } from '@/types';\n\nexport const ${varName}: Challenge[] = [\n${body}\n];\n`;
  fs.writeFileSync(path.join(OUT_DIR, fileName), content, 'utf8');
  console.log(`${fileName}: ${challenges.length} desafios`);
}

module.exports = {
  OUT_DIR,
  normalize,
  inferTipo,
  inferNivel,
  inferHorarios,
  inferTempo,
  inferTags,
  inferMomentos,
  inferTiposDia,
  inferContexto,
  inferRequerFamilia,
  inferRequerTempoLivre,
  inferCooldownDias,
  parseLines,
  buildChallenge,
  quote,
  quoteArray,
  toTS,
  writeFile,
};
