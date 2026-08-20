import { selectDailyChallenges, type ScoredCandidate } from '@/engine/ChallengeEngine';
import { contextService } from '@/services/contextService';
import type { OnboardingProfileInput } from '@/services/profileService';
import type { ChallengeInstance, UserProfile } from '@/types';

export interface SchedulePreviewEntry {
  instance: ChallengeInstance;
  // Outros candidatos considerados pro mesmo horário, já pontuados e ordenados (o próprio
  // `instance` é sempre o primeiro) — pra mostrar que o motor É determinístico pra um mesmo
  // contexto (mesmo perfil/horário sempre escolhe o mesmo vencedor, "Sortear de novo" só varia
  // quantidade/horário dentro dos períodos, não o critério de escolha em si) e revelar o que mais
  // estava na disputa.
  alternatives: ScoredCandidate[];
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
    firstActionState: 'completed',
    firstActionInstanceId: null,
  };
}

/**
 * Roda o motor real (`selectDailyChallenges`) sobre um perfil ainda em edição — mesmo pipeline
 * usado por `dayCycleService.ensureUpcomingActions`, sem gerar nem salvar nenhuma
 * `ChallengeInstance` de verdade (`history` sempre vazio: essa é uma amostra do que SERIA
 * enviado a partir de agora, não uma continuação do histórico real de ninguém). Clima só lê cache
 * local (`contextService.getCurrentContext` → `weatherService.getNormalizedWeather`, nunca bate
 * rede) — seguro pra chamar a cada edição de campo.
 *
 * Pra cada horário, também captura os candidatos concorrentes via `onCandidatesScored` (opção
 * dev-only do motor) — a escolha em si é determinística pro mesmo contexto exato (mesmo
 * perfil+horário sempre pontua igual e escolhe o mesmo vencedor); o que varia entre chamadas é só
 * a quantidade de ações e em que horário elas caem dentro de cada período (sorteio de
 * `pickActionCountsPerSlot`/`spreadTimesWithinSlot`). Editar o perfil (categorias, interesses,
 * pessoas, clima/estação via localização, horário) é o jeito real de ver outras combinações —
 * `alternatives` existe pra deixar isso visível, mostrando o que mais concorreu em cada horário.
 */
export async function computeSchedulePreview(profile: UserProfile, now: Date): Promise<SchedulePreviewEntry[]> {
  const context = await contextService.getCurrentContext(profile, now);
  const alternativesByTime = new Map<number, ScoredCandidate[]>();
  const instances = selectDailyChallenges(profile, [], now, context, {
    onCandidatesScored: (scheduledFor, ranked) => alternativesByTime.set(scheduledFor.getTime(), ranked),
  });
  return [...instances]
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))
    .map((instance) => ({
      instance,
      alternatives: alternativesByTime.get(new Date(instance.scheduledFor).getTime()) ?? [],
    }));
}
