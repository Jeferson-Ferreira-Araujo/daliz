import type { Challenge } from '@/types';

/**
 * Ação fixa, sempre a mesma pra todo mundo, mostrada assim que a pessoa toca em "Receber minha
 * primeira ação" (ver app/onboarding/first-action.tsx e dayCycleService.requestFirstAction).
 * Deliberadamente fora do catálogo normal (src/data/challenges/*) — nunca é sorteada de novo
 * pelo motor, não tem cooldown/histórico de repetição, e sua escolha não é feita pelo
 * ChallengeEngine. A ideia: antes de qualquer personalização baseada nas respostas do cadastro,
 * a primeira impressão do app precisa ensinar o que ele é — escrever sobre um sentimento, sem
 * julgamento — de um jeito que funciona pra qualquer pessoa, em qualquer hora, em qualquer lugar.
 * O título começa com "Escreva" de propósito: a heurística `asksToWrite` do ChallengeCard já
 * mostra o campo de anotação pra esse texto, sem precisar de nenhuma lógica nova.
 */
export const FIRST_ACTION_CHALLENGE: Challenge = {
  id: 'first_action_fixed',
  categoria: 'desenvolvimento_pessoal',
  titulo: 'Escreva como você está se sentindo agora, sem julgar — só nomear já ajuda.',
  descricao: 'Escreva como você está se sentindo agora, sem julgar — só nomear já ajuda.',
  tempoEstimado: 3,
  nivel: 'facil',
  tipo: 'reflexao',
  horariosIdeais: ['qualquer'],
  diasIdeais: 'qualquer',
  tags: ['primeira_acao', 'sentimento', 'escrita'],
  momentos: ['qualquer'],
  tiposDia: ['qualquer'],
  contexto: ['qualquer'],
  // Explícito (não deixado pra heurística): é uma reflexão sem urgência, não uma pausa "now" nem
  // depende de situação — e por ser sempre a primeira impressão do app, mantém o tom leve.
  timing: { mode: 'today', preferredPeriods: [], avoidPeriods: [] },
};
