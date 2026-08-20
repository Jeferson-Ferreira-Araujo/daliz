import { statsService } from './statsService';
import { notificationService } from './notificationService';
import { preferencesRepository } from '@/storage/repositories/preferencesRepository';
import { buildTopHighlightPhrase } from '@/data/weeklyHighlightCopy';
import { addDays, parseISODate, startOfWeek, toISODate } from '@/utils/date';
import type { WeeklyInsight } from '@/types';

/** Corpo da notificação — reaproveita a mesma frase honesta do card de Insights quando há um
 * destaque, e um texto simples de contagem quando não há (semana com só 1-2 categorias, cada
 * uma com 1 ação, por exemplo — `topHighlight` ainda existe nesse caso, então isso raramente
 * acontece, mas cobre o caso-limite sem quebrar). */
function buildRecapBody(weekly: WeeklyInsight): string {
  const { totalCompleted, topHighlight } = weekly.currentWeek;
  if (topHighlight) return buildTopHighlightPhrase(topHighlight.categoria, topHighlight.count);
  return totalCompleted === 1 ? 'Você concluiu 1 ação essa semana. Veja como foi.' : `Você concluiu ${totalCompleted} ações essa semana. Veja como foi.`;
}

export const weeklyRecapService = {
  /**
   * Chamado uma vez por período acordado, só quando um novo lote de ações é gerado (ver
   * dayCycleService.ensureUpcomingActions — mesmo gatilho que já dispara o lembrete de reflexão
   * do dia). Como só existe uma segunda-feira por semana, isso naturalmente já garante "uma vez
   * por semana" sem precisar de nenhum agendamento futuro separado — é reativo à reabertura do
   * app, igual a "Spotify Wrapped" que aparece quando você abre o app depois do período fechar.
   */
  async notifyIfReady(now: Date): Promise<void> {
    const today = toISODate(now);
    if (today !== startOfWeek(today)) return; // só na segunda-feira, início da nova semana

    const prefs = await preferencesRepository.get();
    if (prefs.lastWeeklyRecapNotifiedWeekStart === today) return; // já notificou essa semana

    // A semana que acabou de fechar (domingo passado) — qualquer data dentro dela serve pra
    // startOfWeek/endOfWeek calcularem o intervalo certo em getWeeklyInsight.
    const lastSunday = addDays(today, -1);
    const weekly = await statsService.getWeeklyInsight(parseISODate(lastSunday));

    if (weekly.currentWeek.totalCompleted > 0) {
      await notificationService.sendWeeklyRecap(buildRecapBody(weekly));
    }
    await preferencesRepository.save({ ...prefs, lastWeeklyRecapNotifiedWeekStart: today });
  },
};
