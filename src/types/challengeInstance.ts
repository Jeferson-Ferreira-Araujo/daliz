import type { ChallengeActionKind, ChallengeCategory, ChallengeTimingConfig } from './challenge';
import type { Interest } from './interests';

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
  // ver plano de migração seção 1/4). Só `deliveredAt` é populado hoje, no envio; os outros três
  // ficam presentes na estrutura pra quando o produto decidir o que "concluir" significa nesse
  // modelo novo — nada no app lê nem escreve neles ainda.
  deliveredAt: string | null;
  completedAt: string | null;
  dismissedAt: string | null;
  skippedAt: string | null;

  timeToCompleteMs?: number | null; // nunca populado no v1 (nada escreve completedAt ainda)
  notificationId: string | null;
  // O que a pessoa escreveu, quando a ação pede uma anotação (ver ChallengeCard.asksToWrite).
  note?: string | null;
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
