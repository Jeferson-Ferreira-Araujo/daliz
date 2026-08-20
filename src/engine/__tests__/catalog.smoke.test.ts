import { allChallenges } from '@/data/challenges';
import { selectDailyChallenges } from '../ChallengeEngine';
import { makeProfile } from './fixtures';

// Smoke test contra o catálogo REAL (não os fixtures sintéticos dos outros testes) — só garante
// que a base carrega sem erro de tipo/runtime e que o motor consegue gerar um dia normalmente pra
// cada intensidade. Lento/frágil a mudança de conteúdo de propósito não é usado nos testes de
// regressão do motor (ver ChallengeEngine.test.ts).
describe('catálogo real', () => {
  it('carrega sem ids duplicados', () => {
    const ids = allChallenges.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('tem pelo menos uma ação por categoria oficial', () => {
    const categories = new Set(allChallenges.map((c) => c.categoria));
    expect(categories.size).toBe(10);
  });

  it.each(['leve', 'equilibrado', 'desafiador'] as const)(
    'gera um dia normalmente pra intensidade %s',
    (challengeIntensity) => {
      const profile = makeProfile({ challengeIntensity, wakeTime: '06:00', sleepTime: '23:00' });
      const instances = selectDailyChallenges(profile, [], new Date('2026-01-01T06:00:00'));
      expect(instances.length).toBeGreaterThan(0);
    },
  );
});
