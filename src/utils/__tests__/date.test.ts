import {
  addDays,
  calculateAge,
  daysBetween,
  endOfWeek,
  isBirthdayToday,
  logicalDateFor,
  resolvePersonAge,
  startOfWeek,
  toISODate,
  yesterdayOf,
} from '../date';

describe('toISODate / logicalDateFor', () => {
  it('formata como YYYY-MM-DD com zero à esquerda', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('vira o dia lógico exatamente à meia-noite, não às 3h como o modelo antigo', () => {
    expect(logicalDateFor(new Date(2026, 0, 1, 23, 59))).toBe('2026-01-01');
    expect(logicalDateFor(new Date(2026, 0, 2, 0, 0))).toBe('2026-01-02');
    expect(logicalDateFor(new Date(2026, 0, 2, 1, 30))).toBe('2026-01-02');
  });
});

describe('addDays / yesterdayOf', () => {
  it('soma e subtrai dias respeitando virada de mês/ano', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(yesterdayOf('2026-03-01')).toBe('2026-02-28');
  });
});

describe('startOfWeek / endOfWeek', () => {
  it('semana começa na segunda, mesmo quando dateISO é domingo', () => {
    // 2026-01-04 é um domingo.
    expect(startOfWeek('2026-01-04')).toBe('2025-12-29');
    expect(endOfWeek('2026-01-04')).toBe('2026-01-04');
  });

  it('semana começa na segunda quando dateISO já é segunda', () => {
    // 2026-01-05 é uma segunda-feira.
    expect(startOfWeek('2026-01-05')).toBe('2026-01-05');
    expect(endOfWeek('2026-01-05')).toBe('2026-01-11');
  });

  it('meio da semana cai na mesma semana seg-dom', () => {
    // 2026-01-08 é uma quinta-feira da mesma semana que 2026-01-05.
    expect(startOfWeek('2026-01-08')).toBe('2026-01-05');
    expect(endOfWeek('2026-01-08')).toBe('2026-01-11');
  });
});

describe('daysBetween', () => {
  it('conta dias corridos entre duas datas, na ordem a→b', () => {
    expect(daysBetween('2026-01-01', '2026-01-02')).toBe(1);
    expect(daysBetween('2026-01-01', '2026-01-01')).toBe(0);
    expect(daysBetween('2026-01-02', '2026-01-01')).toBe(-1);
  });
});

describe('calculateAge', () => {
  it('já fez aniversário este ano', () => {
    expect(calculateAge('1990-03-10', new Date(2026, 5, 1))).toBe(36);
  });

  it('ainda não fez aniversário este ano', () => {
    expect(calculateAge('1990-12-10', new Date(2026, 5, 1))).toBe(35);
  });

  it('o próprio dia do aniversário já conta a idade nova', () => {
    expect(calculateAge('1990-06-01', new Date(2026, 5, 1))).toBe(36);
  });
});

describe('isBirthdayToday', () => {
  it('compara só mês e dia, independente do ano de nascimento', () => {
    expect(isBirthdayToday('1990-06-01', new Date(2026, 5, 1))).toBe(true);
    expect(isBirthdayToday('1990-06-02', new Date(2026, 5, 1))).toBe(false);
  });
});

describe('resolvePersonAge', () => {
  it('recalcula a partir de birthDate quando existir, ignorando o age estático desatualizado', () => {
    // Cadastrada com "3 anos" há tempos; birthDate real indica que já fez 5 anos.
    const person = { age: 3, birthDate: '2021-01-10' };
    expect(resolvePersonAge(person, new Date(2026, 5, 1))).toBe(5);
  });

  it('cai pro age estático quando não há birthDate (nunca dá pra recalcular)', () => {
    const person = { age: 8, birthDate: null };
    expect(resolvePersonAge(person, new Date(2026, 5, 1))).toBe(8);
  });

  it('retorna null quando não há nem age nem birthDate', () => {
    const person = { age: null, birthDate: null };
    expect(resolvePersonAge(person, new Date(2026, 5, 1))).toBeNull();
  });
});
