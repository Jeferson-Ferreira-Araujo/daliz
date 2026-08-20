import { challengeInstanceRepository } from '@/storage/repositories/challengeInstanceRepository';
import { notificationService } from './notificationService';
import { analyticsService } from './analyticsService';
import { progressionService } from './progressionService';
import { getCurrentDate } from '@/utils/now';
import type { ChallengeInstance, ReminderType } from '@/types';

export const reminderService = {
  /**
   * Agenda (ou substitui, se já existir um) o lembrete de uma instância — "Lembrar mais tarde"
   * funciona pra qualquer `timing` (now/today/contextual), o campo não é tocado (ver seção 17 do
   * pedido: `timing` = quando a ação naturalmente faz sentido, `reminder` = quando a pessoa pediu
   * pra ser avisada de novo, são conceitos independentes). Nunca deixa dois lembretes agendados
   * pra mesma instância — cancela a notificação anterior antes de agendar a nova (seção 10).
   */
  async schedule(instance: ChallengeInstance, scheduledFor: Date, reminderType: ReminderType): Promise<ChallengeInstance> {
    analyticsService.log('action_reminder_requested', { actionId: instance.challengeId, timing: instance.timing, reminderType });

    if (instance.reminder?.notificationId) {
      await notificationService.cancelNotification(instance.reminder.notificationId);
    }
    const notificationId = await notificationService.scheduleReminder(instance, scheduledFor);

    const updated: ChallengeInstance = {
      ...instance,
      reminder: {
        scheduledFor: scheduledFor.toISOString(),
        notificationId,
        createdAt: getCurrentDate().toISOString(),
        type: 'one_time',
      },
      reminderCount: (instance.reminderCount ?? 0) + 1,
    };
    await challengeInstanceRepository.save(updated);
    // Adiar não é sinal de dificuldade (seção 11 do pedido de dificuldade adaptativa) — só soma
    // ao contador, nunca mexe em consistência/currentDifficulty.
    await progressionService.recordReminder(updated);

    analyticsService.log('action_reminder_scheduled', {
      actionId: instance.challengeId,
      timing: instance.timing,
      reminderType,
      reminderCount: updated.reminderCount,
    });
    return updated;
  },

  /** "Cancelar lembrete" explícito (ver seção 20) — cancela a notificação nativa e limpa o campo. */
  async cancel(instance: ChallengeInstance): Promise<ChallengeInstance> {
    if (!instance.reminder) return instance;
    if (instance.reminder.notificationId) {
      await notificationService.cancelNotification(instance.reminder.notificationId);
    }
    const updated: ChallengeInstance = { ...instance, reminder: null };
    await challengeInstanceRepository.save(updated);
    return updated;
  },

  /**
   * Só cancela a notificação nativa, sem persistir — usado por challengeActionsService.complete/
   * abandon, que já vão salvar o próprio objeto atualizado (com `reminder: null` incluído) numa
   * única escrita (seção 14: concluir/rejeitar cancela qualquer lembrete pendente).
   */
  async cancelNotificationOnly(instance: ChallengeInstance): Promise<void> {
    if (instance.reminder?.notificationId) {
      await notificationService.cancelNotification(instance.reminder.notificationId);
    }
  },
};
