import type { DayType, Moment, ShiftPattern, UserProfile } from '@/types';
import { timeToMinutes } from '@/utils/time';
import { dayOfWeekFor, daysBetween, parseISODate, toISODate } from '@/utils/date';
import { minuteToDate } from './scheduling';

export interface DaySlot {
  start: Date;
  end: Date;
  momento: Moment;
  tipoDia: DayType;
}

const MAX_DAY_SLOTS = 5;
const START_OF_DAY_MINUTES = 90; // duração do momento "início do dia"
const BEFORE_SLEEP_MINUTES = 90; // duração do momento "antes de dormir"
const TRANSITION_MINUTES = 120; // duração do momento "transição" após o expediente
const MIN_SLOT_MINUTES = 5; // abaixo disso o momento nem entra como slot

/**
 * true = dia de trabalho, false = folga confirmada, null = incerto (rotina
 * variável, ou turnos sem padrão configurado ainda). `null` faz o motor tratar
 * o dia como "qualquer" em vez de travar em trabalho/folga por engano.
 */
export function isWorkdayToday(profile: UserProfile, now: Date): boolean | null {
  if (!profile.isWorking) return false;

  if (profile.workSchedule === 'fixa') {
    return profile.workDays.includes(dayOfWeekFor(now));
  }

  if (profile.workSchedule === 'turnos' && profile.shiftPattern) {
    return isWorkdayByShift(profile.shiftPattern, now);
  }

  return null;
}

function isWorkdayByShift(pattern: ShiftPattern, now: Date): boolean {
  const { workDays, restDays, anchorDate, anchorIsWorkday } = pattern;
  const cycle = workDays + restDays;
  if (cycle <= 0) return false;
  const diff = daysBetween(anchorDate, toISODate(now));
  const offset = ((diff % cycle) + cycle) % cycle;
  return anchorIsWorkday ? offset < workDays : offset >= restDays;
}

interface RawSegment {
  momento: Moment;
  tipoDia: DayType;
  start: number; // minutos desde a meia-noite de "hoje", pode passar de 1440
  end: number;
}

/**
 * Divide o dia da pessoa (a partir de acordar/trabalhar/dormir do perfil, não
 * de horários genéricos) em momentos nomeados, na ordem em que acontecem.
 * O ChallengeEngine escolhe, pra cada slot, o melhor desafio compatível — ou
 * nenhum, se nada combinar bem o suficiente (ver seleção em ChallengeEngine.ts).
 */
export function computeDaySlots(profile: UserProfile, now: Date): DaySlot[] {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const wake = timeToMinutes(profile.wakeTime);
  let sleep = timeToMinutes(profile.sleepTime);
  if (sleep <= wake) sleep += 1440;

  const isWorkday = isWorkdayToday(profile, now);
  const hasWorkHours = isWorkday === true && !!profile.workStartTime && !!profile.workEndTime;

  const raw: RawSegment[] = hasWorkHours
    ? buildWorkdaySegments(wake, sleep, profile.workStartTime!, profile.workEndTime!, profile.receiveDuringWorkHours)
    : buildOpenDaySegments(wake, sleep, isWorkday === false ? 'folga' : 'qualquer');

  const clipStart = Math.max(nowMinutes, wake);
  return raw
    .map((seg) => ({ ...seg, start: Math.max(seg.start, clipStart) }))
    .filter((seg) => seg.end - seg.start >= MIN_SLOT_MINUTES)
    .slice(0, MAX_DAY_SLOTS)
    .map((seg) => ({
      start: minuteToDate(now, seg.start),
      end: minuteToDate(now, seg.end),
      momento: seg.momento,
      tipoDia: seg.tipoDia,
    }));
}

/**
 * Fração do dia acordado (wake→sleep) que ainda resta a partir de `now` — 1 = dia inteiro pela
 * frente (abriu o app logo ao acordar), próximo de 0 = já quase na hora de dormir. Usado pra
 * escalar QUANTAS ações o motor tenta encaixar hoje (ver ChallengeEngine.pickActionCountsPerSlot):
 * sem isso, alguém que se cadastra às 19h com sono à 00h recebia a mesma quantidade de quem tem o
 * dia inteiro pela frente, só que espremida nas poucas horas restantes.
 */
