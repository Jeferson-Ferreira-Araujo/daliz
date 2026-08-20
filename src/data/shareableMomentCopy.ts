import { APP_NAME, APP_STORE_URL } from '@/constants/app';
import type { ChallengeCategory, ChallengeInstance } from '@/types';

// "Cards compartilháveis" — só faz sentido pra categorias com carga emocional/humana real (ver
// pedido: "não seja pra tudo"). trabalho_produtividade/financas_consumo ficam de fora de propósito
// — organizar a mesa ou revisar uma assinatura não é o tipo de momento que alguém quer
// compartilhar, mesmo tendo gostado de ter feito.
const SHAREABLE_CATEGORIES: ReadonlySet<ChallengeCategory> = new Set([
  'relacionamentos',
  'familia_presenca',
  'bondade_comunidade',
  'fe_espiritualidade',
  'desenvolvimento_pessoal',
  'saude_energia',
  'aprendizado_curiosidade',
]);

/** Dormente desde a remoção de Concluir/Não consegui (ver plano de migração seção 4) — o gatilho
 * original era "concluída + reação positiva", sinal que não existe mais. Sempre `false` por
 * enquanto (nunca gera card), sem apagar a lógica de texto abaixo (buildShareableCardText etc),
 * que pode ser reaproveitada se um novo sinal voluntário for definido no futuro. */
export function isShareableMoment(instance: ChallengeInstance): boolean {
  void instance;
  return false;
}

// Verbo no imperativo (como o catálogo escreve as ações, ver src/data/challenges/*.ts) → primeira
// pessoa do pretérito perfeito — vira a abertura do card ("Liguei..." em vez de "Ligue..."). Cobre
// os verbos mais comuns usados como primeira palavra das ações (mesmos verbos categorizados em
// scripts/challengeHeuristics.js). Ação cujo primeiro verbo não está aqui usa o fallback genérico
// em buildShareableHeadline — nunca quebra, só fica menos específico.
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
 * contrário, mantém o texto original como complemento de um abertura genérica — nunca falha.
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
 * Reflexão específica do que a ação realmente foi — a parte que antes era uma frase única fixa
 * por categoria ("Não precisava de um motivo...") aplicada em tudo, o que não fazia sentido pra
 * ações bem diferentes dentro da mesma categoria (ex: pedir desculpas ≠ ligar pra alguém que você
 * não fala há tempos). Cada categoria tem várias regras, checadas em ordem (mais específica
 * primeiro); a primeira cujo padrão aparece no título/descrição da ação vence. Sempre existe um
 * fallback por categoria — nunca fica sem frase.
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
  familia_presenca: [
    { keywords: ['brinque', 'brincadeira', 'faz de conta', 'quebra-cabeca', 'jogo de tabuleiro'], line: 'Um tempo simples de brincadeira que vale mais do que parece.' },
    { keywords: ['refeicao', 'jantar', 'almoco', 'cafe da manha', 'lanche'], line: 'Uma refeição em família, sem pressa — isso também é cuidado.' },
    { keywords: ['ajude', 'tarefa domestica', 'guarde', 'organize', 'arrume'], line: 'Uma ajuda pequena que aliviou o dia de alguém em casa.' },
    { keywords: ['pergunte', 'como foi', 'conte uma', 'ouca uma historia'], line: 'Uma conversa simples que aproximou a gente um pouco mais.' },
    { keywords: ['celular', 'sem tela', 'sem celulares'], line: 'Um momento sem distração — e isso já fez diferença.' },
  ],
  bondade_comunidade: [
    { keywords: ['desconhecido', 'gentileza sem esperar', 'estranho'], line: 'Pequeno gesto, mas fez diferença pra alguém que talvez eu nunca mais veja.' },
    { keywords: ['agradec', 'cumprimente', 'reconheca o trabalho', 'elogie um trabalhador'], line: 'Um "obrigado" sincero pra quem normalmente ninguém agradece.' },
    { keywords: ['doe', 'doacao', 'separe uma roupa', 'separe um livro', 'separe um alimento'], line: 'Algo parado aqui pode fazer muita diferença pra outra pessoa.' },
    { keywords: ['ajude', 'ofereca ajuda', 'carregar'], line: 'Uma ajuda rápida que talvez tenha salvado o dia de alguém.' },
  ],
  fe_espiritualidade: [
    { keywords: ['leia', 'salmo', 'versiculo', 'proverbios', 'evangelho'], line: 'Um momento de leitura que trouxe calma pro meu dia.' },
    { keywords: ['ore', 'oracao', 'reserve tres minutos para falar com deus'], line: 'Um momento de oração no meio da correria — fez diferença.' },
    { keywords: ['agradeca', 'grato', 'gratidao'], line: 'Parar pra agradecer mudou meu jeito de ver o dia.' },
    { keywords: ['perdoe', 'perdao'], line: 'Perdoar (ou pedir perdão) alivia mais do que a gente imagina.' },
  ],
  desenvolvimento_pessoal: [
    { keywords: ['escreva', 'anote', 'reflita', 'nomeie o que'], line: 'Escrever sobre isso me ajudou a organizar a cabeça.' },
    { keywords: ['medo', 'inseguranca', 'vergonha', 'evita por'], line: 'Não foi fácil, mas fiz mesmo com um pouco de medo — e isso já é vitória.' },
    { keywords: ['celular', 'sem redes sociais', 'sem estimulo digital', 'sem tela'], line: 'Um respiro sem tela que rendeu mais do que eu esperava.' },
    { keywords: ['aprenda', 'experimente algo novo', 'coisa nova'], line: 'Só de tentar algo diferente já valeu a pena.' },
  ],
  saude_energia: [
    { keywords: ['agua', 'hidrat'], line: "Só um copo d'água, mas meu corpo agradeceu." },
    { keywords: ['alongamento', 'alongue', 'movimento', 'caminhe', 'caminhada', 'agachamento'], line: 'Um minutinho de movimento que já mudou meu humor.' },
    { keywords: ['durma', 'sono', 'descanso', 'dormir'], line: 'Cuidar do meu sono também é cuidar de mim.' },
    { keywords: ['respire', 'respiracao', 'pausa'], line: 'Uma pausa curta, mas que baixou a poeira do dia.' },
  ],
  aprendizado_curiosidade: [
    { keywords: ['pesquise', 'descubra'], line: 'Fui atrás de uma curiosidade e valeu o minuto investido.' },
    { keywords: ['aprenda uma palavra', 'idioma', 'frase em outro'], line: 'Uma palavra nova a mais no repertório — pequeno, mas soma.' },
    { keywords: ['ensine', 'explique'], line: 'Explicar pra alguém me ajudou a entender ainda melhor.' },
  ],
  trabalho_produtividade: [],
  financas_consumo: [],
};

