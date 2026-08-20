/**
 * Marca `relationships` nos desafios já gerados em src/data/challenges/*.ts, sem tocar
 * em mais nenhum campo — mesmo padrão de scripts/tag-interests.js (enriquecimento
 * incremental, idempotente, não deriva de texto bruto).
 *
 * Conservador de propósito: como `relationships` é filtro DURO no motor (ver
 * ChallengeEngine.filterCandidatesForSlot), só marca quando há evidência textual clara —
 * melhor um desafio de família ficar sem a marcação do que ser bloqueado incorretamente
 * pra quem não tem aquele tipo de pessoa cadastrada.
 *
 * Uso: node scripts/tag-relationships.js
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data', 'challenges');

const FILES = ['development', 'relationships', 'family', 'work', 'health', 'finance', 'learning', 'community', 'faith'];

// Sem default por categoria — ao contrário de `interests` (bônus, nunca bloqueia),
// `relationships` É filtro duro no motor. Marcar a categoria inteira de família deixaria
// QUEM NÃO CADASTROU NINGUÉM sem nenhum desafio de família, e cadastrar pessoas é opcional
// por design (ver seção 3). Só marca quando o próprio título menciona uma relação
// específica — melhor deixar um desafio "sem pessoa" do que bloquear errado.
const RELATIONSHIP_HINTS = {
  filho: ['seu filho', 'sua filha', 'seus filhos', 'com seu filho', 'com sua filha'],
  conjuge: ['seu conjuge', 'sua esposa', 'seu esposo', 'seu marido', 'seu parceiro', 'sua parceira', 'seu namorado', 'sua namorada'],
  pai: ['seu pai'],
  mae: ['sua mae'],
  irmao: ['seu irmao', 'sua irma'],
  avo: ['seu avo', 'sua avo', 'seus avos'],
  neto: ['seu neto', 'sua neta'],
  amigo: ['seu amigo', 'sua amiga', 'um amigo', 'uma amiga', 'aquele amigo', 'aquela amiga'],
};

function normalize(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

// eslint-disable-next-line no-unused-vars -- categoria mantida na assinatura pra clareza de chamada, sem uso hoje
function inferRelationships(categoria, titulo) {
  const found = new Set();
  const haystack = normalize(titulo);
  for (const [relationship, hints] of Object.entries(RELATIONSHIP_HINTS)) {
    if (hints.some((hint) => haystack.includes(hint))) found.add(relationship);
  }
  return [...found];
}

let totalTagged = 0;

for (const name of FILES) {
  const filePath = path.join(DATA_DIR, `${name}.ts`);
  let src = fs.readFileSync(filePath, 'utf8');

  // Remove uma marcação anterior (se o script já rodou antes), pra recalcular do zero.
  src = src.replace(/\n\s*relationships: \[[^\]]*\],/g, '');

  let taggedInFile = 0;
  src = src.replace(
    /(\n {4}categoria: '([^']+)',\n {4}titulo: '((?:[^'\\]|\\.)*)',[\s\S]*?\n {4}tags: \[[^\]]*\],(?:\n {4}interests: \[[^\]]*\],)?)/g,
    (match, block, categoria, titulo) => {
      const relationships = inferRelationships(categoria, titulo);
      if (relationships.length === 0) return block;
      taggedInFile += 1;
      const relationshipsLiteral = relationships.map((r) => `'${r}'`).join(', ');
      return `${block}\n    relationships: [${relationshipsLiteral}],`;
    },
  );

  fs.writeFileSync(filePath, src, 'utf8');
  totalTagged += taggedInFile;
  console.log(`${name}.ts: ${taggedInFile} desafio(s) marcado(s) com relationships`);
}

console.log(`\nTotal: ${totalTagged} desafios marcados em ${FILES.length} arquivos.`);
