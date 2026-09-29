/**
 * Camada de orquestração do Modo Desenvolvedor. Tudo aqui chama os mesmos
 * serviços/repositórios usados pelo app normal — nada de regra de negócio
 * duplicada. Este arquivo só existe para provocar, de forma controlada,
 * situações que seriam difíceis de reproduzir manualmente.
 *
 * Assume que já foi chamado dentro de `if (__DEV__)` pela camada de UI
 * (app/dev/schedule-preview.tsx, hoje a única tela do Modo Dev).
 */
import { resolveActiveDate } from '@/services/dayCycleService';
import { notificationService } from '@/services/notificationService';
import { challengeInstanceRepository } from '@/storage/repositories/challengeInstanceRepository';
import { buildInstance } from '@/engine/ChallengeEngine';
import { allChallenges } from '@/data/challenges';
import { getCurrentDate } from '@/utils/now';
import { devTestHold } from '@/dev/devTestHold';
import type { ChallengeInstance, UserProfile } from '@/types';

export const devService = {
  /**
   * Dispara agora a notificação real de uma ação específica do catálogo, pelo id — pra testar
   * cada ação individualmente (ver "Disparar ação individual" em app/dev/schedule-preview.tsx),
   * sem depender de sorteio. Busca sempre em `allChallenges` (nunca uma lista própria), então uma
   * ação removida do catálogo já não aparece pra escolher aqui.
   *
   * De propósito NÃO chama `dayCycleService.ensureUpcomingActions` — isso geraria o lote aleatório
   * do dia inteiro sempre que a data ainda não tiver nenhuma instância (ex: logo após "Limpar ações
   * de hoje"), inundando a tela de cards que não têm nada a ver com o teste (bug real já visto:
   * "clear não limpa"/"vem uma ação diferente a cada abertura"). Testar uma ação individual precisa
   * ficar isolado: só essa instância, nada mais.
   */
  async sendChallengeById(profile: UserProfile, challengeId: string): Promise<ChallengeInstance | null> {
    const challenge = allChallenges.find((c) => c.id === challengeId);
    if (!challenge) return null;

    const now = getCurrentDate();
    let instance = buildInstance(challenge, now, resolveActiveDate(profile, now));
    const notificationId = await notificationService.sendNow(instance);
    instance = { ...instance, notificationId };
    await challengeInstanceRepository.save(instance);
    await devTestHold.release();
    return instance;
  },

  /**
   * Limpa as ações do período acordado atual (a lista "Suas ações de hoje" da Home) — pra testar
   * várias ações via "Disparar ação individual" sem a tela ir acumulando cards.
   * Cancela as notificações já agendadas dessas instâncias antes de apagar. Não mexe no histórico
   * de outros dias (streak/Insights continuam intactos).
   *
   * Também "segura" essa data (ver devTestHold) pra que a Home não preencha sozinha um lote
   * aleatório na próxima vez que carregar — sem isso, `dayCycleService.ensureUpcomingActions`
   * veria zero instâncias e geraria o lote normal do zero de qualquer jeito, escondendo o efeito
   * da limpeza e impedindo testar a tela genuinamente vazia (ex: simulando horário de sono).
   */
  async clearTodayInstances(profile: UserProfile): Promise<void> {
    const activeDate = resolveActiveDate(profile, getCurrentDate());
    const todayInstances = await challengeInstanceRepository.getByDate(activeDate);
    await notificationService.cancelForInstances(todayInstances);
    await challengeInstanceRepository.deleteByDate(activeDate);
    await devTestHold.hold(activeDate);
  },
};
