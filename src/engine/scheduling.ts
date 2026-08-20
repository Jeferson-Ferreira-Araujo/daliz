import { timeToMinutes } from '@/utils/time';

export interface Interval {
  start: number; // minutos desde a meia-noite de "hoje", pode passar de 1440
  end: number;
}

export function normalizeWindow(startTime: string, endTime: string, dayOffset: number = 0): Interval {
  const start = timeToMinutes(startTime) + dayOffset * 1440;
  let end = timeToMinutes(endTime) + dayOffset * 1440;
  if (end <= start) end += 1440;
  return { start, end };
}

export function subtract(base: Interval, cut: Interval): Interval[] {
  if (cut.end <= base.start || cut.start >= base.end) return [base];
  const result: Interval[] = [];
  if (cut.start > base.start) result.push({ start: base.start, end: Math.min(cut.start, base.end) });
  if (cut.end < base.end) result.push({ start: Math.max(cut.end, base.start), end: base.end });
  return result;
}

/** Converte um minuto-desde-meia-noite (pode passar de 1440) em Date, a partir da data de referência. */
export function minuteToDate(referenceNow: Date, minute: number): Date {
  const date = new Date(referenceNow);
  date.setHours(0, 0, 0, 0);
  date.setMinutes(minute);
  return date;
}
