import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getCurrentDate } from '@/utils/now';
import { getInstanceActionKind, getInstanceTiming } from '@/data/challenges';
import { TIMING_NOTIFICATION_TITLE, pickNotificationTeaser, pickSuggestionNotificationTeaser } from '@/engine/challengeTiming';
import type { ChallengeInstance } from '@/types';

// Usado só pelas notificações genéricas, não ligadas a uma ação específica (teste, lembrete de
// diário) — a notificação de uma ação usa TIMING_NOTIFICATION_TITLE (ver notificationTitleFor).
export const NOTIFICATION_TITLE = 'Sua ação de hoje 🌱';

/** Título e corpo da notificação de uma ação: o tipo (AGORA/HOJE/QUANDO FIZER SENTIDO) fica
 * explícito no título, mas o conteúdo real da ação (instance.descricao) nunca aparece — o corpo é
 * só um gancho de curiosidade, pra incentivar a pessoa a abrir o app pra descobrir. */
function notificationTitleFor(instance: ChallengeInstance): string {
  // Sugestão nunca deve parecer uma tarefa cobrando conclusão — título próprio, fora do
  // esquema AGORA/HOJE/QUANDO FIZER SENTIDO (ver ChallengeActionKind).
  if (getInstanceActionKind(instance) === 'sugestao') return '💡 Uma orientação pra agora';
  return TIMING_NOTIFICATION_TITLE[getInstanceTiming(instance)];
}

function notificationBodyFor(instance: ChallengeInstance): string {
  // Mesmo princípio das ações (ver pickNotificationTeaser): nunca revelar o conteúdo real na tela
  // de bloqueio, só um gancho pra abrir o app. Sugestão só aparece de verdade dentro do app (ver
  // banner na Home) — mostrar o texto direto aqui tornaria abrir o app opcional.
  if (getInstanceActionKind(instance) === 'sugestao') return pickSuggestionNotificationTeaser();
  return pickNotificationTeaser(getInstanceTiming(instance));
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    const current = await Notifications.getPermissionsAsync();
    let status = current.status;

    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Ações diárias',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    return status === 'granted';
  },

  async getPermissionStatus(): Promise<Notifications.PermissionStatus> {
    const result = await Notifications.getPermissionsAsync();
    return result.status;
  },

  /**
   * Agenda uma notificação local para cada instância de desafio no seu
   * horário planejado. Retorna as instâncias com `notificationId` preenchido.
   * Horários já passados não são agendados (o desafio já está visível no app).
   */
  async scheduleForInstances(instances: ChallengeInstance[]): Promise<ChallengeInstance[]> {
    if (Platform.OS === 'web') return instances;

    const now = getCurrentDate().getTime();
    const results: ChallengeInstance[] = [];

    for (const instance of instances) {
      const scheduledTime = new Date(instance.scheduledFor).getTime();
      if (scheduledTime <= now) {
        results.push(instance);
        continue;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationTitleFor(instance),
          body: notificationBodyFor(instance),
          data: { instanceId: instance.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(scheduledTime),
        },
      });

      results.push({ ...instance, notificationId });
    }

    return results;
  },

  async cancelForInstances(instances: ChallengeInstance[]): Promise<void> {
    await Promise.all(
      instances
        .filter((i) => i.notificationId)
        .map((i) => Notifications.cancelScheduledNotificationAsync(i.notificationId as string)),
    );
  },

  /** Cancela uma notificação agendada pelo id — mesma primitiva de `cancelForInstances`, só que
   * pra um id avulso (usado pelo reminderService, que guarda o notificationId dentro de
   * `instance.reminder`, não em `instance.notificationId`). Nunca lança: cancelar um id que já
   * disparou/não existe mais é um no-op esperado, não um erro. */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {
      // já disparou ou nunca existiu — nada a fazer.
    }
  },

  /**
   * Notificação de "Lembrar mais tarde" (ver reminderService.ts) — mesmo mecanismo de
   * `scheduleForInstances`/`sendNow` (`Notifications.scheduleNotificationAsync`), e o mesmo título
   * por timing (a ação não mudou de tipo só porque a pessoa pediu pra ser avisada de novo). O
   * corpo mantém o texto real da ação: a pessoa já viu essa ação no app antes de pedir o lembrete,
   * então esconder o conteúdo aqui não geraria curiosidade — só confusão.
   */
  async scheduleReminder(instance: ChallengeInstance, scheduledFor: Date): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    return Notifications.scheduleNotificationAsync({
      content: {
        title: notificationTitleFor(instance),
        body: instance.descricao,
        data: { instanceId: instance.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduledFor,
      },
    });
  },

  /**
   * Dispara a notificação de um desafio imediatamente (trigger nulo), com o
   * mesmo título/corpo/dados das notificações normais. Usado pelo Modo
   * Desenvolvedor para testar o formato/entrega sem esperar o horário real.
   */
  async sendNow(instance: ChallengeInstance): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    return Notifications.scheduleNotificationAsync({
      content: {
        title: notificationTitleFor(instance),
        body: notificationBodyFor(instance),
        data: { instanceId: instance.id },
      },
      trigger: null,
    });
  },

  /** Notificação local genérica de teste, sem vínculo com um desafio. Só para o Modo Desenvolvedor validar entrega/permissões. */
  async sendTestNotification(): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    return Notifications.scheduleNotificationAsync({
      content: {
        title: '🛠️ Notificação de teste',
        body: 'Se você está vendo isso, as notificações locais estão funcionando neste dispositivo.',
      },
      trigger: null,
    });
  },

  /**
   * "O que você melhorou?" ficou pronto (ver weeklyRecapService.ts) — mesmo espírito de um recap
   * estilo Spotify Wrapped: dispara assim que detectamos que a semana virou, não é agendada pra
   * um horário futuro (o app só consegue calcular o resumo quando é reaberto — ver seção sobre
   * limitações do reminderService pra notificações que dependem do app rodar). `data.screen`
   * segue o mesmo padrão de `data.instanceId` já usado pelas outras notificações (ver
   * app/_layout.tsx), só que apontando pra uma tela em vez de uma instância específica.
   */
  async sendWeeklyRecap(body: string): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    return Notifications.scheduleNotificationAsync({
      content: {
        title: '✨ Seu resumo semanal está pronto!',
        body,
        data: { screen: 'insights' },
      },
      trigger: null,
    });
  },

  /**
   * Agenda um lembrete pra registrar o resumo/sentimento do dia — só se o horário
   * ainda estiver no futuro (não faz sentido notificar sobre algo que já passou).
   * Convite recorrente, não obrigatório: o texto sempre deixa claro que é opcional.
   */
  async scheduleDayReflectionReminder(scheduledFor: Date, now: Date): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    if (scheduledFor.getTime() <= now.getTime()) return null;

    return Notifications.scheduleNotificationAsync({
      content: {
        title: 'Como foi seu dia hoje? 📝',
        body: 'Registre em poucas palavras como você se sentiu — é rapidinho e fica guardado no seu histórico.',
        data: { type: 'day_reflection' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduledFor,
      },
    });
  },
};
