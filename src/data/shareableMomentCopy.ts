import { APP_NAME, APP_STORE_URL } from '@/constants/app';
import type { ChallengeCategory, ChallengeInstance } from '@/types';

// "Cards compartilháveis" — só faz sentido pra categorias com carga emocional/humana real (mesmo
// critério de antes: rotina_organizacao/trabalho_financas/casa_ambiente ficam de fora de
// propósito — organizar uma gaveta ou revisar uma conta não é o tipo de momento que alguém quer
// compartilhar, mesmo tendo gostado de ter feito).
const SHAREABLE_CATEGORIES: ReadonlySet<ChallengeCategory> = new Set([
  'relacionamentos',
  'familia',
  'aprendizado_desenvolvimento',
  'saude_bemestar',
  'criatividade_cultura',
  'experiencias_lazer',
  'fe_espiritualidade',
]);

/** Gatilho: reagir "❤️ Fez muito bem" a uma ação de categoria compartilhável (ver
 * SHAREABLE_CATEGORIES) — sinal voluntário e explícito, não "qualquer reação positiva" (ver
 * ChallengeCard/ReactionPicker). Reativado depois de ficar dormente na remoção de Concluir/Não
 * consegui: o gatilho original ("concluída + reação positiva") não existia mais até o
 * ReactionPicker voltar com `completedAt` acoplado à reação. */
export function isShareableMoment(instance: ChallengeInstance): boolean {
  return instance.reaction === 'fez_muito_bem' && SHAREABLE_CATEGORIES.has(instance.categoria);
}

// Verbo no imperativo (como o catálogo escreve as ações, ver src/data/challenges/*.ts) → primeira
// pessoa do pretérito perfeito — vira a abertura do card ("Liguei..." em vez de "Ligue..."). Cobre
// os verbos mais comuns usados como primeira palavra das ações. Ação cujo primeiro verbo não está
// aqui usa o fallback genérico em buildShareableHeadline — nunca quebra, só fica menos específico.
const IMPERATIVE_TO_FIRST_PERSON: Record<string, string> = {
  ligue: 'liguei',
  pergunte: 'perguntei',
  envie: 'enviei',
  mande: 'mandei',
  converse: 'conversei',
  convide: 'convidei',
  agradeça: 'agradeci',
  elogie: 'elogiei',
  parabenize: 'parabenizei',
  ensine: 'ensinei',
  responda: 'respondi',
  cumprimente: 'cumprimentei',
  informe: 'informei',
  avise: 'avisei',
  chame: 'chamei',
  diga: 'disse',
  compartilhe: 'compartilhei',
  incentive: 'incentivei',
  visite: 'visitei',
  escreva: 'escrevi',
  anote: 'anotei',
  pense: 'pensei',
  reflita: 'refleti',
  identifique: 'identifiquei',
  nomeie: 'nomeei',
  lembre: 'lembrei',
  relembre: 'relembrei',
  reconheça: 'reconheci',
  releia: 'reli',
  organize: 'organizei',
  confira: 'conferi',
  verifique: 'verifiquei',
  limpe: 'limpei',
  separe: 'separei',
  guarde: 'guardei',
  prepare: 'preparei',
  ajuste: 'ajustei',
  defina: 'defini',
  marque: 'marquei',
  coloque: 'coloquei',
  divida: 'dividi',
  resolva: 'resolvi',
  planeje: 'planejei',
  beba: 'bebi',
  caminhe: 'caminhei',
  levante: 'levantei',
  alongue: 'alonguei',
  respire: 'respirei',
  dance: 'dancei',
  fique: 'fiquei',
  evite: 'evitei',
  passe: 'passei',
  aproveite: 'aproveitei',
  use: 'usei',
  tome: 'tomei',
  coma: 'comi',
  durma: 'dormi',
  acorde: 'acordei',
  adicione: 'adicionei',
  faça: 'fiz',
  escolha: 'escolhi',
  ore: 'orei',
  ajude: 'ajudei',
  ouça: 'ouvi',
  deixe: 'deixei',
  experimente: 'experimentei',
  aceite: 'aceitei',
  termine: 'terminei',
  comece: 'comecei',
  reserve: 'reservei',
  dedique: 'dediquei',
  celebre: 'celebrei',
  perdoe: 'perdoei',
  pesquise: 'pesquisei',
  descubra: 'descobri',
  conheça: 'conheci',
  aprenda: 'aprendi',
  suba: 'subi',
  abra: 'abri',
};