export function remainingDayRatio(profile: UserProfile, now: Date): number {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const wake = timeToMinutes(profile.wakeTime);
  let sleep = timeToMinutes(profile.sleepTime);
  if (sleep <= wake) sleep += 1440;

  const totalWindow = sleep - wake;
  if (totalWindow <= 0) return 1;

  const clipStart = Math.max(nowMinutes, wake);
  const remaining = Math.max(sleep - clipStart, 0);
  return Math.min(Math.max(remaining / totalWindow, 0), 1);
}

/**
 * Momento em que as ações geradas para `date` devem ser consideradas expiradas (se ainda
 * pendentes) — o horário de dormir da pessoa a partir da meia-noite de `date`, não a meia-noite
 * seguinte. Base de todo o modelo de "sem fechamento de dia": não existe nenhum registro de
 * ciclo aberto/fechado — cada instância expira sozinha quando este horário passa (ver
 * dayCycleService.resolveActiveDate/expireStalePending). Cobre rotinas que atravessam a
 * meia-noite (ex: acorda 16h, dorme 10h do dia seguinte): sem isso, alguém de madrugada, ainda
 * bem antes de dormir, seria tratado como "já é amanhã" só porque o calendário virou.
 */
export function sleepDeadlineFor(date: string, profile: UserProfile): Date {
  const wake = timeToMinutes(profile.wakeTime);
  let sleep = timeToMinutes(profile.sleepTime);
  if (sleep <= wake) sleep += 1440;
  return minuteToDate(parseISODate(date), sleep);
}

function buildWorkdaySegments(
  wake: number,
  sleep: number,
  workStartTime: string,
  workEndTime: string,
  receiveDuringWorkHours: boolean,
): RawSegment[] {
  let workStart = timeToMinutes(workStartTime);
  let workEnd = timeToMinutes(workEndTime);
  if (workStart < wake) workStart += 1440;
  if (workEnd <= workStart) workEnd += 1440;

  const inicioStart = Math.max(wake, workStart - START_OF_DAY_MINUTES);
  const transicaoEnd = workEnd + TRANSITION_MINUTES;
  const antesDormirStart = Math.max(transicaoEnd, sleep - BEFORE_SLEEP_MINUTES);

  const segments: RawSegment[] = [{ momento: 'inicio_dia', tipoDia: 'trabalho', start: inicioStart, end: workStart }];

  // A pessoa pediu pra não ser notificada durante o expediente — pula o slot inteiro
  // em vez de mandar um desafio que ela não pode atender (ver UserProfile.receiveDuringWorkHours).
  if (receiveDuringWorkHours) {
    segments.push({ momento: 'durante_dia', tipoDia: 'trabalho', start: workStart, end: workEnd });
  }

  segments.push(
    { momento: 'transicao', tipoDia: 'trabalho', start: workEnd, end: transicaoEnd },
    { momento: 'fim_dia', tipoDia: 'trabalho', start: transicaoEnd, end: antesDormirStart },
    { momento: 'antes_dormir', tipoDia: 'trabalho', start: antesDormirStart, end: sleep },
  );

  return segments;
}

function buildOpenDaySegments(wake: number, sleep: number, tipoDia: DayType): RawSegment[] {
  const total = Math.max(sleep - wake, 60);
  const inicioEnd = wake + Math.min(START_OF_DAY_MINUTES, total * 0.2);
  const antesDormirStart = sleep - Math.min(BEFORE_SLEEP_MINUTES, total * 0.2);
  const midpoint = Math.min(wake + total * 0.6, antesDormirStart);

  return [
    { momento: 'inicio_dia', tipoDia, start: wake, end: inicioEnd },
    { momento: 'durante_dia', tipoDia, start: inicioEnd, end: midpoint },
    { momento: 'fim_dia', tipoDia, start: midpoint, end: antesDormirStart },
    { momento: 'antes_dormir', tipoDia, start: antesDormirStart, end: sleep },
  ];
}
