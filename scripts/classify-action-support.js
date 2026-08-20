// Aplica supportType/supportLabel/supportData a um subconjunto curado (não gerado por
// palavra-chave — decidido item a item pelo propósito real da ação, ver seção "observação
// importante" do pedido) do catálogo. Tudo que não está nos mapas abaixo permanece sem
// supportType (== 'none': card se comporta exatamente como hoje).
//
// Uso: node scripts/classify-action-support.js
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data', 'challenges');

// ---------------------------------------------------------------------------
// Carregar / serializar (mesmo mecanismo do sync-challenges-v2.js — arquivos são literais
// JS puros, dá pra requerer diretamente depois de trocar o cabeçalho TS por module.exports).
// ---------------------------------------------------------------------------

function loadChallenges(file) {
  const filePath = path.join(DATA_DIR, file);
  const src = fs.readFileSync(filePath, 'utf8');
  const varMatch = src.match(/export const (\w+): Challenge\[\] = /);
  if (!varMatch) throw new Error(`Não achei "export const X: Challenge[] =" em ${file}`);
  const js = src
    .replace(/^import type[^\n]*\n/m, '')
    .replace(/export const \w+: Challenge\[\] = /, 'module.exports = ');
  const tmpPath = path.join(os.tmpdir(), `classify-support-${file}.${Date.now()}.cjs`);
  fs.writeFileSync(tmpPath, js, 'utf8');
  try {
    delete require.cache[require.resolve(tmpPath)];
    return { varName: varMatch[1], items: require(tmpPath) };
  } finally {
    fs.unlinkSync(tmpPath);
  }
}

const KEY_ORDER = [
  'id', 'categoria', 'titulo', 'descricao', 'tempoEstimado', 'nivel', 'tipo',
  'horariosIdeais', 'diasIdeais', 'tags', 'socialContext', 'socialActionType',
  'momentos', 'tiposDia', 'contexto', 'requerFamilia', 'requerTempoLivre',
  'cooldownDias', 'interests', 'relationships', 'minAge', 'maxAge',
  'requiresPresence', 'weatherTags', 'seasonTags', 'eventTags', 'contentLevel',
  'musicQuery', 'bibleQuery', 'opensCamera', 'timing',
  'supportType', 'supportLabel', 'supportData',
];

