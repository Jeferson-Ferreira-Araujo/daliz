import type { ChallengeActionKind, ChallengeCategory, ChallengeTiming } from './challenge';
import type { Interest } from './interests';

export type ChallengeInstanceStatus =
  | 'pendente'
  | 'concluido'
  | 'atrasado'
  | 'nao_concluido'
  | 'ignorado';

export type ChallengeReaction =
  | 'fez_muito_bem'
  | 'foi_bom'
  | 'foi_normal'
  | 'nao_fez_diferenca'
  | 'foi_dificil';

export type AbandonReason =
  | 'sem_tempo'
  | 'momento_inadequado'
  | 'esqueci'
  | 'nao_gostei'
  | 'foi_dificil'
  | 'nao_fez_sentido'
  | 'outro';

export interface ChallengeInstance {
  id: string;
  challengeId: string;
  categoria: ChallengeCategory;
  titulo: string;
  descricao: string;
  tempoEstimado: number;
  // Copiado do desafio no momento da seleção (ver buildInstance) — permite ao motor
  // aprender afinidade por interesse a partir do histórico real, igual já faz por categoria.
  interests: Interest[];
  // Pessoa importante escolhida pelo motor pra esse desafio, se houver (ver
  // ChallengeEngine.selectPersonForChallenge) — permite rastrear "última vez que
  // apareceu algo sobre essa pessoa" e afinidade por tipo de relação, sem guardar
  // nome/dados sensíveis aqui além do id já usado em UserProfile.importantPeople.
  relatedPersonId: string | null;
  date: string; // "YYYY-MM-DD" — dia do ciclo a que pertence
  sentAt: string; // ISO datetime — horário de envio/aparição
  scheduledFor: string; // ISO datetime — horário planejado da notificação
  completedAt: string | null; // ISO datetime
  timeToCompleteMs: number | null;
  status: ChallengeInstanceStatus;
  reaction: ChallengeReaction | null;
  abandonReason: AbandonReason | null;
  abandonReasonDetail: string | null; // usado quando abandonReason === 'outro'
  notificationId: string | null;
  // O que a pessoa escreveu, quando a ação pede uma anotação (ver ChallengeCard.asksToWrite).
  // Opcional (não `| null` obrigatório como os demais) porque challengeInstanceRepository não
  // normaliza instâncias antigas ao ler — quem lê trata a ausência com `instance.note ?? ''`.
  note?: string | null;
  // Timing resolvido no momento em que a instância foi criada (ver buildInstance) — congelado,
  // não recalcula se a heurística de classificação mudar depois. Mesmo padrão do `note`: sem
  // normalização no repositório, instâncias antigas sem esse campo usam getInstanceTiming
  // (src/data/challenges/index.ts) como fallback em vez de um default cru aqui.
  timing?: ChallengeTiming;
  // Tipo resolvido no momento em que a instância foi criada (ver buildInstance) — mesmo padrão de
  // `timing`: congelado, sem normalização no repositório; instâncias antigas sem esse campo usam
  // getInstanceActionKind (src/data/challenges/index.ts) como fallback ('acao') em vez de um
  // default cru aqui.
  actionKind?: ChallengeActionKind;
  // Lembrete ativo pra essa instância ("Lembrar mais tarde", ver reminderService.ts) — conceito
  // deliberadamente separado de `timing`: `timing` é quando a ação naturalmente faz sentido,
  // `reminder` é "a pessoa pediu pra ser avisada de novo nesse horário". null/ausente = nenhum
  // lembrete agendado agora. Nunca mais de um por instância — agendar um novo cancela o anterior
  // (ver reminderService.schedule), em vez de acumular notificações.
  reminder?: ChallengeReminder | null;
  // Quantas vezes essa instância já foi adiada — não bloqueia nada hoje, é só um registro pra uso
  // futuro (ex: aprender que ações às vezes chegam num momento ruim pra essa pessoa).
  reminderCount?: number;
  // Copiados do Challenge no momento da seleção (ver buildInstance) — mesmo padrão de `timing`:
  // congelados na criação, não recalculam se o catálogo mudar depois. Usados por
  // progressionService.ts pra atualizar o desempenho da pessoa no `concept` certo, mesmo que o
  // Challenge original seja removido/alterado do catálogo no futuro.
  concept?: string;
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

export const CHALLENGE_REACTION_LABELS: Record<ChallengeReaction, string> = {
  fez_muito_bem: 'Fez muito bem',
  foi_bom: 'Foi bom',
  foi_normal: 'Foi normal',
  nao_fez_diferenca: 'Não fez muita diferença',
  foi_dificil: 'Foi difícil',
};

export const ABANDON_REASON_LABELS: Record<AbandonReason, string> = {
  sem_tempo: 'Não tive tempo',
  momento_inadequado: 'Não estava no momento adequado',
  esqueci: 'Esqueci',
  nao_gostei: 'Não gostei da tarefa',
  foi_dificil: 'Foi difícil',
  nao_fez_sentido: 'Não fazia sentido para mim',
  outro: 'Outro',
};

// Reações consideradas positivas para fins de pontuação do ChallengeEngine
export const POSITIVE_REACTIONS: ChallengeReaction[] = ['fez_muito_bem', 'foi_bom'];
