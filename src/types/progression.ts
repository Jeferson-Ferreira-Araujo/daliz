// Desempenho da pessoa por `concept` (ver Challenge.concept em src/types/challenge.ts) — uma
// entrada por concept, não por ação/instância individual, porque a ideia é reconhecer "a pessoa
// vai bem com esse TIPO de coisa", não só "completou essa ação específica de novo" (seção 3/7 do
// pedido de dificuldade adaptativa).
export interface UserActionPerformance {
  concept: string;
  // Nível que representa "onde a pessoa está" nesse concept agora — só sobe quando ela conclui de
  // verdade uma ação do próximo nível (ver progressionService.recordCompletion), nunca só por ter
  // sido oferecida. Começa no `difficulty` da primeira ação concluída desse concept.
  currentDifficulty: number;
  completedCount: number;
  // Zera com um abandono cujo motivo é "foi_dificil" (seção 10) — é o sinal mais forte de que o
  // nível atual não está adequado. Outros motivos de abandono (sem tempo, esqueci, momento
  // inadequado) NÃO zeram — só um lembrete/adiamento também não zera (seção 11) — eles apenas não
  // fazem o contador avançar.
  consecutiveCompletions: number;
  rejectedCount: number;
  reminderCount: number;
  lastCompletedAt: string | null; // ISO
  // 0..1, só informativo por enquanto (reservado pro motor de recomendação futuro, seção 21/23) —
  // não participa da regra de progressão em si (essa usa só `consecutiveCompletions`, seção 25).
  confidence: number;
  // "Nível de conforto" reservado pra seção 16 do pedido (por CATEGORIA de concept, ex:
  // "movimento físico" em geral) — não implementado nesta versão, campo aqui só pra não exigir
  // migração de dados quando for usado. Sempre null até lá.
  comfortLevel: number | null;
}