function quote(str) {
  return `'${str.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function serializeValue(value) {
  if (typeof value === 'string') return quote(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.map(serializeValue).join(', ')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).map(([k, v]) => `${k}: ${serializeValue(v)}`);
    return `{ ${entries.join(', ')} }`;
  }
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
// Classificação curada
// ---------------------------------------------------------------------------

// título exato -> { supportType, supportLabel?, supportData? }
const RULES = {};

function rule(titulo, entry) {
  if (RULES[titulo]) throw new Error(`Título duplicado nas regras: "${titulo}"`);
  RULES[titulo] = entry;
}

// --- Filmes: só ações cujo propósito É escolher/assistir um filme agora, nunca "conversar sobre
// filme com alguém" (isso é uma ação de relacionamento, não precisa de sugestão externa). ---
const MOVIE = { supportType: 'categories', supportLabel: '🎬 Ver sugestões', supportData: { kind: 'movies' } };
rule('Escolha um filme ou série para assistir junto com alguém da casa.', MOVIE);
rule('Assista a um filme com a família enquanto chove lá fora.', MOVIE);

// --- Locais reais que fazem sentido "ir agora, perto de mim" — exclui deliberadamente qualquer
// "visite {pessoa}"/"visite um familiar" (visita a pessoa, não a um lugar) e itens onde a pessoa
// já está no lugar (ex: "sentar num banco de praça e observar"). ---
function maps(query) {
  return { supportType: 'maps', supportLabel: '📍 Abrir no Maps', supportData: { query } };
}
rule('Faça uma caminhada num parque ou praça perto de você.', maps('parque'));
rule('Faça uma trilha curta e leve, se houver uma opção segura perto de você.', maps('trilha'));
rule('Aproveite pra conhecer uma praça ou parque que você nunca visitou.', maps('parque'));
rule('Aproveite pra visitar um pequeno comércio local durante uma saída ao ar livre.', maps('comércio local'));
rule('Aproveite o clima bom pra visitar uma praça ou parque perto de casa.', maps('parque'));
rule('Faça uma caminhada leve num parque ou praça perto de você.', maps('parque'));
rule('Aproveite o clima pra visitar uma feira ou mercado local perto de casa.', maps('feira'));
rule('Aproveite o dia agradável pra visitar um pequeno comércio local.', maps('comércio local'));
rule('Aproveite o dia de sol pra visitar um parque com sombra disponível.', maps('parque'));

// --- Spotify: só intenção genuína de OUVIR/descobrir música agora — não "escolher uma música
// para outra pessoa" (relacional) nem "conversar sobre música" (já coberto por musicQuery em
// outros ~22 itens hand-tagged; não duplicamos botão aqui). ---
const SPOTIFY = { supportType: 'spotify', supportLabel: '🎵 Abrir no Spotify' };
rule('Dance uma música inteira.', SPOTIFY);
rule('Escolha uma música alegre e dance por alguns minutos, só por diversão.', SPOTIFY);
rule(
  'Escolha uma música que costuma melhorar seu humor e escute-a inteira sem mexer no celular. Use esses minutos para estar presente em vez de consumir várias coisas ao mesmo tempo.',
  SPOTIFY,
);
rule('Ouça uma música de um gênero que não conhece.', SPOTIFY);

// --- "Aprenda uma palavra nova": frase fixa pedida na especificação (seção 3). ---
rule('Aprenda uma palavra nova.', {
  supportType: 'search',
  supportLabel: '🔎 Pesquisar uma nova palavra',
  supportData: { query: 'Me ensine uma nova palavra' },
});

// --- Aprendizado/curiosidade (learning.ts, ~96 itens da base oficial): busca construída a
// partir do próprio termo da ação (seção 4), não uma frase fixa. Classificado item a item pelo
// propósito, não por presença de palavra — itens que dependem de uma pessoa específica (colega,
// amigo, filho, família), que já são autocontidos (enigma/memorização) ou vagos demais pra virar
// uma busca útil (ex: "assista a um vídeo educativo curto", sem tema) ficam de fora (== 'none').
function search(query, label) {
  return { supportType: 'search', supportLabel: label ?? '🔎 Pesquisar', supportData: { query } };
}

const LEARNING_SEARCH = {
  'Pesquise a origem do seu nome.': 'origem do meu nome',
  'Descubra algo sobre a cidade onde mora.': 'curiosidades sobre a minha cidade',
  'Aprenda uma curiosidade sobre seu país.': 'curiosidade sobre o meu país',
  'Pesquise como algo que você usa diariamente funciona.': 'como funcionam as coisas que uso todos os dias',
  'Aprenda um atalho do computador.': 'atalhos de teclado do computador',
  'Aprenda um atalho do celular.': 'atalhos úteis do celular',
  'Descubra uma função escondida de um aplicativo.': 'funções escondidas de aplicativos do celular',
  'Leia algo sobre ciência.': 'curiosidades de ciência',
  'Leia algo sobre economia.': 'conceitos básicos de economia',
  'Aprenda uma frase em outro idioma.': 'frase útil em outro idioma',
  'Aprenda cinco palavras de outro idioma.': 'palavras novas em outro idioma',
  'Pesquise a origem de uma expressão.': 'origem de uma expressão popular',
  'Descubra quem inventou alguma coisa que você usa.': 'quem inventou objetos do dia a dia',
  'Pesquise como uma tecnologia funciona.': 'como funciona uma tecnologia',
  'Aprenda uma curiosidade sobre o corpo humano.': 'curiosidade sobre o corpo humano',
  'Aprenda uma curiosidade sobre o espaço.': 'curiosidade sobre o espaço',
  'Aprenda uma curiosidade sobre animais.': 'curiosidade sobre animais',
  'Aprenda uma curiosidade histórica.': 'curiosidade histórica',
  'Aprenda uma curiosidade geográfica.': 'curiosidade geográfica',
  'Aprenda uma curiosidade sobre música.': 'curiosidade sobre música',
  'Aprenda uma curiosidade sobre cinema.': 'curiosidade sobre cinema',
  'Aprenda uma curiosidade sobre culinária.': 'curiosidade sobre culinária',
  'Aprenda uma curiosidade sobre comportamento.': 'curiosidade sobre comportamento humano',
  'Pesquise a história de uma invenção.': 'história de uma invenção',
  'Pesquise a história de uma profissão.': 'história de uma profissão',
  'Pesquise como uma empresa começou.': 'história de uma empresa famosa',
  'Pesquise como um produto é fabricado.': 'como um produto é fabricado',
  'Descubra como funciona o GPS.': 'como funciona o GPS',
  'Descubra como funciona a internet.': 'como funciona a internet',
  'Descubra como funciona uma bateria.': 'como funciona uma bateria',
  'Descubra como funciona um motor.': 'como funciona um motor',
  'Descubra como funciona uma câmera.': 'como funciona uma câmera',
  'Pesquise o significado de uma expressão popular.': 'significado de uma expressão popular',
  'Descubra a origem de um ditado.': 'origem de um ditado popular',
  'Conheça uma obra de arte famosa.': 'obras de arte famosas',
  'Conheça um artista que nunca estudou.': 'artista para conhecer',
  'Conheça um autor novo.': 'autor de livros para conhecer',
  'Pesquise um livro que talvez queira ler.': 'livros recomendados para ler',
  'Pesquise uma invenção brasileira.': 'invenção brasileira famosa',
  'Pesquise uma personalidade importante da sua cidade.': 'personalidade importante da minha cidade',
  'Aprenda uma regra básica de etiqueta.': 'regras básicas de etiqueta',
  'Aprenda uma técnica simples de memória.': 'técnica simples de memorização',
  'Resolva um pequeno enigma.': 'enigma para resolver',
  'Resolva uma questão de lógica.': 'questão de lógica para resolver',
  'Pesquise uma ferramenta que pode ajudar no trabalho.': 'ferramenta para ajudar no trabalho',
  'Aprenda uma fórmula útil para o cotidiano.': 'fórmula útil para o dia a dia',
  'Aprenda uma maneira melhor de organizar informações.': 'técnicas de organização de informações',
  'Aprenda uma técnica de pesquisa.': 'técnicas de pesquisa',
  'Descubra como verificar uma informação antes de compartilhá-la.': 'como verificar se uma informação é verdadeira',
  'Aprenda a identificar uma fonte confiável.': 'como identificar uma fonte confiável',
  'Pesquise uma dúvida antiga.': 'tirar uma dúvida antiga',
  'Leia o resumo de um livro interessante.': 'resumo de um livro interessante',
  'Conheça um idioma que nunca estudou.': 'idiomas para aprender',
  'Pesquise como outra cultura faz algo cotidiano.': 'como outras culturas fazem coisas do dia a dia',
  'Descubra uma tradição de outro país.': 'tradição curiosa de outro país',
  'Pesquise uma comida típica de outro lugar.': 'comida típica de outro país',
  'Conheça um lugar que gostaria de visitar.': 'lugares para visitar',
  'Pesquise uma curiosidade sobre seu bairro.': 'curiosidade sobre o meu bairro',
  'Aprenda uma habilidade manual simples.': 'habilidade manual simples para aprender',
  'Descubra uma maneira de economizar tempo.': 'maneiras de economizar tempo',
  'Descubra uma maneira de organizar melhor uma tarefa.': 'como organizar melhor uma tarefa',
  'Aprenda um conceito financeiro básico.': 'conceito financeiro básico',
  'Aprenda uma técnica simples de comunicação.': 'técnica simples de comunicação',
  'Aprenda uma pergunta que melhora uma conversa.': 'pergunta que melhora uma conversa',
  'Aprenda uma forma melhor de dar feedback.': 'como dar um feedback melhor',
  'Aprenda uma forma melhor de receber críticas.': 'como lidar melhor com críticas',
  'Aprenda uma estratégia para reduzir distrações.': 'estratégia para reduzir distrações',
  'Aprenda uma técnica para lembrar compromissos.': 'técnica para lembrar compromissos',
  'Descubra uma coisa que aconteceu no mundo no dia em que nasceu.': 'o que aconteceu no mundo no dia em que eu nasci',
  'Pesquise o significado de uma palavra que usa frequentemente.': 'significado de uma palavra',
  'Aprenda uma habilidade pequena em 10 minutos.': 'habilidade rápida para aprender em 10 minutos',
};
for (const [titulo, query] of Object.entries(LEARNING_SEARCH)) {
  rule(titulo, search(query, query.length > 28 ? '🔎 Pesquisar' : '🔎 Aprender mais'));
}

// ---------------------------------------------------------------------------
// Aplicar
// ---------------------------------------------------------------------------

const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.ts') && f !== 'index.ts');
const remaining = new Set(Object.keys(RULES));
let applied = 0;
const byType = { search: 0, categories: 0, maps: 0, spotify: 0 };

for (const file of files) {
  const { varName, items } = loadChallenges(file);
  let changed = false;
  const updated = items.map((item) => {
    const entry = RULES[item.titulo];
    if (!entry) return item;
    remaining.delete(item.titulo);
    applied += 1;
    byType[entry.supportType] += 1;
    changed = true;
    return { ...item, ...entry };
  });
  if (changed) writeChallengeFile(file, varName, updated);
}

console.log(`Aplicado: ${applied} ações classificadas.`);
console.log(byType);
if (remaining.size > 0) {
  console.warn('\nAVISO — títulos nas regras que não bateram com nenhum desafio (revisar):');
  for (const t of remaining) console.warn(`  - ${t}`);
}
