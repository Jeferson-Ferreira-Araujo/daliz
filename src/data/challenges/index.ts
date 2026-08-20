import type { Challenge, ChallengeActionKind, ChallengeInstance, ChallengeTiming, ChallengeTimingConfig } from '@/types';
import { getChallengeTiming } from '@/engine/challengeTiming';
import { developmentChallenges } from './development';
import { relationshipsChallenges } from './relationships';
import { familyChallenges } from './family';
import { workChallenges } from './work';
import { healthChallenges } from './health';
import { financeChallenges } from './finance';
import { learningChallenges } from './learning';
import { communityChallenges } from './community';
import { faithChallenges } from './faith';
import { interestComboChallenges } from './interestCombos';
import { personComboChallenges } from './personCombos';
import { eventComboChallenges } from './eventCombos';
// Expansão contextual (ver plano em .claude/plans — "Expansão da biblioteca de desafios"):
// ~1.100 novos desafios gerados por scripts/generate-challenge-expansion.js, cobrindo
// família, filhos, parceiro, pais/figuras importantes, amigos, clima, estações e datas
// comemorativas, todos usando os campos já suportados pelo Challenge type/ChallengeEngine.
import { familyExpansionChallenges } from './familyExpansion';
import { childrenChallenges } from './childrenChallenges';
import { partnerChallenges } from './partnerChallenges';
import { parentsChallenges } from './parentsChallenges';
import { friendsChallenges } from './friendsChallenges';
import { rainChallenges } from './rainChallenges';
import { coldChallenges } from './coldChallenges';
import { hotChallenges } from './hotChallenges';
import { pleasantWeatherChallenges } from './pleasantWeatherChallenges';
import { sunnyChallenges } from './sunnyChallenges';
import { stormChallenges } from './stormChallenges';
import { seasonChallenges } from './seasonChallenges';
import { indoorChallenges } from './indoorChallenges';
import { outdoorChallenges } from './outdoorChallenges';
import { holidayExpansionChallenges } from './holidayExpansion';

// Timing (now/today/contextual) é bakeado UMA VEZ aqui, na montagem do catálogo — nunca
// recalculado por leitura (ver classifyTiming/getChallengeTiming em src/engine/challengeTiming.ts).
// Nenhum dos ~2.000 desafios abaixo foi editado à mão pra isso; a classificação é 100% via
// heurística de texto, com fallback seguro pra 'today'.
const rawChallenges: Challenge[] = [
  ...developmentChallenges,
  ...relationshipsChallenges,
  ...familyChallenges,
  ...workChallenges,
  ...healthChallenges,
  ...financeChallenges,
  ...learningChallenges,
  ...communityChallenges,
  ...faithChallenges,
  ...interestComboChallenges,
  ...personComboChallenges,
  ...eventComboChallenges,
  ...familyExpansionChallenges,
  ...childrenChallenges,
  ...partnerChallenges,
  ...parentsChallenges,
  ...friendsChallenges,
  ...rainChallenges,
  ...coldChallenges,
  ...hotChallenges,
  ...pleasantWeatherChallenges,
  ...sunnyChallenges,
  ...stormChallenges,
  ...seasonChallenges,
  ...indoorChallenges,
  ...outdoorChallenges,
  ...holidayExpansionChallenges,
];

export const allChallenges: Challenge[] = rawChallenges.map((challenge) => ({
  ...challenge,
  timing: {
    mode: getChallengeTiming(challenge),
    preferredPeriods: challenge.timing?.preferredPeriods ?? [],
    avoidPeriods: challenge.timing?.avoidPeriods ?? [],
  },
}));

export const challengeById: Record<string, Challenge> = Object.fromEntries(
  allChallenges.map((challenge) => [challenge.id, challenge]),
);

const DEFAULT_TIMING_CONFIG: ChallengeTimingConfig = { mode: 'today', preferredPeriods: [], avoidPeriods: [] };

/** Config de timing efetiva de uma instância: explícita nela mesma (congelada na criação) > timing
 * do desafio no catálogo (cobre instâncias antigas persistidas antes dessa feature existir) >
 * default seguro. */
export function getInstanceTimingConfig(instance: ChallengeInstance): ChallengeTimingConfig {
  return instance.timing ?? challengeById[instance.challengeId]?.timing ?? DEFAULT_TIMING_CONFIG;
}

/** Modo de timing efetivo de uma instância (ver getInstanceTimingConfig) — atalho usado por quem
 * só precisa do enum ('now'/'today'/'contextual'), não dos períodos preferidos/evitados. */
export function getInstanceTiming(instance: ChallengeInstance): ChallengeTiming {
  return getInstanceTimingConfig(instance).mode;
}

/** Tipo efetivo de uma instância: explícito nela mesma (congelado na criação) > tipo do desafio
 * no catálogo (cobre instâncias antigas persistidas antes dessa feature) > 'acao' como default
 * seguro — mesmo padrão de getInstanceTiming. */
export function getInstanceActionKind(instance: ChallengeInstance): ChallengeActionKind {
  return instance.type ?? challengeById[instance.challengeId]?.type ?? 'acao';
}
