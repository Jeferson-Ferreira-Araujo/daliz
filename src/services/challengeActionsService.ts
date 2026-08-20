import { challengeInstanceRepository } from '@/storage/repositories/challengeInstanceRepository';
import type { ChallengeInstance } from '@/types';

// `complete`/`abandon`/`resetStatus` foram removidos junto da remoção de Concluir/Não consegui
// (ver plano de migração seção 4) — não existe mais status de conclusão pra registrar. `saveNote`
// continua igual, é independente disso.
export const challengeActionsService = {
  /** Salva o que a pessoa escreveu numa ação que pede anotação (ver ChallengeCard.NoteField). */
  async saveNote(instance: ChallengeInstance, note: string): Promise<ChallengeInstance> {
    const updated: ChallengeInstance = { ...instance, note: note.trim() || null };
    await challengeInstanceRepository.save(updated);
    return updated;
  },
};
