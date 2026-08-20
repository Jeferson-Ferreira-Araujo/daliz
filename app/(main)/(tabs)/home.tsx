import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { CurrentWeatherWidget } from '@/components/CurrentWeatherWidget';
import { EmptyState } from '@/components/EmptyState';
import { ChallengeCard } from '@/components/ChallengeCard/ChallengeCard';
import { radius, spacing, useTheme } from '@/theme';
import { profileService } from '@/services/profileService';
import { dayCycleService } from '@/services/dayCycleService';
import { challengeActionsService } from '@/services/challengeActionsService';
import { notificationService } from '@/services/notificationService';
import { reminderService } from '@/services/reminderService';
import { TabHeaderIcons } from '@/components/TabHeaderIcons';
import { motivationalPhraseForDate } from '@/data/motivationalPhrases';
import { getInstanceActionKind, getInstanceTiming } from '@/data/challenges';
import { MAX_OPEN_ACTIONS } from '@/engine/ChallengeEngine';
import { isWorkdayToday, sleepDeadlineFor } from '@/engine/dayModel';
import { resolveActiveDate } from '@/services/dayCycleService';
import { logicalDateFor } from '@/utils/date';
import { getCurrentDate } from '@/utils/now';
import { timeToMinutes } from '@/utils/time';
import type { ChallengeInstance, ReminderType, UserProfile } from '@/types';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { instanceId } = useLocalSearchParams<{ instanceId?: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [instances, setInstances] = useState<ChallengeInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => getCurrentDate());
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  // "Recuperação/recomeço" — dias desde a última abertura, só quando ultrapassa
  // RECOVERY_THRESHOLD_DAYS (ver dayCycleService.ensureUpcomingActions). null = nada a mostrar.
  const [welcomeBackGapDays, setWelcomeBackGapDays] = useState<number | null>(null);

  // Vibra e prepara o banner de boas-vindas quando a pessoa volta depois de muitos dias — sem
  // culpa, sem cobrança (ver seção "Nunca usar linguagem de cobrança" já estabelecida pro resumo
  // semanal, mesmo espírito aqui). Web não tem API de vibração do expo-haptics.
  function handleReturningAfterGap(gapDays: number | null) {
    if (gapDays == null) return;
    setWelcomeBackGapDays(gapDays);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }

  const load = useCallback(async () => {
    const currentProfile = await profileService.getProfile();
    if (!currentProfile) {
      router.replace('/onboarding/welcome');
      return;
    }
    setProfile(currentProfile);

    const now = getCurrentDate();
    // ensureUpcomingActions também expira preguiçosamente pendências de períodos já dormidos por
    // baixo dos panos (marca como "ignorado", disponíveis no Histórico) e pode ter sincronizado a
    // cidade cadastrada com o GPS (ver syncRegisteredLocationForToday) — por isso usamos
    // result.profile daqui pra frente, não mais o currentProfile pré-sincronização.
    const result = await dayCycleService.ensureUpcomingActions(currentProfile, now);
    setProfile(result.profile);
    setInstances(sortByScheduledTime(result.instances));
    handleReturningAfterGap(result.returningAfterGapDays);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (!loading) refreshInstancesForToday();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading]),
  );

  // Mantém "agora" atualizado para que os cards apareçam sozinhos assim que
  // seu horário de notificação chega, mesmo sem o usuário reabrir a tela.
  useEffect(() => {
    const interval = setInterval(() => setNow(getCurrentDate()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' || !profile) return;
    const subscription = Notifications.addNotificationReceivedListener(() => {
      setNow(getCurrentDate());
      refreshInstancesForToday();
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Só pra decidir a copy do banner "sua primeira ação chegou" (seção 4 do pedido) — leitura
  // simples de status, nunca dispara um novo pedido de permissão aqui.
  useEffect(() => {
    if (profile?.firstActionState !== 'available') return;
    notificationService.getPermissionStatus().then((status) => setNotificationsGranted(status === 'granted'));
  }, [profile?.firstActionState]);

  // Busca o perfil direto do armazenamento (em vez de usar o `profile` do estado) porque
  // esta função é chamada a partir de um closure que pode estar desatualizado — ex: ao
  // voltar da tela de editar perfil, senão a mudança só apareceria depois de um reload.
  async function refreshInstancesForToday() {
    const currentProfile = await profileService.getProfile();
    if (!currentProfile) return;
    const cycleResult = await dayCycleService.ensureUpcomingActions(currentProfile, getCurrentDate());
    setProfile(cycleResult.profile);
    setInstances(sortByScheduledTime(cycleResult.instances));
    handleReturningAfterGap(cycleResult.returningAfterGapDays);
    setNow(getCurrentDate());
  }

  async function handleSaveNote(instance: ChallengeInstance, note: string) {
    const updated = await challengeActionsService.saveNote(instance, note);
    setInstances((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  async function handleScheduleReminder(instance: ChallengeInstance, scheduledFor: Date, reminderType: ReminderType) {
    const updated = await reminderService.schedule(instance, scheduledFor, reminderType);
    setInstances((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  async function handleCancelReminder(instance: ChallengeInstance) {
    const updated = await reminderService.cancel(instance);
    setInstances((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  if (loading || !profile) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  const today = logicalDateFor(now);
  // Só revela um desafio no app quando seu horário de notificação chega —
  // o usuário não deve ver a lista completa do dia de antemão.
  const visibleInstances = instances.filter((i) => new Date(i.scheduledFor).getTime() <= now.getTime());
  // Sugestões (actionKind 'sugestao') nunca competem com ações de verdade nem entram em
  // estatísticas/histórico — só a ação-only list alimenta empty state/agrupamentos abaixo.
  // `actionInstances` (não `visibleInstances`) pra manter o mesmo comportamento de sempre do
  // describeEmptyState: ele já espia a PRÓXIMA pendente ainda não revelada pra decidir a mensagem
  // (ex: "chegam durante o dia" vs "começam amanhã"), então precisa do array completo, só sem
  // sugestões — nunca só o que já está visível.
  const actionInstances = instances.filter((i) => getInstanceActionKind(i) === 'acao');
  const actionInstancesVisible = visibleInstances.filter((i) => getInstanceActionKind(i) === 'acao');
  const suggestionInstancesVisible = visibleInstances.filter((i) => getInstanceActionKind(i) === 'sugestao');
  const emptyState = describeEmptyState(actionInstances, now, profile);
  const firstActionInstance =
    profile.firstActionState === 'available' ? instances.find((i) => i.id === profile.firstActionInstanceId) : undefined;

  // Sistema de timing: separa a ação mais recente ("ação atual", em destaque) das demais ações
  // `today`/`contextual` ainda por aí ("Em aberto" — ver seção 4 do pedido). Sem Concluir/Não
  // consegui (ver plano de migração seção 4), toda ação entregue conta aqui — não há mais uma
  // distinção "resolvida vs pendente". `now` que não é mais a atual simplesmente some da tela
  // (seção 5) — continua em storage/histórico, só não acumula na seção "Em aberto".
  const pendingVisible = actionInstancesVisible; // já ordenado por scheduledFor (ascendente)
  const currentAction = pendingVisible[pendingVisible.length - 1] ?? null;
  const openActions = pendingVisible
    .filter((i) => i.id !== currentAction?.id && getInstanceTiming(i) !== 'now')
    .sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor))
    .slice(0, MAX_OPEN_ACTIONS);
  // Sugestões do dia: banners avulsos, sem card/botões, sem entrar em "Em aberto"/estatísticas
  // (ver ChallengeActionKind). Diferente de `currentAction` (uma ação em destaque de cada vez),
  // uma sugestão fica visível o dia inteiro depois de notificada — ela nunca muda de status (não
  // tem Concluir/Não consegui), então não faz sentido "substituir" a anterior; todas as reveladas
  // hoje continuam na tela, mais antiga primeiro (mesma ordem de `visibleInstances`).
  const suggestionsToday = suggestionInstancesVisible;

  return (
    <Screen padded={false} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TabHeaderIcons />

        <CurrentWeatherWidget />

        {welcomeBackGapDays != null && (
          <View style={[styles.welcomeBackBanner, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name="heart" size={20} color={colors.primary} style={styles.firstActionIcon} />
            <View style={styles.firstActionTextBlock}>
              <AppText variant="bodyStrong">Que bom ter você de volta! 👋</AppText>
              <AppText variant="caption" color={colors.textMuted}>
                Ficou um tempo sem aparecer, e tudo bem — isso não é um problema, muito menos um
                fracasso. O que importa é que você está aqui agora. Vamos com calma, um passo de
                cada vez.
              </AppText>
            </View>
            <Pressable onPress={() => setWelcomeBackGapDays(null)} hitSlop={12} style={styles.welcomeBackDismiss}>
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        )}

        {firstActionInstance && (
          <View style={[styles.firstActionBanner, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons
              name={notificationsGranted ? 'notifications' : 'sparkles-outline'}
              size={20}
              color={colors.primary}
              style={styles.firstActionIcon}
            />
            <View style={styles.firstActionTextBlock}>
              <AppText variant="bodyStrong">
                {notificationsGranted ? '🔔 Sua primeira ação chegou!' : '✨ Sua primeira ação está pronta!'}
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                {notificationsGranted
                  ? 'Enviamos uma notificação para você e ela já está disponível aqui na tela.'
                  : 'Ela já está disponível aqui na tela. Para receber as próximas por notificação, ative as notificações do Daliz.'}
              </AppText>
            </View>
          </View>
        )}

        <View style={styles.greetingRow}>
          {profile.photoUri && <Image source={{ uri: profile.photoUri }} style={styles.greetingAvatar} />}
          <AppText variant="title" style={styles.greetingText}>
            {greetingFor(now)}, {firstName(profile.name)}!
          </AppText>
        </View>
        <AppText variant="body" color={colors.textMuted} style={styles.phrase}>
          {motivationalPhraseForDate(today)}
        </AppText>

        {suggestionsToday.map((suggestion) => (
          <View key={suggestion.id} style={[styles.suggestionBanner, { backgroundColor: colors.warningBg }]}>
            <AppText style={styles.suggestionIcon}>💡</AppText>
            <AppText variant="body" color={colors.text} style={styles.suggestionText}>
              {suggestion.titulo}
            </AppText>
          </View>
        ))}

        <AppText variant="subtitle" style={styles.sectionTitle}>
          Suas ações de hoje
        </AppText>

        {pendingVisible.length === 0 && (
          <EmptyState
            title={emptyState.title}
            description={emptyState.description}
            icon={emptyState.icon}
            actionLabel={emptyState.showEditProfileAction ? 'Alterar essa preferência' : undefined}
            onAction={emptyState.showEditProfileAction ? () => router.push('/(main)/edit-profile') : undefined}
          />
        )}

        {currentAction && (
          <ChallengeCard
            key={currentAction.id}
            instance={currentAction}
            highlighted={currentAction.id === instanceId || currentAction.id === firstActionInstance?.id}
            onSaveNote={(note) => handleSaveNote(currentAction, note)}
            onScheduleReminder={(scheduledFor, reminderType) => handleScheduleReminder(currentAction, scheduledFor, reminderType)}
            onCancelReminder={() => handleCancelReminder(currentAction)}
          />
        )}

        {openActions.length > 0 && (
          <>
            <AppText variant="subtitle" style={styles.sectionTitle}>
              Em aberto · {openActions.length} {openActions.length === 1 ? 'ação' : 'ações'}
            </AppText>
            {openActions.map((instance) => (
              <ChallengeCard
                key={instance.id}
                instance={instance}
                highlighted={instance.id === instanceId || instance.id === firstActionInstance?.id}
                onSaveNote={(note) => handleSaveNote(instance, note)}
                onScheduleReminder={(scheduledFor, reminderType) => handleScheduleReminder(instance, scheduledFor, reminderType)}
                onCancelReminder={() => handleCancelReminder(instance)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function sortByScheduledTime(instances: ChallengeInstance[]): ChallengeInstance[] {
  return [...instances].sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
}

interface EmptyStateContent {
  title: string;
  description: string;
  icon?: keyof typeof Ionicons.glyphMap;
  showEditProfileAction?: boolean;
}

/**
 * Explica quando a primeira ação chega, em vez do genérico "vão aparecer em
 * instantes" — importante pra quem abre o app tarde da noite, já na cama: sem
 * isso, a tela fica vazia sem dizer que não há mais nada pra hoje.
 *
 * De propósito, nunca mostra um horário fixo: o motor escolhe o momento mais
 * adequado pra cada pessoa (ver ChallengeEngine/dayModel), então a mensagem
 * fica sempre genérica — "durante o dia", nunca "às 09:00".
 */
function describeEmptyState(instances: ChallengeInstance[], now: Date, profile: UserProfile): EmptyStateContent {
  if (isWithinWorkHoursWithoutNotifications(profile, now)) {
    return {
      title: 'Aguardando o fim do seu expediente',
      description: 'Você pediu pra não receber ações durante o trabalho — assim que seu horário terminar, elas voltam a chegar normalmente.',
      showEditProfileAction: true,
    };
  }

  // Só é chamado quando não há nenhuma ação ainda visível hoje (ver pendingVisible.length === 0
  // em home.tsx) — então, se `instances` (o dia inteiro) tem algo, é sempre uma ação futura ainda
  // não revelada; a mais próxima é sempre a primeira (já vem ordenado por scheduledFor).
  const next = instances[0];

  if (!next) {
    // O dia agora vira à meia-noite (ver utils/date.ts) — então, se ainda não
    // passou do horário em que a pessoa costuma acordar, esse "hoje" mal começou:
    // as ações ainda vão aparecer ao longo do próprio dia, não só amanhã.
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const stillBeforeWakeToday = nowMinutes < timeToMinutes(profile.wakeTime);
    return stillBeforeWakeToday
      ? {
          title: 'Suas ações chegam durante o dia',
          description: 'Assim que você acordar, suas ações vão aparecer nos momentos mais adequados do seu dia.',
        }
      : {
          title: 'Suas ações começam amanhã',
          description: 'Hoje já não dá mais tempo — a partir de amanhã, suas ações vão aparecer nos momentos mais adequados do seu dia.',
        };
  }

  // Compara com o horário de dormir do período ativo (não a virada do calendário) — pra quem
  // atravessa a meia-noite (ex: acorda 16h, dorme 10h do dia seguinte), uma ação agendada pra 3h
  // ainda é "daqui a pouco", não "amanhã", mesmo já sendo outra data no calendário.
  const scheduled = new Date(next.scheduledFor);
  const activeDate = resolveActiveDate(profile, now);
  return scheduled.getTime() < sleepDeadlineFor(activeDate, profile).getTime()
    ? {
        title: 'Nada por aqui ainda',
        description: 'Nosso sistema inteligente está preparando tudo. Você receberá as notificações no momento exato!',
        icon: 'hourglass-outline',
      }
    : {
        title: 'Suas ações começam amanhã',
        description: 'Por hoje é só isso — amanhã suas próximas ações aparecem nos momentos mais adequados do dia.',
      };
}


/** true só quando a pessoa pediu silêncio no expediente (ver UserProfile.receiveDuringWorkHours)
 * e "agora" cai dentro do horário de trabalho de hoje — usado pra explicar a tela vazia. */
function isWithinWorkHoursWithoutNotifications(profile: UserProfile, now: Date): boolean {
  if (profile.receiveDuringWorkHours) return false;
  if (isWorkdayToday(profile, now) !== true) return false;
  if (!profile.workStartTime || !profile.workEndTime) return false;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const workStart = timeToMinutes(profile.workStartTime);
  let workEnd = timeToMinutes(profile.workEndTime);
  if (workEnd <= workStart) workEnd += 1440; // turno vira a madrugada

  return nowMinutes >= workStart && nowMinutes < workEnd;
}

function firstName(name: string): string {
  return name.trim().split(' ')[0] || name;
}

function greetingFor(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  greetingText: {
    flex: 1,
  },
  greetingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  phrase: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  suggestionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  suggestionIcon: {
    fontSize: 16,
    marginTop: 2,
  },
  suggestionText: {
    flex: 1,
  },
  firstActionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  welcomeBackBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  welcomeBackDismiss: {
    marginLeft: spacing.sm,
    marginTop: 2,
  },
  firstActionIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  firstActionTextBlock: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  shareableCarouselWrapper: {
    // Estica pra fora do padding horizontal da tela, senão o primeiro/último card
    // ficam com uma margem dupla em relação ao resto da tela.
    marginHorizontal: -spacing.lg,
  },
  shareableCarousel: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
