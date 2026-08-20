import { challengeInstanceRepository } from '@/storage/repositories/challengeInstanceRepository';
import { reminderService } from './reminderService';
import { progressionService } from './progressionService';
import { analyticsService } from './analyticsService';
import { getCurrentDate } from '@/utils/now';
import type { AbandonReason, ChallengeInstance, ChallengeReaction } from '@/types';

export const challengeActionsService = {
  async complete(instance: ChallengeInstance, reaction: ChallengeReaction, now: Date = getCurrentDate()): Promise<ChallengeInstance> {
    // Concluir cancela qualquer "Lembrar mais tarde" pendente (ver seção 14 do pedido de
    // lembretes) — senão a pessoa recebe um lembrete de uma ação que já fez.
    await reminderService.cancelNotificationOnly(instance);
    const sentAt = new Date(instance.sentAt).getTime();
    const updated: ChallengeInstance = {
      ...instance,
      status: 'concluido',
      completedAt: now.toISOString(),
      timeToCompleteMs: Math.max(0, now.getTime() - sentAt),
      reaction,
      reminder: null,
    };
    await challengeInstanceRepository.save(updated);
    // Sistema de dificuldade adaptativa (ver progressionService.ts) — só ações com `concept`
    // fazem alguma coisa aqui; pra todo o resto do catálogo isso é um no-op silencioso.
    await progressionService.recordCompletion(updated, now);
    analyticsService.log('action_completed', {
      category: updated.categoria,
      timing: updated.timing,
      reaction,
      timeToCompleteMs: updated.timeToCompleteMs ?? 0,
    });
    return updated;
  },

  async abandon(
    instance: ChallengeInstance,
    reason: AbandonReason,
    detail: string | undefined,
    now: Date = getCurrentDate(),
  ): Promise<ChallengeInstance> {
    // Mesmo motivo do `complete`: rejeitar também cancela o lembrete pendente, se houver.
    await reminderService.cancelNotificationOnly(instance);
    const updated: ChallengeInstance = {
      ...instance,
      status: 'nao_concluido',
      completedAt: now.toISOString(),
      abandonReason: reason,
      abandonReasonDetail: reason === 'outro' ? (detail ?? null) : null,
      reminder: null,
    };
    await challengeInstanceRepository.save(updated);
    await progressionService.recordRejection(updated, reason);
    analyticsService.log('action_not_completed', {
      category: updated.categoria,
      timing: updated.timing,
      reason,
    });
    return updated;
  },

  /** Salva o que a pessoa escreveu numa ação que pede anotação (ver ChallengeCard.NoteField).
   * Independente de status — pode ser chamado antes, durante ou depois de concluir a ação. */
  async saveNote(instance: ChallengeInstance, note: string): Promise<ChallengeInstance> {
    const updated: ChallengeInstance = { ...instance, note: note.trim() || null };
    await challengeInstanceRepository.save(updated);
    return updated;
  },

  /** Volta uma instância para "pendente", limpando campos de conclusão/abandono. */
  async resetStatus(instance: ChallengeInstance): Promise<ChallengeInstance> {
    const updated: ChallengeInstance = {
      ...instance,
      status: 'pendente',
      completedAt: null,
      timeToCompleteMs: null,
      reaction: null,
      abandonReason: null,
      abandonReasonDetail: null,
    };
    await challengeInstanceRepository.save(updated);
    return updated;
  },
};
