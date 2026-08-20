import type { Challenge, ChallengeTiming } from '@/types';

export const TIMING_LABELS: Record<ChallengeTiming, string> = {
  now: '⚡ AGORA',
  today: '☀️ HOJE',
  contextual: '⏳ QUANDO FIZER SENTIDO',
};

// Legenda mostrada no card enquanto a ação está pendente — explica a proposta do timing sem
// linguagem de prazo/produtividade (ver seção 2/17 do pedido: "não são níveis de prioridade").
export const TIMING_DESCRIPTIONS: Record<ChallengeTiming, string> = {
  now: 'Faça neste momento.',
  today: 'Você pode fazer isso em qualquer momento até o fim do dia.',
  contextual: 'Não precisa fazer agora. Espere o momento adequado acontecer.',
};

// Título da notificação (ver notificationService.ts) — só o tipo (AGORA/HOJE/QUANDO FIZER
// SENTIDO), sem o nome do app (já aparece no cabeçalho do sistema operacional) e sem o conteúdo
// da ação em si, pra gerar curiosidade de abrir o app.
export const TIMING_NOTIFICATION_TITLE: Record<ChallengeTiming, string> = TIMING_LABELS;

// Corpo da notificação: nunca revela a ação real (instance.descricao) — só um gancho de
// curiosidade coerente com o timing, pra incentivar abrir o app em vez de já entregar tudo na
// tela de bloqueio. Várias variantes por timing (mesmo espírito das REFLEXÃO_RULES em
// shareableMomentCopy.ts) pra não repetir a mesma frase notificação após notificação.
const TIMING_NOTIFICATION_TEASERS: Record<ChallengeTiming, string[]> = {
  now: [
    'É rapidinho. Abra agora e veja o que preparamos pra este momento.',
    'Uma ação rápida está esperando por você. Toque para descobrir qual é.',
    'Cabe agora mesmo. Abra pra ver do que se trata.',
  ],
  today: [
    'Uma nova ação chegou pra você viver hoje. Abra para descobrir qual é.',
    'Preparamos algo pra você hoje. Toque para ver o que é.',
    'Sua próxima ação já está disponível — abra para descobrir.',
  ],
  contextual: [
    'Guarde isso pro momento certo. Abra agora para saber do que se trata.',
    'Quando fizer sentido, você vai saber o que fazer. Toque para descobrir.',
    'Uma ação está esperando o momento certo — abra para ver qual é.',
  ],
};

export function pickNotificationTeaser(timing: ChallengeTiming): string {
  const options = TIMING_NOTIFICATION_TEASERS[timing];
  return options[Math.floor(Math.random() * options.length)];
}

// Corpo da notificação de sugestão (actionKind 'sugestao', ver notificationService.ts) — mesmo
// espírito de TIMING_NOTIFICATION_TEASERS: nunca revela o texto da sugestão na tela de bloqueio,
// só um gancho pra abrir o app. Diferente da ação, aqui não existe "timing" pra variar o gancho
// por (sugestão não tem AGORA/HOJE/QUANDO FIZER SENTIDO) — uma lista única.
const SUGGESTION_NOTIFICATION_TEASERS = [
  'Temos uma orientação pra este momento. Abra o app para ver qual é.',
  'Uma sugestão pra agora está esperando por você no app.',
  'Preparamos algo pra você pensar agora. Toque para ver.',
];

export function pickSuggestionNotificationTeaser(): string {
  return SUGGESTION_NOTIFICATION_TEASERS[Math.floor(Math.random() * SUGGESTION_NOTIFICATION_TEASERS.length)];
}

// Gatilhos situacionais explícitos ("quando X acontecer, faça Y") — checados primeiro por serem
// o padrão mais específico e menos ambíguo dos três timings.
const CONTEXTUAL_PREFIXES = [
  'quando ',
  'na proxima vez que',
  'sempre que',
  'se perceber que',
  'assim que perceber',
  'ao perceber',
  'na proxima conversa',
  'na proxima oportunidade',
  'diante de uma decisao',
  'diante de uma situacao',
];

// Autorregulação/pausa que só faz sentido no momento — curada a partir dos exemplos do pedido e
// de desafios reais já existentes na base (ex: "Faça 5 respirações lentas.", "Solte os ombros e
// respire cinco vezes.").
const NOW_KEYWORDS = [
  'pausa',
  'respire',
  'respiracao',
  'respiracoes',
  'afaste-se da tela',
  'corrija sua postura',
  'solte os ombros',
  'interrompa',
  'antes de responder',
  'antes de reagir',
  'antes de decidir',
  'conscientemente',
  'neste momento',
  'agora mesmo',
  'alongue',
  'mobilidade',
];

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Classifica um desafio sem `timing` explícito, a partir do texto — mesmo espírito do
 * `asksToWrite` em ChallengeCard.tsx e dos heurísticos de scripts/challengeHeuristics.js, só que
 * em runtime (uma vez, na montagem do catálogo — ver getChallengeTiming/allChallenges). Não
 * reclassifica os ~2.000 desafios à mão (fora de escopo desta etapa, ver plano) — default seguro
 * é 'today' quando nada bate, nunca quebra o app com um desafio sem timing.
 */
function classifyTiming(challenge: Challenge): ChallengeTiming {
  const text = normalize(`${challenge.titulo} ${challenge.descricao}`);

  if (CONTEXTUAL_PREFIXES.some((prefix) => text.includes(prefix))) return 'contextual';
  if (NOW_KEYWORDS.some((keyword) => text.includes(keyword))) return 'now';
  return 'today';
}

/** Timing efetivo de um desafio: explícito (autoria) > heurística de texto. */
export function getChallengeTiming(challenge: Challenge): ChallengeTiming {
  return challenge.timing ?? classifyTiming(challenge);
}