// Casos em que a troca automática do verbo (ver buildShareableHeadline) fica gramaticalmente
// errada e não dá pra consertar com uma regra genérica — override manual do texto final, sem
// pontuação no fim (ela é adicionada depois, ver buildShareableCardText). Hoje só a ação fixa da
// primeira ação (única fora do catálogo, sempre a mesma pra todo mundo — ver
// src/data/firstActionChallenge.ts); se outra ação do catálogo aparecer errada no futuro, é aqui
// que entra o ajuste, em vez de tentar automatizar toda regra gramatical do português.
const SHAREABLE_HEADLINE_OVERRIDES: Record<string, string> = {
  first_action_fixed: 'Escrevi como eu estava me sentindo sem julgar',
};

/** Reescreve o começo da frase pra primeira pessoa quando reconhece o verbo (ver mapa acima); caso
 * contrário, mantém o texto original como complemento de uma abertura genérica — nunca falha.
 * Só minúsculas + tira pontuação; NÃO remove acentos (o mapa usa "faça"/"agradeça" com cedilha/til
 * de propósito, senão a busca nunca bate). */
function buildShareableHeadline(instance: ChallengeInstance): string {
  const override = SHAREABLE_HEADLINE_OVERRIDES[instance.challengeId];
  if (override) return override;

  const withoutPeriod = instance.titulo.trim().replace(/\.+$/, '');
  const words = withoutPeriod.split(/\s+/);
  const firstWordKey = (words[0] ?? '').toLowerCase().replace(/[^a-zà-úçã]/g, '');
  const conjugated = IMPERATIVE_TO_FIRST_PERSON[firstWordKey];
  const remainder = words.slice(1).join(' ');
  // Frases que continuam se referindo à pessoa em 2ª pessoa depois do verbo ("...você está...",
  // "...se sentindo...") não podem só trocar o verbo — o resto da frase fica quebrado (ex: "Escrevi
  // como VOCÊ está se sentindo"). Nesses casos cai no fallback genérico abaixo, que nunca erra
  // porque não tenta reescrever o resto da frase, só a cita.
  const looksSecondPerson = /\bvoc[eê]\b/i.test(remainder) || /^se\s/i.test(remainder);
  if (conjugated && words.length > 1 && !looksSecondPerson) {
    return `${conjugated} ${remainder}`;
  }
  return `hoje eu topei: ${withoutPeriod.charAt(0).toLowerCase()}${withoutPeriod.slice(1)}`;
}

function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

interface ReflectionRule {
  keywords: string[]; // qualquer uma bate (substring, texto sem acento)
  line: string;
}

/**
 * Reflexão específica do que a ação realmente foi — não uma frase única fixa por categoria
 * aplicada em tudo, o que não faz sentido pra ações bem diferentes dentro da mesma categoria (ex:
 * pedir desculpas ≠ ligar pra alguém que você não fala há tempos). Cada categoria tem várias
 * regras, checadas em ordem (mais específica primeiro); a primeira cujo padrão aparece no
 * título/descrição da ação vence. Sempre existe um fallback por categoria — nunca fica sem frase.
 */
