import { storageClient } from '@/storage/storageClient';

// Chave própria, fora de `STORAGE_KEYS`/`AppPreferences` — é um conceito só do Modo Dev, não faz
// sentido produção carregar essa noção junto das preferências reais do usuário.
const DEV_TEST_HOLD_KEY = '@1pct/devTestHoldDate';

/**
 * Modo Dev: "segura" a geração automática do lote do dia pra uma data específica, logo após
 * "Limpar ações de hoje" (ver devService.clearTodayInstances) — sem isso, o próprio
 * dayCycleService.ensureUpcomingActions veria a data sem nenhuma instância na próxima vez que a
 * Home carregasse e regeneraria um lote aleatório sozinho (é assim que garante que sempre existe
 * alguma ação pro dia em uso normal). Isso escondia o efeito da limpeza e impedia testar a tela
 * inicial genuinamente vazia (ex: simulando um horário de sono, onde não deveria haver ação
 * nenhuma na tela).
 *
 * Persistido (não em memória, ao contrário de devClock) porque precisa sobreviver a navegar pra
 * fora da tela de Modo Dev — no preview web isso já é um reload completo do processo JS, e no app
 * real o SO pode encerrar o processo em segundo plano a qualquer momento; um estado só em memória
 * se perderia exatamente no meio do teste, reproduzindo o mesmo bug que essa trava resolve.
 */
export const devTestHold = {
  async isHeld(activeDate: string): Promise<boolean> {
    if (!__DEV__) return false;
    const held = await storageClient.getItem<string>(DEV_TEST_HOLD_KEY);
    return held === activeDate;
  },

  /** Chamado só por devService.clearTodayInstances. */
  async hold(activeDate: string): Promise<void> {
    if (!__DEV__) return;
    await storageClient.setItem(DEV_TEST_HOLD_KEY, activeDate);
  },

  /** Chamado só por devService.sendChallengeById — a partir daí a data já tem instância própria,
   * não faz mais sentido continuar segurando (ver ensureUpcomingActions, que só olha pra isso
   * quando não existe nenhuma instância salva pra `activeDate`; mas nada impede alguém de limpar
   * de novo depois, então o release aqui evita ficar "preso" segurando uma data já testada). */
  async release(): Promise<void> {
    if (!__DEV__) return;
    await storageClient.removeItem(DEV_TEST_HOLD_KEY);
  },
};
