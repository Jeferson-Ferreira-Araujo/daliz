import type { WorkContext } from './challenge';

// Um item da CBO (Classificação Brasileira de Ocupações) — `codigo` só existe pra referência/
// depuração, o motor nunca lê ele diretamente (ver occupationService.deriveWorkContext, que
// classifica pelo texto de `termo`, não pelo código). `workContext` já vem pré-calculado (ver
// occupationService) pra não recalcular a cada busca.
export interface OccupationEntry {
  codigo: string;
  termo: string;
  workContext: WorkContext | null;
}