const REFLECTION_RULES: Record<ChallengeCategory, ReflectionRule[]> = {
  relacionamentos: [
    { keywords: ['nao fala ha', 'ha algum tempo', 'ha tempos', 'antigo', 'reconecte', 'perdido contato', 'distante'], line: 'Não precisava de um motivo. Só precisava lembrar dessa pessoa — e o resultado foi muito bom.' },
    { keywords: ['te amo', 'eu te amo', 'amo ela', 'amo ele'], line: 'Nem sempre a gente diz o que sente. Hoje eu disse — e isso já valeu o dia.' },
    { keywords: ['desculp', 'magoa', 'reconcilia', 'perdao', 'erro sem tentar'], line: 'Não foi fácil, mas resolver isso valeu a pena.' },
    { keywords: ['elogie', 'elogio', 'reconheca o esforco', 'reconheca uma', 'parabenize', 'credito', 'agradec'], line: 'Um reconhecimento sincero custa pouco e faz diferença enorme pra quem recebe.' },
    { keywords: ['ouca', 'escute', 'sem interromper', 'atencao exclusiva', 'atencao total'], line: 'Só escutar de verdade já mudou a conversa.' },
    { keywords: ['pergunte', 'como foi', 'como esta', 'como voce pode'], line: 'Uma pergunta simples, feita de verdade, já abre espaço pra conexão.' },
    { keywords: ['ajude', 'ofereca ajuda', 'assuma uma tarefa'], line: 'Uma mão que aliviou o dia de alguém, sem cobrar nada em troca.' },
    { keywords: ['surpresa', 'bilhete', 'gentileza sem avisar'], line: 'Pequeno, simples, e ainda assim fez o dia de alguém melhor.' },
  ],
  familia: [
    { keywords: ['brinque', 'brincadeira', 'faz de conta', 'quebra-cabeca', 'jogo de tabuleiro'], line: 'Um tempo simples de brincadeira que vale mais do que parece.' },
    { keywords: ['refeicao', 'jantar', 'almoco', 'cafe da manha', 'lanche'], line: 'Uma refeição em família, sem pressa — isso também é cuidado.' },
    { keywords: ['ajude', 'tarefa domestica', 'guarde', 'organize', 'arrume'], line: 'Uma ajuda pequena que aliviou o dia de alguém em casa.' },
    { keywords: ['pergunte', 'como foi', 'conte uma', 'ouca uma historia'], line: 'Uma conversa simples que aproximou a gente um pouco mais.' },
    { keywords: ['celular', 'sem tela', 'sem celulares'], line: 'Um momento sem distração — e isso já fez diferença.' },
  ],
  fe_espiritualidade: [
    { keywords: ['leia', 'salmo', 'versiculo', 'proverbios', 'evangelho'], line: 'Um momento de leitura que trouxe calma pro meu dia.' },
    { keywords: ['ore', 'oracao', 'reserve tres minutos para falar com deus'], line: 'Um momento de oração no meio da correria — fez diferença.' },
    { keywords: ['agradeca', 'grato', 'gratidao'], line: 'Parar pra agradecer mudou meu jeito de ver o dia.' },
    { keywords: ['perdoe', 'perdao'], line: 'Perdoar (ou pedir perdão) alivia mais do que a gente imagina.' },
    { keywords: ['gentileza', 'ajude', 'apoio'], line: 'Colocar minha fé em prática, de um jeito bem simples.' },
  ],
  aprendizado_desenvolvimento: [
    { keywords: ['escreva', 'anote', 'reflita', 'nomeie o que'], line: 'Escrever sobre isso me ajudou a organizar a cabeça.' },
    { keywords: ['medo', 'inseguranca', 'vergonha', 'evita por'], line: 'Não foi fácil, mas fiz mesmo com um pouco de medo — e isso já é vitória.' },
    { keywords: ['celular', 'sem redes sociais', 'sem estimulo digital', 'sem tela'], line: 'Um respiro sem tela que rendeu mais do que eu esperava.' },
    { keywords: ['pesquise', 'descubra', 'aprenda uma curiosidade', 'conheca'], line: 'Fui atrás de uma curiosidade e valeu o minuto investido.' },
    { keywords: ['aprenda uma palavra', 'idioma', 'frase em outro'], line: 'Uma palavra nova a mais no repertório — pequeno, mas soma.' },
    { keywords: ['ensine', 'explique'], line: 'Explicar pra alguém me ajudou a entender ainda melhor.' },
  ],
  saude_bemestar: [
    { keywords: ['agua', 'hidrat'], line: "Só um copo d'água, mas meu corpo agradeceu." },
    { keywords: ['alongamento', 'alongue', 'movimento', 'caminhe', 'caminhada', 'agachamento', 'dance', 'suba'], line: 'Um minutinho de movimento que já mudou meu humor.' },
    { keywords: ['durma', 'sono', 'descanso', 'dormir'], line: 'Cuidar do meu sono também é cuidar de mim.' },
    { keywords: ['respire', 'respiracao', 'pausa'], line: 'Uma pausa curta, mas que baixou a poeira do dia.' },
  ],
  criatividade_cultura: [
    { keywords: ['ideia', 'comecou algo criativo', 'gostaria de criar'], line: 'Deixei uma ideia sair da cabeça e virar algo real, mesmo que pequeno.' },
    { keywords: ['escreva uma frase', 'escreva algumas linhas', 'escreva uma pequena historia', 'escreva uma mensagem', 'anote uma frase'], line: 'Colocar isso no papel deixou o momento mais real.' },
    { keywords: ['foto', 'fotografia'], line: 'Uma lembrança que agora tem uma frase pra acompanhar.' },
    { keywords: ['obra de arte', 'museu', 'galeria', 'artista'], line: 'Um mergulho rápido em algo criado por outra pessoa — e valeu.' },
    { keywords: ['manifestacao cultural', 'tradicao', 'patrimonio'], line: 'Conhecer um pouco mais da cultura ao meu redor (ou de outro lugar) valeu o tempo.' },
  ],
  experiencias_lazer: [
    { keywords: ['visite um lugar', 'lugar da sua cidade', 'nunca esteve', 'nunca visitou', 'nunca conheceu'], line: 'Descobri um cantinho novo bem perto de mim.' },
    { keywords: ['caminho diferente', 'mude de ambiente', 'saia de casa'], line: 'Só mudar o cenário já deu um respiro diferente pro dia.' },
    { keywords: ['passeio', 'viagem curta', 'passear'], line: 'Um passeio simples, sem grandes planos — e foi exatamente o que eu precisava.' },
    { keywords: ['por prazer', 'gostava de fazer', 'nao faz ha algum tempo'], line: 'Fazer algo só porque eu queria, sem nenhum motivo além disso.' },
    { keywords: ['pausa para aproveitar', 'passa despercebido'], line: 'Parei pra notar algo que normalmente eu nem veria.' },
  ],
  rotina_organizacao: [],
  trabalho_financas: [],
  casa_ambiente: [],
};

