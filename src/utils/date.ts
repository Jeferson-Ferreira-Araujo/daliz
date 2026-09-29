/**
 * Retorna a data "lógica" (YYYY-MM-DD) do app para um instante dado — o dia
 * vira à meia-noite, igual ao calendário normal. Antes virava às 3h, mas isso
 * não faz mais sentido com turnos variados: pra alguém de plantão, 1h ou 2h da
 * manhã pode ser um dia de trabalho totalmente normal, não "madrugada de ontem".
 */
export function logicalDateFor(instant: Date): string {
  return toISODate(instant);
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(dateISO: string): Date {
  const [year, month, day] = dateISO.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(dateISO: string, days: number): string {
  const [year, month, day] = dateISO.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function yesterdayOf(dateISO: string): string {
  return addDays(dateISO, -1);
}

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

export function formatLongDate(date: Date): string {
  return `${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

/** Data de nascimento por extenso com ano, a partir de "YYYY-MM-DD" (ex: "15 de março de 1990"). */
export function formatBirthDate(birthDateISO: string): string {
  const date = parseISODate(birthDateISO);
  return `${formatLongDate(date)} de ${date.getFullYear()}`;
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const;

export function dayOfWeekFor(date: Date): (typeof WEEKDAYS)[number] {
  return WEEKDAYS[date.getDay()];
}

/** Idade em anos completos, a partir de uma data de nascimento "YYYY-MM-DD". */
export function calculateAge(birthDateISO: string, now: Date): number {
  const [birthYear, birthMonth, birthDay] = birthDateISO.split('-').map(Number);
  let age = now.getFullYear() - birthYear;
  const hadBirthdayThisYear =
    now.getMonth() + 1 > birthMonth || (now.getMonth() + 1 === birthMonth && now.getDate() >= birthDay);
  if (!hadBirthdayThisYear) age -= 1;
  return age;
}

/** true se hoje é o aniversário (mês e dia batem, independente do ano). */
export function isBirthdayToday(birthDateISO: string, now: Date): boolean {
  const [, birthMonth, birthDay] = birthDateISO.split('-').map(Number);
  return now.getMonth() + 1 === birthMonth && now.getDate() === birthDay;
}

/** Resolve a idade "de verdade" de uma pessoa importante: recalcula a partir de `birthDate`
 * sempre que ele existir, em vez de confiar no `age` estático digitado no cadastro — sem isso,
 * uma criança cadastrada com "3 anos" continua "3 anos" pro motor pra sempre, mesmo depois de
 * fazer aniversário (ver ChallengeEngine.personMatchesChallenge, que usa isso pra filtrar ações
 * por minAge/maxAge). `age` só sobra como fallback pra quem cadastrou sem informar a data de
 * nascimento — nesse caso não tem como recalcular nada, e o valor digitado continua sendo o
 * melhor palpite disponível. */
export function resolvePersonAge(person: { age: number | null; birthDate: string | null }, now: Date): number | null {
  if (person.birthDate) return calculateAge(person.birthDate, now);
  return person.age;
}

/** Segunda-feira da semana que contém `dateISO` (ver "Seu resumo semanal" — weeklyRecapService.ts
 * — que respeita segunda a domingo, data/localidade do dispositivo). `Date.getDay()`: 0=dom..6=sáb. */
export function startOfWeek(dateISO: string): string {
  const day = parseISODate(dateISO).getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  return addDays(dateISO, diffToMonday);
}

/** Domingo da semana que contém `dateISO` — sempre `startOfWeek(dateISO) + 6 dias`. */
export function endOfWeek(dateISO: string): string {
  return addDays(startOfWeek(dateISO), 6);
}

export function daysBetween(aISO: string, bISO: string): number {
  const [ay, am, ad] = aISO.split('-').map(Number);
  const [by, bm, bd] = bISO.split('-').map(Number);
  const a = new Date(ay, am - 1, ad);
  const b = new Date(by, bm - 1, bd);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}
