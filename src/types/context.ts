import type { NormalizedWeather } from './weather';
import type { EventPhaseInfo } from './holiday';
import type { Season } from '@/utils/season';

/**
 * Contexto "de agora" que alimenta o ChallengeEngine além de perfil/histórico — clima,
 * estação e data comemorativa mais relevante no momento. Sempre computável (com
 * `weather`/`event` podendo ser `null`) pra nunca travar a seleção de desafios (ver
 * seção 21/26 do pedido: offline-first, tudo tem fallback pro algoritmo normal).
 */
export interface AppContext {
  weather: NormalizedWeather | null;
  season: Season;
  event: EventPhaseInfo | null;
}

export const EMPTY_CONTEXT: AppContext = {
  weather: null,
  season: 'summer',
  event: null,
};
