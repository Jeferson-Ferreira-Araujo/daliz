import type { OnboardingProfileInput } from '@/services/profileService';

/**
 * Ponte só-dev entre "Dev Mode → Cenários" e a tela real de cadastro
 * (`app/onboarding/profile.tsx`). Diferente dos cenários que chamam
 * `profileService.completeOnboarding` direto e pulam pra Home, este fluxo precisa passar
 * pelas telas de verdade (pra revisar mudanças de UI/copy nelas) — só evita a digitação manual
 * dos ~8 passos. Estado em memória (mesmo padrão de `onboardingDraft.ts`): sobrevive à navegação
 * dentro do app, nunca é persistido, e é consumido uma única vez pra não vazar em cadastros
 * manuais depois.
 */
let armedDraft: OnboardingProfileInput | null = null;

export const devOnboardingAutofill = {
  /** Chamado pelo Dev Mode antes de navegar pra `/onboarding/welcome`. */
  arm(draft: OnboardingProfileInput) {
    armedDraft = draft;
  },
  /** Chamado pela tela de cadastro no mount — retorna o draft uma única vez e limpa em seguida. */
  consume(): OnboardingProfileInput | null {
    const draft = armedDraft;
    armedDraft = null;
    return draft;
  },
};

/** Mesmos valores de `ensureTestProfile` (devService.ts) — mantém os dois fluxos de teste
 * consistentes entre si. */
export const DEV_ONBOARDING_TEST_DATA: OnboardingProfileInput = {
  name: 'Usuário Teste',
  birthDate: '1995-06-15',
  occupation: 'Testador(a)',
  isWorking: true,
  workStartTime: '08:00',
  workEndTime: '17:00',
  workSchedule: 'fixa',
  workDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
  shiftPattern: null,
  receiveDuringWorkHours: true,
  wakeTime: '07:00',
  sleepTime: '23:00',
  selectedCategories: [
    'desenvolvimento_pessoal',
    'relacionamentos',
    'familia_presenca',
    'trabalho_produtividade',
    'saude_energia',
    'financas_consumo',
    'aprendizado_curiosidade',
    'bondade_comunidade',
    'fe_espiritualidade',
  ],
  interests: ['music', 'photography', 'technology'],
  otherInterestText: null,
  stillDiscoveringInterests: false,
  importantPeople: [
    { id: 'dev_person_maria', name: 'Maria', relationship: 'conjuge', age: 32, birthDate: null, livesWithUser: true },
    { id: 'dev_person_joao', name: 'João', relationship: 'filho', age: 7, birthDate: null, livesWithUser: true },
  ],
  location: { city: 'Patrocínio', state: 'MG', country: 'Brasil', latitude: -18.9439, longitude: -46.9925 },
  challengeIntensity: 'equilibrado',
  socialMediaUsage: 'varias_vezes_dia',
  socialChallengesInterest: 'sim',
  socialNetworks: ['instagram', 'whatsapp'],
};