// Fallback por categoria — cobre qualquer ação cujo texto não bateu em nenhuma regra acima. Nunca
// fica sem frase, só fica menos específico.
const FALLBACK_REFLECTION_BY_CATEGORY: Record<ChallengeCategory, string> = {
  relacionamentos: 'Foi simples, mas fortaleceu um laço que vale a pena cuidar.',
  familia: 'Foi rápido, mas valeu o dia inteiro.',
  fe_espiritualidade: 'Um minuto de pausa que valeu o dia todo.',
  aprendizado_desenvolvimento: 'Um passo pequeno, mas que senti de verdade.',
  saude_bemestar: 'Nada demais, só um cuidado a mais comigo mesmo.',
  criatividade_cultura: 'Pequeno, mas foi bom deixar a criatividade (ou a curiosidade) falar mais alto.',
  experiencias_lazer: 'Foi simples, mas mudou o ritmo do meu dia.',
  rotina_organizacao: '',
  trabalho_financas: '',
  casa_ambiente: '',
};

// Frase final citando o app — sempre presente, varia só por categoria, não por ação específica.
const APP_BENEFIT_LINE_BY_CATEGORY: Record<ChallengeCategory, string> = {
  relacionamentos: `🌱 O ${APP_NAME} me lembrou de cuidar desse laço.`,
  familia: `🌱 O ${APP_NAME} me lembrou de estar mais presente.`,
  fe_espiritualidade: `🌱 O ${APP_NAME} me lembrou de parar e agradecer.`,
  aprendizado_desenvolvimento: `🌱 O ${APP_NAME} me lembrou de cuidar de mim e aprender algo novo.`,
  saude_bemestar: `🌱 O ${APP_NAME} me lembrou disso hoje.`,
  criatividade_cultura: `🌱 O ${APP_NAME} me lembrou de dar espaço pra criatividade.`,
  experiencias_lazer: `🌱 O ${APP_NAME} me lembrou de viver algo diferente hoje.`,
  rotina_organizacao: `🌱 O ${APP_NAME} me ajudou a organizar isso hoje.`,
  trabalho_financas: `🌱 O ${APP_NAME} me ajudou a organizar isso hoje.`,
  casa_ambiente: `🌱 O ${APP_NAME} me ajudou a cuidar do meu espaço hoje.`,
};

/** Escolhe a reflexão mais específica pro texto real da ação (título + descrição) — primeira
 * regra da categoria cujo padrão aparece no texto vence; sem nenhuma batida, usa o fallback da
 * categoria. `rotina_organizacao`/`trabalho_financas`/`casa_ambiente` nunca chegam aqui de verdade
 * (fora de `SHAREABLE_CATEGORIES`), mas ficam com fallback vazio por segurança de tipos. */
function pickReflectionLine(instance: ChallengeInstance): string {
  const haystack = stripAccents(`${instance.titulo} ${instance.descricao ?? ''}`);
  const rules = REFLECTION_RULES[instance.categoria] ?? [];
  for (const rule of rules) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) return rule.line;
  }
  return FALLBACK_REFLECTION_BY_CATEGORY[instance.categoria];
}

/** Texto do card mostrado na tela (ver ShareableMomentCard.tsx) — primeira linha em 1ª pessoa +
 * reflexão específica da ação (não uma frase única fixa por categoria, ver pickReflectionLine) +
 * linha de fechamento com o benefício do app. */
export function buildShareableCardText(instance: ChallengeInstance): string {
  const headline = buildShareableHeadline(instance);
  const capitalized = headline.charAt(0).toUpperCase() + headline.slice(1);
  const reflection = pickReflectionLine(instance);
  const appBenefit = APP_BENEFIT_LINE_BY_CATEGORY[instance.categoria];
  return `${capitalized}.\n\n${reflection} ${appBenefit}`;
}

/** Texto enviado pro `Share.share` nativo — mesmo texto do card + link da loja. */
export function buildShareableMessage(instance: ChallengeInstance): string {
  return `${buildShareableCardText(instance)}\n\n${APP_STORE_URL}`;
}
