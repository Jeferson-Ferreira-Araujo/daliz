import type { ChallengeActionKind, ChallengeCategory, ChallengeTimingConfig } from './challenge';
import type { Interest } from './interests';

// Como a ação fez a pessoa se sentir — independente de status de conclusão obrigatório (não
// existe mais botão de Concluir/Não consegui, ver plano de migração seção 4). Opcional e a
// qualquer momento: a pessoa marca se quiser. Mas marcar UMA reação, qualquer que seja, é hoje o
// próprio sinal de que a ação foi feita — grava `completedAt` (ver challengeActionsService.setReaction).
export type ChallengeReaction = 'fez_muito_bem' | 'foi_bom' | 'foi_normal' | 'nao_fez_diferenca' | 'foi_dificil';

export const CHALLENGE_REACTION_LABELS: Record<ChallengeReaction, string> = {
  fez_muito_bem: 'Fez muito bem',
  foi_bom: 'Foi bom',
  foi_normal: 'Foi normal',
  nao_fez_diferenca: 'Não fez muita diferença',
  foi_dificil: 'Foi difícil',
};

export interface ChallengeInstance {
  id: string;
  challengeId: string;
  categoria: ChallengeCategory;
  titulo: string;
  descricao?: string;
  tempoEstimado: number; // já resolvido em minutos na criação (ver EFFORT_TIME_MINUTES em ChallengeEngine)
  // Copiado do desafio no momento da seleção (achatado a partir de interests.required+preferred) —
  // permite ao motor aprender afinidade por interesse a partir do histórico real, igual já faz por categoria.
  interests: Interest[];
  // Pessoa importante escolhida pelo motor pra esse desafio, se houver (ver
  // ChallengeEngine.selectPersonForChallenge) — permite rastrear "última vez que
  // apareceu algo sobre essa pessoa" e afinidade por tipo de relação, sem guardar
  // nome/dados sensíveis aqui além do id já usado em UserProfile.importantPeople.
  relatedPersonId: string | null;
  date: string; // "YYYY-MM-DD" — dia do período acordado a que pertence
  scheduledFor: string; // ISO datetime — horário planejado da notificação

  // Histórico orientado a eventos (substitui sentAt + status + reaction + abandonReason —
  // ver plano de migração seção 1/4). `deliveredAt` é populado no envio. `completedAt` é
  // populado quando a pessoa marca QUALQUER reação (ver `reaction` abaixo e
  // challengeActionsService.setReaction) — reagir é o sinal de "feito", não um botão à parte.
  // `dismissedAt`/`skippedAt` continuam presentes na estrutura pra uso futuro; nada escreve
  // neles ainda.
  deliveredAt: string | null;
  completedAt: string | null;
  dismissedAt: string | null;
  skippedAt: string | null;

  timeToCompleteMs?: number | null; // nunca populado (sem instante de "início" da ação pra medir)
  notificationId: string | null;
  // O que a pessoa escreveu, quando a ação pede uma anotação (ver ChallengeCard.asksToWrite).
  note?: string | null;
  // Como a ação fez a pessoa se sentir (ver ReactionPicker) — opcional, marcável/trocável a
  // qualquer momento. null/ausente = ainda não marcou (também = `completedAt` ainda null).
  reaction?: ChallengeReaction | null;
  // Timing resolvido no momento em que a instância foi criada (ver buildInstance) — congelado,
  // não recalcula se o catálogo mudar depois.
  timing?: ChallengeTimingConfig;
  // Tipo resolvido no momento em que a instância foi criada — mesmo padrão de `timing`: congelado,
  // sem normalização no repositório; instâncias antigas sem esse campo usam getInstanceActionKind
  // (src/data/challenges/index.ts) como fallback ('acao').
  type?: ChallengeActionKind;
  // Lembrete ativo pra essa instância ("Lembrar mais tarde", ver reminderService.ts) — continua
  // existindo independente da remoção de Concluir/Não consegui (é sobre reagendar quando o momento
  // é ruim, não sobre completar). null/ausente = nenhum lembrete agendado agora.
  reminder?: ChallengeReminder | null;
  reminderCount?: number;
  // Copiados do Challenge no momento da seleção — congelados na criação. Sistema de progressão
  // adaptativa desativado (ver comentário em Challenge.concept), campos mantidos pra reativação
  // futura.
  conceptGroup?: string;
  progressionGroup?: string;
  difficulty?: number;
}

export type ReminderType = '1_hour' | '3_hours' | 'custom';

export interface ChallengeReminder {
  scheduledFor: string; // ISO datetime
  notificationId: string | null; // null no preview web (expo-notifications não funciona lá)
  createdAt: string; // ISO datetime
  type: 'one_time'; // único tipo hoje — reservado pra tipos futuros (recorrente etc.)
}
