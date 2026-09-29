import type { OnboardingProfileInput } from '@/services/profileService';

/** Perfil de teste padrão — usado como rascunho inicial de app/dev/schedule-preview.tsx quando
 * ainda não existe um perfil real salvo. */
export const DEV_ONBOARDING_TEST_DATA: OnboardingProfileInput = {
  name: 'Usuário Teste',
  birthDate: '1995-06-15',
  occupation: 'Testador(a)',
  workContext: null,
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
    'relacionamentos',
    'familia',
    'aprendizado_desenvolvimento',
    'saude_bemestar',
    'rotina_organizacao',
    'trabalho_financas',
    'criatividade_cultura',
    'experiencias_lazer',
    'casa_ambiente',
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
