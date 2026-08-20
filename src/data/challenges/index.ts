import type { Challenge, ChallengeActionKind, ChallengeInstance, ChallengeTiming, ChallengeTimingConfig } from '@/types';
import { getChallengeTiming } from '@/engine/challengeTiming';
// Base curada nova (ver plano de migração "Novo modelo de ações" — substitui por completo o
// catálogo antigo de ~1686 itens). Gerada por scripts/import-actions-v3.js a partir de
// scripts/data/actions-v3-source.txt — 1 arquivo por categoria oficial (10 categorias).
import { relationshipsChallenges } from './relationships';
import { familyChallenges } from './family';
import { learningChallenges } from './learning';
import { healthChallenges } from './health';
import { routineChallenges } from './routine';
import { workChallenges } from './work';
import { creativityChallenges } from './creativity';
import { leisureChallenges } from './leisure';
import { homeChallenges } from './home';
import { faithChallenges } from './faith';

// Timing (now/today/contextual) é bakeado UMA VEZ aqui, na montagem do catálogo — nunca
// recalculado por leitura (ver classifyTiming/getChallengeTiming em src/engine/challengeTiming.ts).
// Nenhum dos desafios abaixo foi editado à mão pra isso; a classificação é 100% via heurística de
// texto, com fallback seguro pra 'today'.
const rawChallenges: Challenge[] = [
  ...relationshipsChallenges,
  ...familyChallenges,
  ...learningChallenges,
  ...healthChallenges,
  ...routineChallenges,
  ...workChallenges,
  ...creativityChallenges,
  ...leisureChallenges,
  ...homeChallenges,
  ...faithChallenges,
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
