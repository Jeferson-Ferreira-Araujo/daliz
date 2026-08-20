import type { ChallengeCategory } from './challenge';

export interface DailyActivity {
  date: string; // "YYYY-MM-DD"
  completed: number;
  total: number; // total de desafios resolvidos (concluído + não concluído + ignorado)
}

export interface CategoryBreakdownEntry {
  categoria: ChallengeCategory;
  completionRate: number; // 0..1
  totalCompleted: number;
  totalResolved: number;
}

export interface AggregatedStats {
  totalReceived: number;
  totalCompleted: number;
  completionRate: number; // 0..1
  averageTimeToCompleteMs: number | null;
  bestCategories: { categoria: ChallengeCategory; completionRate: number }[];
  worstCategories: { categoria: ChallengeCategory; completionRate: number }[];
  // titulo vem da própria instância (já resolvido, com {pessoa} substituído se aplicável) — nunca
  // de um lookup no catálogo estático, porque nem toda instância corresponde a um Challenge do
  // catálogo (ex: a ação fixa de primeira ação, ver src/data/firstActionChallenge.ts).
  bestRatedChallengeIds: { challengeId: string; titulo: string }[];
  mostIgnoredChallengeIds: { challengeId: string; titulo: string }[];
  bestCompletionHours: number[]; // horas do dia (0-23) com maior taxa de conclusão
  // Últimos 7 dias (incluindo hoje), em ordem cronológica, sempre com 7 entradas
  // mesmo em dias sem nenhum desafio — alimenta o gráfico de atividade semanal.
  dailyActivity: DailyActivity[];
  currentStreak: number; // dias seguidos (até hoje ou ontem) com pelo menos 1 desafio concluído
  bestStreak: number; // maior sequência já alcançada
  // Todas as categorias com pelo menos 1 desafio resolvido, ordenadas por taxa de
  // conclusão — não só top/bottom 3 (ver bestCategories/worstCategories acima).
  categoryBreakdown: CategoryBreakdownEntry[];
  // Contagem de conclusões por hora do dia (índice 0-23) — alimenta o mapa de calor.
  hourlyDistribution: number[];
}

// "O que você melhorou?" — resumo semanal (ver src/data/weeklyHighlightCopy.ts pra tradução
// categoria → linguagem humana, e statsService.getWeeklyInsight pro cálculo).
export interface WeeklyHighlight {
  categoria: ChallengeCategory;
  count: number;
}

export interface WeeklyInsightWeek {
  weekStart: string; // "YYYY-MM-DD", segunda-feira
  weekEnd: string; // "YYYY-MM-DD", domingo (mesmo a semana ainda não ter terminado)
  totalCompleted: number;
  // Categorias com mais de 1 ação concluída na semana, ordenadas por contagem (desempate: ação
  // mais recente primeiro) — até 3, ver seção 7 do pedido ("não mostrar tudo obrigatoriamente").
  highlights: WeeklyHighlight[];
  // Categoria com mais ações concluídas na semana ("mudança que mais se destacou", seção 8/9) —
  // null só quando não há nenhuma ação concluída ainda. Sem filtro de >1: mesmo uma única ação
  // pode ser o destaque de uma semana que está só começando (ver seção 13).
  topHighlight: WeeklyHighlight | null;
}

export interface WeeklyInsight {
  currentWeek: WeeklyInsightWeek;
  // Reservado pra comparação com a semana anterior (seção 15 do pedido) — deliberadamente não
  // implementado nesta versão, só a forma já preparada pra não exigir reescrever o componente.
  previousWeek?: WeeklyInsightWeek;
}
