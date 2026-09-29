import { makeChallenge, makeInstance, makeProfile } from './fixtures';
import type { Challenge } from '@/types';

// `ChallengeEngine.ts` lê o catálogo do módulo `@/data/challenges` (allChallenges/challengeById) —
// mockamos esse módulo pra controlar exatamente quais desafios existem em cada teste, sem
// depender do catálogo real (que muda de conteúdo com frequência). Variáveis referenciadas dentro
// do factory de `jest.mock` precisam ser "auto-mockable" (self-contained ou prefixadas com
// `mock`), por isso o catálogo mutável fica num objeto `mockCatalog` controlado pelos testes.
const mockCatalog: { challenges: Challenge[] } = { challenges: [] };

jest.mock('@/data/challenges', () => ({
  get allChallenges() {
    return mockCatalog.challenges;
  },
  get challengeById() {
    return Object.fromEntries(mockCatalog.challenges.map((c) => [c.id, c]));
  },
  getInstanceTiming: jest.requireActual('@/data/challenges').getInstanceTiming,
  getInstanceActionKind: jest.requireActual('@/data/challenges').getInstanceActionKind,
}));

import { explainNextChallenge, selectDailyChallenges } from '../ChallengeEngine';

function setCatalog(challenges: Challenge[]) {
  mockCatalog.challenges = challenges;
}

const NOW = new Date('2026-01-01T10:00:00');

describe('filterCandidatesForSlot (via explainNextChallenge)', () => {
  it('nunca bloqueia por interesse ausente — catálogo sem nenhuma exigência continua elegível', () => {
    const challenge = makeChallenge({ interests: { required: [], preferred: [], excluded: [] } });
    setCatalog([challenge]);
    const profile = makeProfile({ interests: [] });
    const result = explainNextChallenge(profile, [], NOW);
    expect(result.instance?.challengeId).toBe(challenge.id);
  });

  it('bloqueia quando interests.required não bate com o perfil', () => {
    const challenge = makeChallenge({ interests: { required: ['music'], preferred: [], excluded: [] } });
    setCatalog([challenge]);
    const profile = makeProfile({ interests: [] });
    const result = explainNextChallenge(profile, [], NOW);
    expect(result.instance).toBeNull();
    expect(result.candidateCount).toBe(0);
  });

  it('libera quando interests.required bate com o perfil', () => {
    const challenge = makeChallenge({ interests: { required: ['music'], preferred: [], excluded: [] } });
    setCatalog([challenge]);
    const profile = makeProfile({ interests: ['music'] });
    const result = explainNextChallenge(profile, [], NOW);
    expect(result.instance?.challengeId).toBe(challenge.id);
  });

  it('bloqueia quando interests.excluded bate com o perfil', () => {
    const challenge = makeChallenge({ interests: { required: [], preferred: [], excluded: ['music'] } });
    setCatalog([challenge]);
    const profile = makeProfile({ interests: ['music'] });
    const result = explainNextChallenge(profile, [], NOW);
    expect(result.instance).toBeNull();
  });

  it('bloqueia location.required quando o perfil não tem localização', () => {
    const challenge = makeChallenge({ location: { required: true, type: 'nearby' } });
    setCatalog([challenge]);
    const profile = makeProfile({ location: null });
    const result = explainNextChallenge(profile, [], NOW);
    expect(result.instance).toBeNull();
  });

  it('libera location.required quando o perfil tem localização', () => {
    const challenge = makeChallenge({ location: { required: true, type: 'nearby' } });
    setCatalog([challenge]);
    const profile = makeProfile({ location: { city: 'Patrocínio', state: 'MG', country: 'Brasil', latitude: -18.9, longitude: -46.9 } });
    const result = explainNextChallenge(profile, [], NOW);
    expect(result.instance?.challengeId).toBe(challenge.id);
  });

  it('repetition.allowed=false bloqueia pra sempre depois da primeira aparição no histórico', () => {
    const challenge = makeChallenge({ repetition: { allowed: false, minIntervalDays: null } });
    setCatalog([challenge]);
    const profile = makeProfile();
    const history = [makeInstance({ challengeId: challenge.id, date: '2025-01-01' })]; // há 1 ano
    const result = explainNextChallenge(profile, history, NOW);
    expect(result.instance).toBeNull();
  });

  it('repetition.minIntervalDays respeita o cooldown', () => {
    const challenge = makeChallenge({ repetition: { allowed: true, minIntervalDays: 30 } });
    setCatalog([challenge]);
    const profile = makeProfile();
    const recentHistory = [makeInstance({ challengeId: challenge.id, date: '2025-12-30' })]; // 2 dias atrás
    expect(explainNextChallenge(profile, recentHistory, NOW).instance).toBeNull();

    const oldHistory = [makeInstance({ challengeId: challenge.id, date: '2025-11-01' })]; // >30 dias atrás
    expect(explainNextChallenge(profile, oldHistory, NOW).instance?.challengeId).toBe(challenge.id);
  });

  it('conceptGroup cooldown bloqueia uma ação diferente do mesmo grupo dentro da janela', () => {
    const other = makeChallenge({ conceptGroup: 'strengthen_connection' });
    const challenge = makeChallenge({ conceptGroup: 'strengthen_connection' });
    setCatalog([challenge]);
    const profile = makeProfile();
    // `other` apareceu ontem, mesmo conceptGroup — challenge.conceptGroup ainda em cooldown mesmo
    // sendo um id diferente.
    const history = [makeInstance({ challengeId: other.id, conceptGroup: 'strengthen_connection', date: '2025-12-31' })];
    const result = explainNextChallenge(profile, history, NOW);
    expect(result.instance).toBeNull();
  });

  it('profile.required só libera quando o sinal derivado do perfil bate', () => {
    const challenge = makeChallenge({ profile: { required: ['has_children'], preferred: [], excluded: [] } });
    setCatalog([challenge]);
    const withoutChildren = makeProfile({ importantPeople: [] });
    expect(explainNextChallenge(withoutChildren, [], NOW).instance).toBeNull();

    const withChildren = makeProfile({
      importantPeople: [{ id: 'p1', name: 'Filho', relationship: 'filho', age: 8, birthDate: null, livesWithUser: true }],
    });
    expect(explainNextChallenge(withChildren, [], NOW).instance?.challengeId).toBe(challenge.id);
  });

  it('não seleciona candidato fora da categoria escolhida pelo perfil', () => {
    const challenge = makeChallenge({ categoria: 'trabalho_financas' });
    setCatalog([challenge]);
    const profile = makeProfile({ selectedCategories: ['saude_bemestar'] });
    expect(explainNextChallenge(profile, [], NOW).instance).toBeNull();
  });

  it('minAge/maxAge recalculam a idade a partir de birthDate, não travam na idade digitada no cadastro', () => {
    // Desafio só faz sentido pra alguém de 10+ anos (ex: "combine algo com..." que exige
    // autonomia). Pessoa foi cadastrada com "8 anos" há tempos, mas o birthDate real já indica
    // 11 anos hoje — sem recalcular, o motor nunca liberaria essa ação pra ela.
    const challenge = makeChallenge({ relationships: ['filho'], minAge: 10 });
    setCatalog([challenge]);
    const profile = makeProfile({
      importantPeople: [
        { id: 'p1', name: 'Filho', relationship: 'filho', age: 8, birthDate: '2014-06-15', livesWithUser: true },
      ],
    });
    // NOW = 2026-01-01 → já fez aniversário de 2025 (junho), então tem 11 anos completos.
    expect(explainNextChallenge(profile, [], NOW).instance?.challengeId).toBe(challenge.id);
  });

  it('minAge/maxAge sem birthDate continuam usando o age estático (fallback documentado)', () => {
    const challenge = makeChallenge({ relationships: ['filho'], minAge: 10 });
    setCatalog([challenge]);
    const profile = makeProfile({
      importantPeople: [{ id: 'p1', name: 'Filho', relationship: 'filho', age: 8, birthDate: null, livesWithUser: true }],
    });
    expect(explainNextChallenge(profile, [], NOW).instance).toBeNull();
  });
});

