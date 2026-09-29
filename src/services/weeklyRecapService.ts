import { notificationService } from './notificationService';
import { statsService } from './statsService';
import { preferencesRepository } from '@/storage/repositories/preferencesRepository';
import { addDays, endOfWeek, parseISODate, toISODate } from '@/utils/date';

// Abaixo disso, "resumo da semana" não faz sentido — ex: quem baixou o app sábado à noite teria,
// no máximo, 1-2 ações entregues antes do domingo ao meio-dia; um "resumo" essencialmente vazio
// só confunde. `deliveredThisWeek` (ver statsService.getPresenceSummary) já é escopado à semana
// sendo resumida, então o gate se resolve sozinho conforme os dias passam — sem precisar saber a
// data de cadastro da pessoa.
const MIN_DELIVERED_THIS_WEEK_FOR_RECAP = 3;

function atNoon(dateISO: string): Date {
  const date = parseISODate(dateISO);
  date.setHours(12, 0, 0, 0);
  return date;
}

/** Próximo domingo ao meio-dia a partir de `now` — hoje às 12h se `now` ainda for antes disso
 * (ex: domingo de manhã), senão o domingo da semana seguinte. */
function nextRecapNoon(now: Date): Date {
  const sunday = endOfWeek(toISODate(now));
  const candidate = atNoon(sunday);
  return candidate.getTime() > now.getTime() ? candidate : atNoon(addDays(sunday, 7));
}

export const weeklyRecapService = {
  /**
   * Agenda (não dispara na hora) o convite "Seu resumo semanal está pronto!" pro próximo domingo
   * ao meio-dia — chamado uma vez por período, mesmo gatilho/padrão de
   * scheduleDayReflectionReminder em dayCycleService. Content genérico de propósito: como é
   * agendada com dias de antecedência, a semana ainda não fechou pra calcular nada de verdade
   * ainda (ver notificationService.scheduleWeeklyRecap) — os números reais só existem quando o
   * app abre e lê o histórico, na aba Insights.
   *
   * Só agenda quando `deliveredThisWeek` já bate `MIN_DELIVERED_THIS_WEEK_FOR_RECAP` — sem isso,
   * quem acabou de instalar receberia um "resumo da semana" sobre um punhado de ações. Nesse caso
   * NÃO salva `lastWeeklyRecapScheduledFor`, então a checagem se repete a cada novo período
   * gerado, até o volume da semana justificar o convite (ou a semana virar e reiniciar a contagem).
   *
   * `lastWeeklyRecapScheduledFor` guarda a data (ISO) do domingo já agendado, sobrevivendo a
   * reabrir o app — evita reagendar o mesmo domingo toda vez que um novo período é gerado.
   */
  async scheduleIfNeeded(now: Date): Promise<void> {
    const target = nextRecapNoon(now);
    const targetDate = toISODate(target);

    const prefs = await preferencesRepository.get();
    if (prefs.lastWeeklyRecapScheduledFor === targetDate) return; // já agendado pra esse domingo

    const { deliveredThisWeek } = await statsService.getPresenceSummary(now);
    if (deliveredThisWeek < MIN_DELIVERED_THIS_WEEK_FOR_RECAP) return;

    await notificationService.scheduleWeeklyRecap(target, now);
    await preferencesRepository.save({ ...prefs, lastWeeklyRecapScheduledFor: targetDate });
  },
};
