export type ThemePreference = 'system' | 'light' | 'dark';

export interface AppPreferences {
  themePreference: ThemePreference;
  // true depois que a pessoa já viu a explicação inicial da tela de Insights uma vez —
  // enquanto ainda não há desafio concluído, distingue a primeira visita (explica o que
  // vai aparecer ali) das visitas seguintes (só "aguardando dados").
  hasSeenInsightsIntro: boolean;
  // Segunda-feira ("YYYY-MM-DD") da última semana cujo "O que você melhorou?" já disparou
  // notificação (ver weeklyRecapService.ts) — evita notificar de novo se o app for reaberto
  // mais de uma vez na mesma segunda. null = nunca notificado ainda.
  lastWeeklyRecapNotifiedWeekStart: string | null;
  // `activeDate` ("YYYY-MM-DD") do último período cujo lembrete "Como foi seu dia hoje?" já foi
  // agendado (ver dayCycleService.generateForActiveDate) — guarda persistido, sobrevive a reabrir
  // o app. A trava em memória (`generationLocks`) só protege contra chamadas concorrentes dentro
  // do MESMO processo; se o app for encerrado pelo sistema operacional no meio da primeira geração
  // do período (comum em segundo plano) e reaberto antes de `challengeInstanceRepository.saveMany`
  // completar, a próxima abertura vê `instances.length === 0` de novo e regeneraria tudo — inclusive
  // reagendando o lembrete pela segunda vez, mesmo que o primeiro agendamento já tivesse ido pro SO
  // com sucesso antes do processo morrer. Esse campo fecha essa brecha. null = nunca agendado ainda.
  lastDayReflectionReminderDate: string | null;
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  themePreference: 'light',
  hasSeenInsightsIntro: false,
  lastWeeklyRecapNotifiedWeekStart: null,
  lastDayReflectionReminderDate: null,
};
