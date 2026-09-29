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
import { ShareableMomentCard } from '@/components/ShareableMomentCard';
import { FirstActionCompletedScreen, type NextActionPreview } from '@/components/FirstActionCompletedScreen';
import { radius, spacing, useTheme } from '@/theme';
import { profileService } from '@/services/profileService';
import { dayCycleService } from '@/services/dayCycleService';
import { challengeActionsService } from '@/services/challengeActionsService';
import { notificationService } from '@/services/notificationService';
import { reminderService } from '@/services/reminderService';
import { TabHeaderIcons } from '@/components/TabHeaderIcons';
import { motivationalPhraseForDate } from '@/data/motivationalPhrases';
import { getInstanceTiming } from '@/data/challenges';
import { isShareableMoment } from '@/data/shareableMomentCopy';
import { isWorkdayToday, sleepDeadlineFor } from '@/engine/dayModel';
import { resolveActiveDate } from '@/services/dayCycleService';
import { logicalDateFor } from '@/utils/date';
import { getCurrentDate } from '@/utils/now';
import { timeToMinutes } from '@/utils/time';
import type { ChallengeInstance, ChallengeReaction, ReminderType, UserProfile } from '@/types';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { instanceId, reminded } = useLocalSearchParams<{ instanceId?: string; reminded?: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [instances, setInstances] = useState<ChallengeInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => getCurrentDate());
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  // "Recuperação/recomeço" — dias desde a última abertura, só quando ultrapassa
  // RECOVERY_THRESHOLD_DAYS (ver dayCycleService.ensureUpcomingActions). null = nada a mostrar.
  const [welcomeBackGapDays, setWelcomeBackGapDays] = useState<number | null>(null);
  // Estado C da Home (ver profileService.markFirstActionResolved): tela de transição de um
  // instante mostrada uma única vez, logo depois que a pessoa reage à primeira ação. null =
  // não mostrar; presente = sobrepõe a tela inteira até "Continuar".
  const [firstActionCompletedPreview, setFirstActionCompletedPreview] = useState<NextActionPreview | null>(null);

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

  async function handleSetReaction(instance: ChallengeInstance, reaction: ChallengeReaction) {
    const updated = await challengeActionsService.setReaction(instance, reaction);
    setInstances((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));

    // Reagir à primeira ação é o próprio sinal de conclusão dela (não existe mais Concluir/Não
    // consegui) — dispara a tela de transição (Estado C) uma única vez. `firstActionState`
    // continua 'available' até aqui de propósito: só vira 'completed' agora, junto do disparo,
    // senão um refresh no meio do caminho perderia a chance de mostrar essa tela.
    if (profile?.firstActionState === 'available' && instance.id === profile.firstActionInstanceId) {
      const resolvedProfile = await profileService.markFirstActionResolved(true);
      setProfile(resolvedProfile);
      setFirstActionCompletedPreview(computeNextActionPreview(instances, getCurrentDate()));
    }
  }

  function handleFirstActionCompletedContinue() {
    setFirstActionCompletedPreview(null);
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

  if (firstActionCompletedPreview) {
    return (
      <FirstActionCompletedScreen
        completed
        nextActionPreview={firstActionCompletedPreview}
        onContinue={handleFirstActionCompletedContinue}
      />
    );
  }

  const today = logicalDateFor(now);
  // Só revela um desafio no app quando seu horário de notificação chega —
  // o usuário não deve ver a lista completa do dia de antemão.
  const visibleInstances = instances.filter((i) => new Date(i.scheduledFor).getTime() <= now.getTime());
  const emptyState = describeEmptyState(instances, now, profile);
  const firstActionInstance =
    profile.firstActionState === 'available' ? instances.find((i) => i.id === profile.firstActionInstanceId) : undefined;

  // Sem Concluir/Não consegui (a reação é opcional e não representa conclusão de verdade — ver
  // ChallengeCard/ReactionPicker), não faz sentido distinguir "resolvida" de "em aberto": toda
  // ação entregue fica na tela junto das outras, mais recente primeiro — só ela ganha destaque
  // visual (cor, ver ChallengeCard), as demais ficam neutras independente de já terem reação ou
  // não. `now` que não é mais a mais recente simplesmente some da tela (continua em
  // storage/histórico) — é a única exceção, porque esse tipo de ação nasceu pra ser vista na
  // hora, não pra ficar acumulando na lista do dia.
  const pendingVisible = visibleInstances; // ordenado por scheduledFor (ascendente)
  const mostRecentAction = pendingVisible[pendingVisible.length - 1] ?? null;
  const timelineActions = pendingVisible
    .filter((i) => i.id === mostRecentAction?.id || getInstanceTiming(i) !== 'now')
    .reverse(); // mais recente primeiro

  // "Cards compartilháveis" — derivados do próprio dia, sem nada persistido à parte (ver
  // src/data/shareableMomentCopy.ts): `visibleInstances` já é só o ciclo de hoje já revelado,
  // então a lista naturalmente "limpa e recomeça em branco" a cada novo dia, sem nenhuma limpeza
  // manual. Mais recente primeiro, pra sentir como um feed alimentado ao longo do dia (usa
  // `completedAt`, que agora é gravado junto da reação — ver ChallengeCard).
  const shareableMoments = visibleInstances
    .filter(isShareableMoment)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));

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

        {timelineActions.map((instance) => (
          <ChallengeCard
            key={instance.id}
            instance={instance}
            profile={profile}
            // Sempre destaca a mais recente (ver `mostRecentAction` acima), que também é sempre a
            // primeira da lista (`timelineActions` já vem invertida). `instanceId`/
            // `firstActionInstance` cobrem os outros casos de destaque: abriu direto pela
            // notificação, ou é a primeiríssima ação.
            highlighted={instance.id === mostRecentAction?.id || instance.id === instanceId || instance.id === firstActionInstance?.id}
            // Card lembrado (ver app/_layout.tsx/notificationService.scheduleReminder) — nunca
            // reordena a lista (a ação continua no lugar cronológico dela), só marca visualmente
            // qual card motivou o lembrete. Sinal separado de `highlighted` de propósito: se uma
            // ação nova já chegou nesse meio-tempo, ela é a "mais recente" (destaque de cor), mas
            // não é necessariamente a que foi lembrada — os dois podem apontar pra cards diferentes.
            remindedHighlight={reminded === '1' && instance.id === instanceId}
            onSaveNote={(note) => handleSaveNote(instance, note)}
            onSetReaction={(reaction) => handleSetReaction(instance, reaction)}
            onScheduleReminder={(scheduledFor, reminderType) => handleScheduleReminder(instance, scheduledFor, reminderType)}
            onCancelReminder={() => handleCancelReminder(instance)}
          />
        ))}

        {shareableMoments.length > 0 && (
          <>
            <AppText variant="subtitle" style={styles.sectionTitle}>
              ✨ Momentos que valem compartilhar
            </AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shareableCarousel}
              style={styles.shareableCarouselWrapper}
            >
              {shareableMoments.map((instance) => (
                <ShareableMomentCard key={instance.id} instance={instance} />
              ))}
            </ScrollView>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function sortByScheduledTime(instances: ChallengeInstance[]): ChallengeInstance[] {
  return [...instances].sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
}

/** `instances` já é só o dia ativo (ver `load`/`refreshInstancesForToday`) — então, se sobra
 * alguma com `scheduledFor` no futuro, a próxima ação ainda chega "ainda hoje"; senão, só amanhã.
 * Nunca revela horário exato nem conteúdo (ver FirstActionCompletedScreen), só essa categoria
 * qualitativa. */
function computeNextActionPreview(instances: ChallengeInstance[], now: Date): NextActionPreview {
  const hasMoreToday = instances.some((i) => new Date(i.scheduledFor).getTime() > now.getTime());
  return hasMoreToday
    ? { icon: 'sunny-outline', text: 'Sua próxima ação chega ainda hoje.' }
    : { icon: 'moon-outline', text: 'Sua próxima ação chega amanhã.' };
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