describe('selectDailyChallenges — quantidade por dia', () => {
  it('respeita a faixa de intensidade (equilibrado, dia inteiro: 8-12) quando há candidatos suficientes', () => {
    const challenges = Array.from({ length: 40 }, () => makeChallenge());
    setCatalog(challenges);
    const profile = makeProfile({ challengeIntensity: 'equilibrado', wakeTime: '06:00', sleepTime: '23:00' });
    const wakeUpNow = new Date('2026-01-01T06:00:00');
    const instances = selectDailyChallenges(profile, [], wakeUpNow);
    expect(instances.length).toBeGreaterThanOrEqual(8);
    expect(instances.length).toBeLessThanOrEqual(12);
  });

  it('reduz a faixa quando o expediente não recebe ações (perde um pedaço grande do dia)', () => {
    const challenges = Array.from({ length: 40 }, () => makeChallenge());
    setCatalog(challenges);
    const profile = makeProfile({
      challengeIntensity: 'equilibrado',
      wakeTime: '06:00',
      sleepTime: '23:00',
      isWorking: true,
      workStartTime: '09:00',
      workEndTime: '18:00',
      workSchedule: 'fixa',
      workDays: ['qui'], // 2026-01-01 é quinta
      receiveDuringWorkHours: false,
    });
    const wakeUpNow = new Date('2026-01-01T06:00:00');
    const instances = selectDailyChallenges(profile, [], wakeUpNow);
    expect(instances.length).toBeGreaterThanOrEqual(6);
    expect(instances.length).toBeLessThanOrEqual(9);
  });
});
