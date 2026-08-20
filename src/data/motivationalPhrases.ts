export const MOTIVATIONAL_PHRASES: string[] = [
  'Pequenas ações, grandes mudanças.',
  'Você não precisa mudar sua vida hoje. Só precisa terminar o dia 1% melhor.',
  'Pequenas ações, todos os dias.',
  'O progresso não avisa — ele acumula.',
  'Hoje só precisa ser um pouquinho melhor que ontem.',
  'Um passo pequeno ainda é um passo.',
  'Você não precisa de um dia perfeito. Só de um dia melhor.',
  'Consistência vale mais que intensidade.',
  'Cada 1% conta, mesmo quando não parece.',
];

export function motivationalPhraseForDate(dateISO: string): string {
  let hash = 0;
  for (let i = 0; i < dateISO.length; i += 1) {
    hash = (hash * 31 + dateISO.charCodeAt(i)) >>> 0;
  }
  return MOTIVATIONAL_PHRASES[hash % MOTIVATIONAL_PHRASES.length];
}