// Fallback por categoria — cobre qualquer ação cujo texto não bateu em nenhuma regra acima. Nunca
// fica sem frase, só fica menos específico.
const FALLBACK_REFLECTION_BY_CATEGORY: Record<ChallengeCategory, string> = {
  relacionamentos: 'Foi simples, mas fortaleceu um laço que vale a pena cuidar.',
  familia_presenca: 'Foi rápido, mas valeu o dia inteiro.',
  bondade_comunidade: 'Pequeno gesto, mas fez diferença pra alguém hoje.',
  fe_espiritualidade: 'Um minuto de pausa que valeu o dia todo.',
  desenvolvimento_pessoal: 'Um passo pequeno, mas que senti de verdade.',
  saude_energia: 'Nada demais, só um cuidado a mais comigo mesmo.',
  aprendizado_curiosidade: 'Só um minuto, mas já valeu a curiosidade.',
  trabalho_produtividade: '',
  financas_consumo: '',
};

// Frase final citando o app — sempre presente (ver pedido original: "sempre mostrando os
// benefícios que o app trouxe"), varia só por categoria, não por ação específica.
const APP_BENEFIT_LINE_BY_CATEGORY: Record<ChallengeCategory, string> = {
  relacionamentos: `🌱 O ${APP_NAME} me lembrou de cuidar desse laço.`,
  familia_presenca: `🌱 O ${APP_NAME} me lembrou de estar mais presente.`,
  bondade_comunidade: `🌱 O ${APP_NAME} me lembrou de ser gentil hoje.`,
  fe_espiritualidade: `🌱 O ${APP_NAME} me lembrou de parar e agradecer.`,
  desenvolvimento_pessoal: `🌱 O ${APP_NAME} me lembrou de cuidar de mim.`,
  saude_energia: `🌱 O ${APP_NAME} me lembrou disso hoje.`,
  aprendizado_curiosidade: `🌱 O ${APP_NAME} me lembrou de aprender algo novo.`,
  trabalho_produtividade: `🌱 O ${APP_NAME} me ajudou a organizar isso hoje.`,
  financas_consumo: `🌱 O ${APP_NAME} me ajudou a cuidar disso hoje.`,
};

/** Escolhe a reflexão mais específica pro texto real da ação (título + descrição) — primeira
 * regra da categoria cujo padrão aparece no texto vence; sem nenhuma batida, usa o fallback da
 * categoria. `trabalho_produtividade`/`financas_consumo` nunca chegam aqui de verdade (fora de
 * `SHAREABLE_CATEGORIES`), mas ficam com fallback vazio por segurança de tipos. */
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

/** Texto enviado pro `Share.share` nativo — mesmo texto do card + link da loja, mesmo padrão já
 * usado em app/(main)/(tabs)/profile.tsx (handleShare). */
export function buildShareableMessage(instance: ChallengeInstance): string {
  return `${buildShareableCardText(instance)}\n\n${APP_STORE_URL}`;
}
