/**
 * Registro livre de texto que a pessoa escreve sobre um dia específico — como se
 * sentiu, o que aconteceu. Guardado à parte do histórico de desafios porque tem um
 * uso futuro diferente (ex: extração de sentimento), não é uma métrica de conclusão.
 */
export interface DayJournalEntry {
  date: string; // "YYYY-MM-DD"
  text: string;
  updatedAt: string; // ISO datetime
}
