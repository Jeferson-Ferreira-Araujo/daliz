/**
 * Marca `interests` nos desafios já gerados em src/data/challenges/*.ts, sem tocar
 * em mais nenhum campo. Não é parte de scripts/generate-challenges.js porque não
 * deriva de texto bruto — é um passo de enriquecimento incremental, seguro de rodar
 * de novo (idempotente: recalcula sempre a partir do título/tags/categoria, nunca
 * acumula duplicado).
 *
 * Uso: node scripts/tag-interests.js
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data', 'challenges');

// Arquivos gerados por generate-challenges.js — NÃO inclui interestCombos.ts
// (esse já é escrito à mão com `interests` definido desde o início).
const FILES = ['development', 'relationships', 'family', 'work', 'health', 'finance', 'learning', 'community', 'faith'];

// Categoria inteira que já implica um interesse, sem precisar de palavra-chave.
const CATEGORY_DEFAULT_INTEREST = {
  fe_espiritualidade: 'spirituality',
  familia_presenca: 'family',
  aprendizado_curiosidade: 'learning',
};

// Pistas de palavra (já sem acento, minúsculas) por interesse. Propositalmente
// conservador — melhor deixar um desafio sem interesse do que marcar errado.
const INTEREST_HINTS = {
  music: ['musica', 'cancao', 'playlist', 'melodia'],
  instruments: ['violao', 'piano', 'bateria', 'guitarra', 'instrumento musical'],
  gaming: ['videogame', 'video game', 'jogo de tabuleiro', 'jogo de cartas', 'jogo eletronico'],
  sports: ['futebol', 'volei', 'basquete', 'tenis', 'esporte'],
  fitness: ['exercicio fisico', 'caminhada', 'alongamento', 'atividade fisica', 'academia', 'corrida'],
  reading: ['leia', 'livro', 'leitura'],
  movies_series: ['filme', 'serie', 'documentario'],
  art: ['desenh', 'pintura', 'pinte'],
  photography: ['foto', 'fotografia', 'fotografe'],
  cooking: ['cozinh', 'receita'],
  gardening: ['jardim', 'horta', 'regar uma planta', 'suas plantas'],
  nature: ['ao ar livre', 'natureza', 'parque'],
  travel: ['viagem', 'viajar', 'viaje'],
  cars: ['lave o carro', 'seu carro', 'automovel'],
  diy: ['conserte', 'conserto', 'reparo', 'reparar algo'],
  technology: ['tecnologia', 'programacao', 'codigo'],
  content_creation: ['poste um', 'crie um post', 'grave um video'],
  animals: ['seu pet', 'animal de estimacao', 'seu cachorro', 'seu gato'],
  puzzles: ['quebra-cabeca', 'palavra cruzada', 'sudoku', 'xadrez', 'charada'],
  writing: ['escreva', 'escrever', 'redija', 'seu diario'],
};

function normalize(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function inferInterests(categoria, titulo, tags) {
  const found = new Set();
  const defaultInterest = CATEGORY_DEFAULT_INTEREST[categoria];
  if (defaultInterest) found.add(defaultInterest);

  const haystack = normalize(`${titulo} ${tags.join(' ')}`);
  for (const [interest, hints] of Object.entries(INTEREST_HINTS)) {
    if (hints.some((hint) => haystack.includes(hint))) found.add(interest);
  }
  return [...found];
}

let totalTagged = 0;

for (const name of FILES) {
  const filePath = path.join(DATA_DIR, `${name}.ts`);
  let src = fs.readFileSync(filePath, 'utf8');

  // Remove uma marcação anterior (se o script já rodou antes), pra recalcular do zero.
  src = src.replace(/\n\s*interests: \[[^\]]*\],/g, '');

  let taggedInFile = 0;
  src = src.replace(
    /(\n {4}categoria: '([^']+)',\n {4}titulo: '((?:[^'\\]|\\.)*)',[\s\S]*?\n {4}tags: (\[[^\]]*\]),)/g,
    (match, block, categoria, titulo, tagsLiteral) => {
      // eslint-disable-next-line no-eval -- literal array de strings vindo do próprio arquivo gerado, sem risco
      const tags = eval(tagsLiteral);
      const interests = inferInterests(categoria, titulo, tags);
      if (interests.length === 0) return block;
      taggedInFile += 1;
      const interestsLiteral = interests.map((i) => `'${i}'`).join(', ');
      return `${block}\n    interests: [${interestsLiteral}],`;
    },
  );

  fs.writeFileSync(filePath, src, 'utf8');
  totalTagged += taggedInFile;
  console.log(`${name}.ts: ${taggedInFile} desafio(s) marcado(s) com interests`);
}

console.log(`\nTotal: ${totalTagged} desafios marcados em ${FILES.length} arquivos.`);
