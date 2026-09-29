import { makeInstance } from '@/engine/__tests__/fixtures';
import type { ChallengeInstance } from '@/types';

// `statsService` lê tudo via challengeInstanceRepository.getAll() — mockado aqui pra controlar
// exatamente que instâncias "existem" em cada teste, sem depender de AsyncStorage de verdade.
let mockInstances: ChallengeInstance[] = [];
jest.mock('@/storage/repositories/challengeInstanceRepository', () => ({
  challengeInstanceRepository: {
    getAll: () => Promise.resolve(mockInstances),
  },
}));

import { statsService } from '../statsService';

function setInstances(next: ChallengeInstance[]) {
  mockInstances = next;
}

// Sempre construído a partir de componentes locais (nunca uma string ISO com "Z" fixa) — o
// mesmo instante em UTC cai num dia diferente dependendo do fuso da máquina que roda o teste,
// e `statsService` extrai o dia via getters locais (`toISODate`). Manter tudo local evita testes
// que só passam no fuso de quem escreveu.
function local(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(year, month - 1, day, hour, minute);
}

describe('getPresenceSummary', () => {
  afterEach(() => setInstances([]));

  it('não conta ações cujo deliveredAt ainda está no futuro (ver bug real: motor grava deliveredAt na criação, não na revelação)', async () => {
    const now = local(2026, 1, 15, 12, 0);
    setInstances([
      makeInstance({ date: '2026-01-15', deliveredAt: local(2026, 1, 15, 8, 0).toISOString() }), // já revelada
      makeInstance({ date: '2026-01-15', deliveredAt: local(2026, 1, 15, 18, 0).toISOString() }), // ainda não
    ]);

    const summary = await statsService.getPresenceSummary(now);

    expect(summary.totalDelivered).toBe(1);
    expect(summary.deliveredThisWeek).toBe(1);
  });

  it('ignora instâncias com deliveredAt nulo (nunca chegaram a ser entregues)', async () => {
    setInstances([makeInstance({ deliveredAt: null })]);

    const summary = await statsService.getPresenceSummary(local(2026, 1, 15, 12, 0));
    expect(summary.totalDelivered).toBe(0);
  });

  it('deliveredThisWeek só conta a semana atual (segunda a domingo)', async () => {
    // 2026-01-15 é uma quinta-feira; a semana vai de 2026-01-12 (seg) a 2026-01-18 (dom).
    const now = local(2026, 1, 15, 12, 0);
    setInstances([
      makeInstance({ date: '2026-01-12', deliveredAt: local(2026, 1, 12, 8, 0).toISOString() }), // segunda desta semana
      makeInstance({ date: '2026-01-15', deliveredAt: local(2026, 1, 15, 8, 0).toISOString() }), // hoje
      makeInstance({ date: '2026-01-11', deliveredAt: local(2026, 1, 11, 8, 0).toISOString() }), // domingo passado
    ]);

    const summary = await statsService.getPresenceSummary(now);
    expect(summary.deliveredThisWeek).toBe(2);
    expect(summary.totalDelivered).toBe(3);
  });

  it('daysActiveThisWeek conta dias distintos, não ações', async () => {
    const now = local(2026, 1, 15, 12, 0);
    setInstances([
      makeInstance({ date: '2026-01-15', deliveredAt: local(2026, 1, 15, 8, 0).toISOString() }),
      makeInstance({ date: '2026-01-15', deliveredAt: local(2026, 1, 15, 9, 0).toISOString() }),
      makeInstance({ date: '2026-01-14', deliveredAt: local(2026, 1, 14, 8, 0).toISOString() }),
    ]);

    const summary = await statsService.getPresenceSummary(now);
    expect(summary.deliveredThisWeek).toBe(3);
    expect(summary.daysActiveThisWeek).toBe(2);
  });

  it('currentStreak conta dias seguidos até hoje, e para no primeiro buraco', async () => {
    const now = local(2026, 1, 15, 12, 0);
    setInstances([
      makeInstance({ date: '2026-01-15', deliveredAt: local(2026, 1, 15, 8, 0).toISOString() }),
      makeInstance({ date: '2026-01-14', deliveredAt: local(2026, 1, 14, 8, 0).toISOString() }),
      makeInstance({ date: '2026-01-13', deliveredAt: local(2026, 1, 13, 8, 0).toISOString() }),
      // buraco em 2026-01-12
      makeInstance({ date: '2026-01-10', deliveredAt: local(2026, 1, 10, 8, 0).toISOString() }),
    ]);

    const summary = await statsService.getPresenceSummary(now);
    expect(summary.currentStreak).toBe(3);
    expect(summary.bestStreak).toBe(3);
  });

  it('currentStreak continua contando se a última ação foi ontem (hoje ainda não chegou nada)', async () => {
    const now = local(2026, 1, 15, 6, 0);
    setInstances([makeInstance({ date: '2026-01-14', deliveredAt: local(2026, 1, 14, 8, 0).toISOString() })]);

    const summary = await statsService.getPresenceSummary(now);
    expect(summary.currentStreak).toBe(1);
  });

  it('currentStreak zera se o último dia com ação não foi nem hoje nem ontem', async () => {
    const now = local(2026, 1, 15, 12, 0);
    setInstances([makeInstance({ date: '2026-01-10', deliveredAt: local(2026, 1, 10, 8, 0).toISOString() })]);

    const summary = await statsService.getPresenceSummary(now);
    expect(summary.currentStreak).toBe(0);
  });

  it('completedCount e reactionBreakdown só contam quem marcou reação', async () => {
    // `completedAt` é gravado junto da reação por challengeActionsService.setReaction — reproduzido
    // aqui porque statsService só lê o que já está salvo, não deriva um a partir do outro.
    const now = local(2026, 1, 15, 12, 0);
    setInstances([
      makeInstance({
        date: '2026-01-15',
        deliveredAt: local(2026, 1, 15, 8, 0).toISOString(),
        reaction: 'foi_bom',
        completedAt: local(2026, 1, 15, 8, 0).toISOString(),
      }),
      makeInstance({
        date: '2026-01-15',
        deliveredAt: local(2026, 1, 15, 9, 0).toISOString(),
        reaction: 'foi_bom',
        completedAt: local(2026, 1, 15, 9, 0).toISOString(),
      }),
      makeInstance({ date: '2026-01-15', deliveredAt: local(2026, 1, 15, 10, 0).toISOString(), reaction: null }),
    ]);

    const summary = await statsService.getPresenceSummary(now);
    expect(summary.completedCount).toBe(2);
    expect(summary.reactionBreakdown).toEqual([{ reaction: 'foi_bom', count: 2 }]);
  });

  it('recentNotes só inclui anotações não vazias, mais recente primeiro', async () => {
    const now = local(2026, 1, 15, 12, 0);
    setInstances([
      makeInstance({ scheduledFor: local(2026, 1, 14, 8, 0).toISOString(), note: 'primeira' }),
      makeInstance({ scheduledFor: local(2026, 1, 15, 8, 0).toISOString(), note: 'segunda' }),
      makeInstance({ scheduledFor: local(2026, 1, 15, 9, 0).toISOString(), note: '   ' }), // só espaço, não conta
      makeInstance({ scheduledFor: local(2026, 1, 15, 10, 0).toISOString(), note: null }),
    ]);

    const summary = await statsService.getPresenceSummary(now);
    expect(summary.recentNotes.map((n) => n.note)).toEqual(['segunda', 'primeira']);
  });

  it('categoryBreakdown ignora ações entregues há mais de 30 dias', async () => {
    const now = local(2026, 1, 31, 12, 0);
    setInstances([
      makeInstance({ date: '2026-01-30', deliveredAt: local(2026, 1, 30, 8, 0).toISOString(), categoria: 'saude_bemestar' }),
      // Fora da janela de 30 dias antes de 2026-01-31.
      makeInstance({ date: '2025-12-01', deliveredAt: local(2025, 12, 1, 8, 0).toISOString(), categoria: 'saude_bemestar' }),
    ]);

    const summary = await statsService.getPresenceSummary(now);
    expect(summary.categoryBreakdown).toEqual([{ categoria: 'saude_bemestar', count: 1 }]);
  });
});
