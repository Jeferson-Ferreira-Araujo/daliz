/** Converte "HH:mm" em minutos desde a meia-noite. */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Verifica se `time` está dentro da janela [start, end), tratando corretamente
 * janelas que cruzam a meia-noite (ex: dormir 23:00 -> acordar 06:00).
 */
export function isWithinWindow(time: string, start: string, end: string): boolean {
  const t = timeToMinutes(time);
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  if (s <= e) return t >= s && t < e;
  return t >= s || t < e;
}

export function isWorkingHours(time: string, workStart: string, workEnd: string): boolean {
  return isWithinWindow(time, workStart, workEnd);
}

export function isSleepingHours(time: string, sleepTime: string, wakeTime: string): boolean {
  return isWithinWindow(time, sleepTime, wakeTime);
}

export function nowAsTime(date: Date = new Date()): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
