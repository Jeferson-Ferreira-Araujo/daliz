import type { ChallengeCategory } from './challenge';
import type { ChallengeReaction } from './challengeInstance';

// Sem Concluir/Não consegui obrigatório (ver plano de migração "Novo modelo de ações"), a base
// principal dos tipos abaixo é PRESENÇA: quantas ações chegaram, com que frequência, em quais
// categorias. `reactionBreakdown`/`completedCount` são a exceção deliberada: desde que o
// ReactionPicker voltou, marcar uma reação (qualquer uma) É o sinal de "feito" — não finge medir
// desempenho, só reflete o que a pessoa marcou voluntariamente sobre como se sentiu.

export interface DailyPresence {
  date: string; // "YYYY-MM-DD"
  total: number; // ações entregues (deliveredAt) naquele dia
}

export interface CategoryCount {
  categoria: ChallengeCategory;
  count: number;
}

export interface RecentNote {
  instanceId: string;
  titulo: string;
  note: string;
  date: string; // "YYYY-MM-DD"
}

export interface ReactionCount {
  reaction: ChallengeReaction;
  count: number;
}

export interface PresenceSummary {
  totalDelivered: number; // todas as ações já entregues, desde sempre
  deliveredThisWeek: number;
  daysActiveThisWeek: number; // dias distintos desta semana (seg-dom) com pelo menos 1 ação entregue
  // Dias seguidos (até hoje ou ontem) com pelo menos 1 ação entregue — mede presença/uso
  // contínuo, não desempenho: nada aqui pressupõe que a pessoa "completou" nada.
  currentStreak: number;
  bestStreak: number;
  // Últimos 30 dias, ordenado por contagem — quais categorias mais apareceram pra essa pessoa.
  categoryBreakdown: CategoryCount[];
  // Últimos 7 dias (incluindo hoje), sempre com 7 entradas mesmo em dias sem nenhuma ação.
  dailyActivity: DailyPresence[];
  // Distribuição por hora do dia (índice 0-23) de quando as ações costumam chegar.
  hourlyDistribution: number[];
  // Anotações mais recentes primeiro (ver ChallengeCard/NoteField).
  recentNotes: RecentNote[];
  // Quantas ações entregues já têm uma reação marcada (completedAt != null) — ver
  // challengeActionsService.setReaction. Voluntário: nunca cobrado, só contado quando existe.
  completedCount: number;
  // Contagem por tipo de reação entre as ações com reação marcada, ordenada da mais comum pra
  // menos comum — omite tipos com zero ocorrências (mesmo padrão de categoryBreakdown).
  reactionBreakdown: ReactionCount[];
}
