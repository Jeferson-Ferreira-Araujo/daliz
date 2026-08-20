import type { EventPhase, EventPhaseInfo, Holiday } from '@/types/holiday';
import { allHolidays } from '@/data/holidays';
import { resolveDateForYear } from '@/utils/holidays';
import { daysBetween, toISODate } from '@/utils/date';

const PHASE_RANK: Record<EventPhase, number> = { today: 0, near: 1, approaching: 2, after: 3, none: 4 };
const IMPORTANCE_RANK: Record<Holiday['importance'], number> = { high: 0, medium: 1, low: 2 };

function phaseFor(holiday: Holiday, daysUntil: number): EventPhase {
  if (daysUntil === 0) return 'today';
  if (daysUntil > 0 && daysUntil <= holiday.nearWindowDays) return 'near';
  if (daysUntil > 0 && daysUntil <= holiday.preparationWindowDays) return 'approaching';
  if (daysUntil < 0 && -daysUntil <= holiday.influenceWindowDaysAfter) return 'after';
  return 'none';
}

/** Ocorrência de `holiday` mais próxima de `now` — testa o ano atual e os vizinhos pra
 * cobrir virada de ano (ex: Ano Novo em 30/12 ainda deve contar como "approaching"). */
function nearestOccurrence(holiday: Holiday, now: Date): { dateISO: string; daysUntil: number } {
  const today = toISODate(now);
  const year = now.getFullYear();
  const candidates = [year - 1, year, year + 1].map((y) => resolveDateForYear(holiday.dateRule, y));
  let best = { dateISO: candidates[1], daysUntil: daysBetween(today, candidates[1]) };
  for (const dateISO of candidates) {
    const daysUntil = daysBetween(today, dateISO);
    if (Math.abs(daysUntil) < Math.abs(best.daysUntil)) best = { dateISO, daysUntil };
  }
  return best;
}

/**
 * Data comemorativa mais relevante pra agora, entre todas cadastradas pro país — ou
 * `null` se nenhuma estiver dentro da janela de influência de ninguém (a maior parte
 * do ano). Nunca lança erro: uma data mal configurada só não entra na lista (ver seção 26).
 */
export function getCurrentEventContext(now: Date, country: string): EventPhaseInfo | null {
  const candidates: EventPhaseInfo[] = [];

  for (const holiday of allHolidays) {
    if (holiday.country !== country) continue;
    try {
      const { dateISO, daysUntil } = nearestOccurrence(holiday, now);
      const phase = phaseFor(holiday, daysUntil);
      if (phase === 'none') continue;
      candidates.push({
        holidayId: holiday.id,
        name: holiday.name,
        occurrenceDate: dateISO,
        daysUntil,
        phase,
        importance: holiday.importance,
        category: holiday.category,
        tags: holiday.tags,
      });
    } catch {
      continue; // uma regra de data quebrada não pode travar o resto do calendário
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const phaseDiff = PHASE_RANK[a.phase] - PHASE_RANK[b.phase];
    if (phaseDiff !== 0) return phaseDiff;
    const importanceDiff = IMPORTANCE_RANK[a.importance] - IMPORTANCE_RANK[b.importance];
    if (importanceDiff !== 0) return importanceDiff;
    return Math.abs(a.daysUntil) - Math.abs(b.daysUntil);
  });

  return candidates[0];
}
