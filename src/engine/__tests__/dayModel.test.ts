import { computeDaySlots, remainingDayRatio, sleepDeadlineFor } from '../dayModel';
import { makeProfile } from './fixtures';

describe('computeDaySlots', () => {
  it('gera slots dentro da janela acordado→dormir quando o dia mal começou', () => {
    const profile = makeProfile({ wakeTime: '06:00', sleepTime: '23:00' });
    const now = new Date('2026-01-01T06:30:00');
    const slots = computeDaySlots(profile, now);

    expect(slots.length).toBeGreaterThan(0);
    for (const slot of slots) {
      expect(slot.start.getTime()).toBeGreaterThanOrEqual(now.getTime());
      expect(slot.end.getTime()).toBeGreaterThan(slot.start.getTime());
    }
  });

  it('não gera slot algum depois do horário de dormir', () => {
    const profile = makeProfile({ wakeTime: '06:00', sleepTime: '23:00' });
    const now = new Date('2026-01-01T23:30:00');
    const slots = computeDaySlots(profile, now);
    expect(slots).toHaveLength(0);
  });

  it('cobre rotina que atravessa a meia-noite (acorda à tarde, dorme de manhã)', () => {
    const profile = makeProfile({ wakeTime: '16:00', sleepTime: '10:00' });
    const now = new Date('2026-01-01T20:00:00');
    const slots = computeDaySlots(profile, now);
    expect(slots.length).toBeGreaterThan(0);
    // Nenhum slot pode terminar depois das 10h do dia seguinte (horário de dormir).
    const deadline = new Date('2026-01-02T10:00:00').getTime();
    for (const slot of slots) {
      expect(slot.end.getTime()).toBeLessThanOrEqual(deadline);
    }
  });
});

describe('remainingDayRatio', () => {
  it('retorna 1 quando o dia inteiro ainda está pela frente', () => {
    const profile = makeProfile({ wakeTime: '06:00', sleepTime: '23:00' });
    const now = new Date('2026-01-01T06:00:00');
    expect(remainingDayRatio(profile, now)).toBeCloseTo(1, 1);
  });

  it('se aproxima de 0 perto da hora de dormir', () => {
    const profile = makeProfile({ wakeTime: '06:00', sleepTime: '23:00' });
    const now = new Date('2026-01-01T22:55:00');
    expect(remainingDayRatio(profile, now)).toBeLessThan(0.1);
  });
});

describe('sleepDeadlineFor', () => {
  it('usa o horário de dormir a partir da meia-noite da data informada, mesmo atravessando o dia seguinte', () => {
    const profile = makeProfile({ wakeTime: '16:00', sleepTime: '10:00' });
    const deadline = sleepDeadlineFor('2026-01-01', profile);
    expect(deadline.toISOString()).toBe(new Date('2026-01-02T10:00:00').toISOString());
  });
});
