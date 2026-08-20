import type { DateRule } from '@/types/holiday';
import { addDays, toISODate } from './date';

/**
 * Domingo de Páscoa pro ano dado — algoritmo anônimo gregoriano (Meeus/Jones/Butcher),
 * o padrão pra calcular datas móveis (Carnaval, Sexta-feira Santa etc. derivam daqui
 * por offset — ver DateRule 'easter-offset').
 */
export function computeEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** N-ésima ocorrência de um dia da semana num mês (ex: 2º domingo de maio). weekday: 0=domingo. */
function nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): Date {
  const first = new Date(year, month - 1, 1);
  const firstWeekday = first.getDay();
  const offset = (weekday - firstWeekday + 7) % 7;
  const day = 1 + offset + (nth - 1) * 7;
  return new Date(year, month - 1, day);
}

/** Resolve qualquer DateRule pra uma data concreta naquele ano — o único lugar que sabe
 * calcular datas móveis, nada disso espalhado pelo resto do código. */
export function resolveDateForYear(rule: DateRule, year: number): string {
  if (rule.type === 'fixed') return toISODate(new Date(year, rule.month - 1, rule.day));
  if (rule.type === 'nth-weekday') return toISODate(nthWeekdayOfMonth(year, rule.month, rule.weekday, rule.nth));
  return addDays(toISODate(computeEasterDate(year)), rule.offsetDays);
}
