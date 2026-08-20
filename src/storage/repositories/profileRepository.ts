import { storageClient } from '../storageClient';
import { STORAGE_KEYS } from '../keys';
import { CHALLENGE_CATEGORY_LABELS, type ChallengeCategory, type UserProfile } from '@/types';

const DEFAULT_WORK_DAYS = ['seg', 'ter', 'qua', 'qui', 'sex'];
const ALL_CATEGORIES = Object.keys(CHALLENGE_CATEGORY_LABELS) as ChallengeCategory[];

/**
 * Preenche campos que podem faltar em um perfil salvo antes de uma mudança de
 * formato (ex: `mainGoal` único virou `mainGoals[]`; `avoidSocialChallenges`
 * virou `socialChallengesInterest`; `mainGoals`+`avoidCategories` viraram
 * `selectedCategories` único). Sem isso, uma tela que lê um campo novo de um
 * perfil salvo pela versão anterior do app quebra (`undefined.map`).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- payload de storage pode ser de uma versão anterior do formato
function normalizeProfile(raw: any): UserProfile {
  const legacyAvoidSocial = raw.avoidSocialChallenges as boolean | undefined;
  const legacyAvoidCategories = (raw.avoidCategories as ChallengeCategory[] | undefined) ?? [];

  return {
    ...raw,
    workSchedule: raw.workSchedule ?? 'fixa',
    workDays: raw.workDays ?? DEFAULT_WORK_DAYS,
    shiftPattern: raw.shiftPattern ?? null,
    // Perfis salvos antes dessa pergunta existir já recebiam desafios no expediente
    // normalmente — o default mantém esse comportamento em vez de mudar por baixo dos pés.
    receiveDuringWorkHours: raw.receiveDuringWorkHours ?? true,
    selectedCategories:
      raw.selectedCategories ?? ALL_CATEGORIES.filter((category) => !legacyAvoidCategories.includes(category)),
    challengeIntensity: raw.challengeIntensity ?? 'equilibrado',
    socialMediaUsage: raw.socialMediaUsage ?? 'as_vezes',
    socialChallengesInterest: raw.socialChallengesInterest ?? (legacyAvoidSocial ? 'prefiro_nao' : 'as_vezes'),
    socialNetworks: raw.socialNetworks ?? [],
    interests: raw.interests ?? [],
    otherInterestText: raw.otherInterestText ?? null,
    stillDiscoveringInterests: raw.stillDiscoveringInterests ?? false,
    discoveredInterests: raw.discoveredInterests ?? [],
    importantPeople: raw.importantPeople ?? [],
    location: raw.location ?? null,
    // Perfis salvos antes do fluxo de primeira ação existir nunca vão passar por ele de novo —
    // tratamos como já resolvido, igual todo outro campo legado aqui (ver src/types/profile.ts).
    firstActionState: raw.firstActionState ?? 'completed',
    firstActionInstanceId: raw.firstActionInstanceId ?? null,
  };
}

export const profileRepository = {
  async get(): Promise<UserProfile | null> {
    const raw = await storageClient.getItem<UserProfile>(STORAGE_KEYS.profile);
    if (!raw) return null;
    const normalized = normalizeProfile(raw);
    if (JSON.stringify(normalized) !== JSON.stringify(raw)) {
      await storageClient.setItem(STORAGE_KEYS.profile, normalized);
    }
    return normalized;
  },

  async save(profile: UserProfile): Promise<void> {
    await storageClient.setItem(STORAGE_KEYS.profile, profile);
  },

  async clear(): Promise<void> {
    await storageClient.removeItem(STORAGE_KEYS.profile);
  },
};
