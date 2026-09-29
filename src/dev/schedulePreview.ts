import { selectDailyChallenges } from '@/engine/ChallengeEngine';
import { minuteToDate } from '@/engine/scheduling';
import { contextService } from '@/services/contextService';
import { addDays, parseISODate, toISODate } from '@/utils/date';
import { timeToMinutes } from '@/utils/time';
import type { OnboardingProfileInput } from '@/services/profileService';
import type { ChallengeInstance, UserProfile } from '@/types';

export interface SchedulePreviewEntry {
  instance: ChallengeInstance;
}

/**
 * Constrói um `UserProfile` "de mentira" a partir dos campos do cadastro, sem tocar em
 * storage — mesma forma que `profileService.completeOnboarding` monta, só que em memória, pra
 * `app/dev/schedule-preview.tsx` poder rodar o motor de verdade (`selectDailyChallenges`) sobre um
 * perfil ainda sendo editado, sem persistir nada a cada tecla digitada.
 */
export function buildPreviewProfile(input: OnboardingProfileInput): UserProfile {
  const now = new Date().toISOString();
  return {
    ...input,
    photoUri: null,
    discoveredInterests: [],
    notificationsEnabled: true,
    onboardingCompletedAt: now,
    createdAt: now,
    termsAcceptedAt: now,
    firstActionState: 'completed',
    firstActionInstanceId: null,
  };
}

/** Instante de acordar num dia futuro específico — usado pra simular dias além de hoje (ver
 * computeSchedulePreviewForDate), já que só "hoje" tem um "agora" de verdade pra partir. */
function wakeMomentFor(profile: UserProfile, dateISO: string): Date {
  return minuteToDate(parseISODate(dateISO), timeToMinutes(profile.wakeTime));
}

/**
 * Roda o motor real (`selectDailyChallenges`) sobre um perfil ainda em edição, pra uma data
 * específica (hoje ou qualquer dia futuro) — mesmo pipeline usado por
 * `dayCycleService.ensureUpcomingActions`, sem gerar nem salvar nenhuma `ChallengeInstance` de
 * verdade.
 *
 * Pra simular um dia futuro de forma fiel (sem repetir ação/conceito usado recentemente, sem
 * "esquecer" categorias já usadas na semana), primeiro gera — só em memória, nunca persiste —
 * cada dia entre hoje e a data escolhida, um de cada vez, indo passando o resultado de cada dia
 * como histórico do próximo (igual `dayCycleService` faria de verdade, dia após dia). "Hoje"
 * sempre parte do `now` de verdade (respeita períodos já passados); os demais dias partem do
 * horário de acordar do perfil, já que não existe um "agora" real pra eles ainda.
 */
export async function computeSchedulePreviewForDate(
  profile: UserProfile,
  targetDate: string,
  now: Date,
): Promise<SchedulePreviewEntry[]> {
  const todayISO = toISODate(now);
  let history: ChallengeInstance[] = [];
  let cursor = todayISO;

  while (cursor < targetDate) {
    const cursorNow = cursor === todayISO ? now : wakeMomentFor(profile, cursor);
    const context = await contextService.getCurrentContext(profile, cursorNow);
    const dayInstances = selectDailyChallenges(profile, history, cursorNow, context);
    history = history.concat(dayInstances);
    cursor = addDays(cursor, 1);
  }

  const targetNow = targetDate === todayISO ? now : wakeMomentFor(profile, targetDate);
  const targetContext = await contextService.getCurrentContext(profile, targetNow);
  const targetInstances = selectDailyChallenges(profile, history, targetNow, targetContext);

  return [...targetInstances]
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))
    .map((instance) => ({ instance }));
}
