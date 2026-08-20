import { weatherService } from './weatherService';
import { getCurrentEventContext } from './holidayService';
import { getSeason } from '@/utils/season';
import { EMPTY_CONTEXT, type AppContext } from '@/types/context';
import type { UserProfile } from '@/types';

const DEFAULT_COUNTRY = 'BR';

/**
 * Junta clima (só lê cache, nunca dispara rede — ver weatherService), estação (calculada
 * pela latitude do perfil) e a data comemorativa mais relevante agora, num único objeto
 * que o ChallengeEngine consome. Nunca lança: cada pedaço tem seu próprio fallback (ver
 * seção 26) — no pior caso devolve EMPTY_CONTEXT e o motor funciona igual a antes.
 */
export const contextService = {
  async getCurrentContext(profile: UserProfile, now: Date): Promise<AppContext> {
    const weather = await weatherService.getNormalizedWeather();
    const season = getSeason(now, profile.location?.latitude ?? null);
    const event = getCurrentEventContext(now, DEFAULT_COUNTRY);
    return { weather, season, event };
  },
};

export { EMPTY_CONTEXT };
