import type { Challenge, ChallengeInstance, UserProfile } from '@/types';

/** Perfil sintético mínimo — acordado o dia inteiro, sem trabalho, todas as 9 categorias
 * selecionadas, equilibrado. Fixture única reaproveitada pelos testes; cada teste sobrescreve só
 * os campos que importam pro cenário. */
export function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  const now = '2026-01-01T00:00:00.000Z';
  return {
    name: 'Teste',
    birthDate: '1990-01-01',
    occupation: 'Teste',
    workContext: null,
    photoUri: null,
    isWorking: false,
    workStartTime: null,
    workEndTime: null,
    workSchedule: 'fixa',
    workDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
    shiftPattern: null,
    receiveDuringWorkHours: true,
    wakeTime: '06:00',
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
    challengeIntensity: 'equilibrado',
    socialMediaUsage: 'as_vezes',
    socialChallengesInterest: 'as_vezes',
    socialNetworks: [],
    interests: [],
    otherInterestText: null,
    stillDiscoveringInterests: false,
    discoveredInterests: [],
    importantPeople: [],
    location: null,
    notificationsEnabled: false,
    onboardingCompletedAt: now,
    createdAt: now,
    termsAcceptedAt: now,
    firstActionState: 'completed',
    firstActionInstanceId: null,
    ...overrides,
  };
}

let counter = 0;

/** Desafio sintético mínimo — 'today', qualquer momento/dia, sem nenhuma restrição estruturada
 * (interests/resources/location/profile todos vazios = "sem restrição"), como a maioria do
 * catálogo real. Cada teste sobrescreve só os campos que importam pro cenário. */
export function makeChallenge(overrides: Partial<Challenge> = {}): Challenge {
  counter += 1;
  return {
    id: `test_${counter}`,
    categoria: 'aprendizado_desenvolvimento',
    titulo: `Ação de teste ${counter}`,
    tipo: 'acao',
    horariosIdeais: ['qualquer'],
    diasIdeais: 'qualquer',
    tags: [],
    momentos: ['qualquer'],
    tiposDia: ['qualquer'],
    contexto: ['qualquer'],
    tempoEstimado: 5,
    difficulty: 2,
    ...overrides,
  };
}

export function makeInstance(overrides: Partial<ChallengeInstance> = {}): ChallengeInstance {
  counter += 1;
  return {
    id: `inst_${counter}`,
    challengeId: `test_${counter}`,
    categoria: 'aprendizado_desenvolvimento',
    titulo: `Ação de teste ${counter}`,
    tempoEstimado: 5,
    interests: [],
    relatedPersonId: null,
    date: '2026-01-01',
    scheduledFor: '2026-01-01T10:00:00.000Z',
    deliveredAt: '2026-01-01T10:00:00.000Z',
    completedAt: null,
    dismissedAt: null,
    skippedAt: null,
    notificationId: null,
    type: 'acao',
    ...overrides,
  };
}
