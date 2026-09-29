import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getCurrentDate } from '@/utils/now';
import { getInstanceTiming } from '@/data/challenges';
import { TIMING_NOTIFICATION_TITLE, pickNotificationTeaser } from '@/engine/challengeTiming';
import type { ChallengeInstance } from '@/types';

// Usado só pelas notificações genéricas, não ligadas a uma ação específica (teste, lembrete de
// diário) — a notificação de uma ação usa TIMING_NOTIFICATION_TITLE (ver notificationTitleFor).
export const NOTIFICATION_TITLE = 'Sua ação de hoje 🌱';

// Corpo do convite de "Seu resumo semanal" (ver scheduleWeeklyRecap/sendWeeklyRecapNow) —
// descreve só o que a aba Insights de fato mostra hoje (presença + como a pessoa se sentiu, ver
// statsService.getPresenceSummary), nunca afirma resultado ("melhorou", "cuidou de si mesmo"):
// entregar uma ação não garante nada sobre como ela foi feita.
const WEEKLY_RECAP_BODY = 'Veja quantas ações chegaram até você essa semana, os temas mais presentes e como você tem se sentido.';

/** Título e corpo da notificação de uma ação: o tipo (AGORA/HOJE/QUANDO FIZER SENTIDO) fica
 * explícito no título, mas o conteúdo real da ação (instance.descricao) nunca aparece — o corpo é
 * só um gancho de curiosidade, pra incentivar a pessoa a abrir o app pra descobrir. */
function notificationTitleFor(instance: ChallengeInstance): string {
  return TIMING_NOTIFICATION_TITLE[getInstanceTiming(instance)];
}

function notificationBodyFor(instance: ChallengeInstance): string {
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
   * Notificação de "Lembrar mais tarde" (ver reminderService.ts). Título próprio — diferente do
   * título por timing das notificações normais (`notificationTitleFor`) — deixando claro que essa
   * notificação é o lembrete de uma ação que a própria pessoa pediu pra reagendar, não uma ação
   * nova chegando; sem isso, ficava indistinguível de uma notificação normal e confundia quem já
   * tinha visto essa ação antes. O corpo mantém o texto real da ação: a pessoa já viu essa ação no
   * app antes de pedir o lembrete, então esconder o conteúdo aqui não geraria curiosidade — só
   * confusão.
   */
  async scheduleReminder(instance: ChallengeInstance, scheduledFor: Date): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    return Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Lembrete: você pediu pra rever essa ação',
        body: instance.descricao,
        // `isReminder` (não só `instanceId`) — deixa app/_layout.tsx destacar esse card de um
        // jeito diferente de "ação mais recente" ao abrir pela notificação (ver home.tsx).
        data: { instanceId: instance.id, isReminder: true },
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
   *
   * `isFirstNotification` marca a notificação da toda primeira ação da pessoa (ver
   * dayCycleService.requestFirstAction) — título e corpo diferentes só dessa vez, avisando que é a
   * primeira, pra ela reconhecer o formato ("curto, sem revelar tudo") quando as próximas
   * chegarem sem esse aviso. Dev Mode nunca passa essa flag: lá o objetivo é testar o formato
   * normal de entrega, não o aviso único de estreia.
   */
  async sendNow(instance: ChallengeInstance, options?: { isFirstNotification?: boolean }): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    return Notifications.scheduleNotificationAsync({
      content: {
        title: options?.isFirstNotification ? '🌱 Sua primeira notificação chegou!' : notificationTitleFor(instance),
        body: options?.isFirstNotification
          ? `${notificationBodyFor(instance)} É assim que o Daliz vai te avisar diariamente — rapidinho, sem revelar tudo, só um gancho pra você abrir e descobrir.`
          : notificationBodyFor(instance),
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
   * "Seu resumo semanal" (ver weeklyRecapService.ts) — convite genérico, sem nenhuma contagem
   * embutida no corpo: agendada com dias de antecedência (domingo ao meio-dia), a semana ainda
   * não fechou nesse momento, então não há como calcular nada de verdade ainda. Os números reais
   * (quantas ações chegaram, temas mais presentes, como a pessoa se sentiu) só existem quando o
   * app abre e lê o histórico — por isso ficam na aba Insights (pra onde `data.screen` leva ao
   * tocar), nunca no corpo da notificação. `data.screen` segue o mesmo padrão de `data.instanceId`
   * já usado pelas outras notificações (ver app/_layout.tsx), só que aponta pra uma tela em vez de
   * uma instância específica.
   */
  async scheduleWeeklyRecap(scheduledFor: Date, now: Date): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    if (scheduledFor.getTime() <= now.getTime()) return null;

    return Notifications.scheduleNotificationAsync({
      content: {
        title: '✨ Seu resumo semanal está pronto!',
        body: WEEKLY_RECAP_BODY,
        data: { screen: 'insights' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduledFor,
      },
    });
  },

  /** Dispara o mesmo convite acima na hora (trigger nulo) — só pro Modo Desenvolvedor testar
   * formato/entrega sem esperar o domingo real (ver weeklyRecapService.scheduleIfNeeded). */
  async sendWeeklyRecapNow(): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    return Notifications.scheduleNotificationAsync({
      content: {
        title: '✨ Seu resumo semanal está pronto!',
        body: WEEKLY_RECAP_BODY,
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
        // `screen`/`focusToday`, não `type` — antes usava um formato próprio que
        // handleNotificationData (app/_layout.tsx) nunca reconhecia, e a notificação não levava a
        // lugar nenhum ao tocar. Reaproveita o mesmo mecanismo de `data.screen` já usado pelo
        // resumo semanal.
        data: { screen: 'history', focusToday: true },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduledFor,
      },
    });
  },
};
