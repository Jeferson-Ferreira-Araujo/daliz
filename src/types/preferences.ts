export type ThemePreference = 'system' | 'light' | 'dark';

export interface AppPreferences {
  themePreference: ThemePreference;
  // Data ("YYYY-MM-DD") do domingo pro qual o convite "Seu resumo semanal" já foi agendado (ver
  // weeklyRecapService.scheduleIfNeeded) — evita reagendar o mesmo domingo toda vez que um novo
  // período é gerado. null = nunca agendado ainda.
  lastWeeklyRecapScheduledFor: string | null;
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
  lastWeeklyRecapScheduledFor: null,
  lastDayReflectionReminderDate: null,
};
