import { challengeInstanceRepository } from '@/storage/repositories/challengeInstanceRepository';
import { reminderService } from './reminderService';
import type { ChallengeInstance, ChallengeReaction } from '@/types';
import { getCurrentDate } from '@/utils/now';

// `complete`/`abandon`/`resetStatus` foram removidos junto da remoção de Concluir/Não consegui
// (ver plano de migração seção 4) — não existe mais botão obrigatório de conclusão. `saveNote`
// continua igual, é independente disso. `setReaction` também: "como você se sentiu" voltou a
// existir, mas como marcação opcional a qualquer momento — só que agora É o sinal de que a ação
// foi feita (marca `completedAt` na primeira vez, ver comentário em ChallengeInstance), pra
// alimentar insights sem reativar um fluxo obrigatório de Concluir/Não consegui.
export const challengeActionsService = {
  /** Salva o que a pessoa escreveu numa ação que pede anotação (ver ChallengeCard.NoteField). */
  async saveNote(instance: ChallengeInstance, note: string): Promise<ChallengeInstance> {
    const updated: ChallengeInstance = { ...instance, note: note.trim() || null };
    await challengeInstanceRepository.save(updated);
    return updated;
  },

  /** Salva como a ação fez a pessoa se sentir (ver ChallengeCard.ReactionPicker) e, na primeira
   * vez, marca `completedAt` — reagir é o próprio sinal de que a ação foi feita, sem precisar de
   * um botão de conclusão à parte. Trocar a reação depois (ex: de "Foi bom" pra "Foi difícil")
   * não mexe em `completedAt`, que fica congelado no primeiro momento em que a pessoa reagiu.
   *
   * Também cancela qualquer lembrete pendente ("Lembrar mais tarde" já some da tela nesse caso,
   * ver ChallengeCard) — reagir já indica que a pessoa fez/viveu a ação agora, então um lembrete
   * pra ela "de novo" mais tarde não faz mais sentido.
   */
  async setReaction(instance: ChallengeInstance, reaction: ChallengeReaction): Promise<ChallengeInstance> {
    if (instance.reminder) await reminderService.cancelNotificationOnly(instance);
    const updated: ChallengeInstance = {
      ...instance,
      reaction,
      reminder: null,
      completedAt: instance.completedAt ?? getCurrentDate().toISOString(),
    };
    await challengeInstanceRepository.save(updated);
    return updated;
  },
};
