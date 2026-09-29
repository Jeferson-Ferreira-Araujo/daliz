import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { radius, spacing, useTheme } from '@/theme';
import { NoteField } from './NoteField';
import { ActionSupport } from './ActionSupport';
import { ReminderPicker } from './ReminderPicker';
import { ReactionPicker, REACTION_EMOJI } from './ReactionPicker';
import { CATEGORY_ICON_NAMES } from '@/utils/categoryIcons';
import { ACTION_SUPPORT_BADGES, BIBLE_ACTION_BADGE, CAMERA_ACTION_BADGE } from '@/utils/actionTypeBadge';
import { buildBibleSearchUrl } from '@/utils/bible';
import { challengeById, getInstanceTiming } from '@/data/challenges';
import { TIMING_LABELS } from '@/engine/challengeTiming';
import { FIRST_ACTION_CHALLENGE } from '@/data/firstActionChallenge';
import { formatBirthDate } from '@/utils/date';
import { CHALLENGE_REACTION_LABELS } from '@/types';
import type { ActionSupportData, ChallengeInstance, ChallengeReaction, ReminderType, UserProfile } from '@/types';

interface ChallengeCardProps {
  instance: ChallengeInstance;
  profile: UserProfile;
  highlighted?: boolean;
  // Card que motivou um lembrete recém-tocado (ver home.tsx) — sinal independente de
  // `highlighted` (que marca "ação mais recente"): os dois podem apontar pra cards diferentes se
  // uma ação nova chegou entre o agendamento do lembrete e ele disparar.
  remindedHighlight?: boolean;
  onSaveNote: (note: string) => void;
  onSetReaction: (reaction: ChallengeReaction) => void;
  onScheduleReminder: (scheduledFor: Date, reminderType: ReminderType) => void;
  onCancelReminder: () => void;
}

/** Resolve placeholders de `supportData.query` com dados reais do perfil (hoje só `{{data}}`,
 * a data de nascimento por extenso) — ver comentário em ActionSupportData. */
function resolveSupportData(supportData: ActionSupportData | undefined, profile: UserProfile): ActionSupportData | undefined {
  if (!supportData?.query?.includes('{{data}}')) return supportData;
  return { ...supportData, query: supportData.query.replace('{{data}}', formatBirthDate(profile.birthDate)) };
}

type PickerMode = null | 'reminder' | 'reaction';
type CameraState = 'idle' | 'saving' | 'saved' | 'denied';

/**
 * Sem ciclo de vida de resultado (ver plano de migração seção 4): mostra a ação, o suporte pra
 * fazê-la (Bíblia/câmera direto aqui; Spotify/Maps/busca/filmes via ActionSupport — nunca os dois
 * pro mesmo tipo, ver comentário em ActionSupport.tsx), a anotação quando faz sentido, "Como você
 * se sentiu" (opcional, a qualquer momento — ver ReactionPicker) e "Lembrar mais tarde" (exceto na
 * primeira ação, ver isFirstAction) — nunca um botão de Concluir/Não consegui. `deliveredAt`
 * continua sendo o único marco de histórico hoje (ver ChallengeInstance); `reaction` é sentimento,
 * não status.
 */
export function ChallengeCard({
  instance,
  profile,
  highlighted,
  remindedHighlight,
  onSaveNote,
  onSetReaction,
  onScheduleReminder,
  onCancelReminder,
}: ChallengeCardProps) {
  const { colors } = useTheme();
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [cameraState, setCameraState] = useState<CameraState>('idle');

  const icon = CATEGORY_ICON_NAMES[instance.categoria];
  const showingPicker = pickerMode !== null;
  const timing = getInstanceTiming(instance);
  // A primeira ação (ver src/data/firstActionChallenge.ts) é pensada pra ser feita ali, no
  // momento em que a pessoa acabou de abrir o app pela primeira vez — "lembrar mais tarde" não
  // faz sentido pra ela como faz pras demais.
  const isFirstAction = instance.challengeId === FIRST_ACTION_CHALLENGE.id;
  const bibleQuery = challengeById[instance.challengeId]?.bibleQuery;
  const opensCamera = challengeById[instance.challengeId]?.opensCamera ?? false;
  const supportType = challengeById[instance.challengeId]?.supportType;
  const supportLabel = challengeById[instance.challengeId]?.supportLabel;
  const supportData = resolveSupportData(challengeById[instance.challengeId]?.supportData, profile);
  // Identifica visualmente COMO a ação vai ser feita (Spotify, Maps, filme, pesquisa, Bíblia,
  // foto) — orthogonal à categoria (que já tem seu próprio ícone/cor, ver `icon` acima): a
  // categoria diz "de que assunto é", este badge diz "com que ferramenta você vai fazer".
  const actionTypeBadge = bibleQuery
    ? BIBLE_ACTION_BADGE
    : opensCamera
      ? CAMERA_ACTION_BADGE
      : supportType
        ? ACTION_SUPPORT_BADGES[supportType]
        : undefined;
  // Card destacado já usa `primaryMuted` de fundo — o badge de timing precisa da cor oposta pra
  // continuar visível em cima dele, senão some por ter a mesma cor do fundo (mesmo bug que
  // motivou dar contorno ao card, ver comentário abaixo).
  const chipBackground = highlighted ? colors.surface : colors.primaryMuted;
  // Círculo do ícone segue a cor do tipo de ação (não a genérica `chipBackground` acima) quando
  // existe um — reforça a mesma cor do fundo do card, em vez de ficar competindo com ela.
  const iconChipBackground = highlighted ? colors.surface : actionTypeBadge ? `${actionTypeBadge.color}26` : chipBackground;
  const iconColor = !highlighted && actionTypeBadge ? actionTypeBadge.color : colors.primary;
  // Quando existe um tipo de ação reconhecível, o card inteiro (fundo + borda + ícone) assume a
  // cor dele — não só mais um badge pequeno, ver pedido do usuário ("mudar a cor inteira do
  // card"). `highlighted` continua ganhando por cima quando os dois coincidem: o destaque de "ação
  // mais recente" é a informação mais importante da tela, não pode ficar competindo com a cor do
  // tipo de ação.
  const actionTypeCardStyle = actionTypeBadge
    ? { backgroundColor: `${actionTypeBadge.color}14`, borderColor: `${actionTypeBadge.color}66` }
    : null;

  function handleOpenBible() {
    if (bibleQuery) Linking.openURL(buildBibleSearchUrl(bibleQuery)).catch(() => {});
  }

  // Foto não fica anexada à ação nem visível no app (decisão do pedido) — só salva na galeria do
  // dispositivo, pra não se perder e a pessoa poder compartilhar depois por conta própria.
  // `writeOnly: true` pede só permissão de adicionar à galeria, sem precisar ler o rolo inteiro.
  async function handleOpenCamera() {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPermission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled || !result.assets?.[0]) return;

    setCameraState('saving');
    try {
      const mediaPermission = await MediaLibrary.requestPermissionsAsync(true);
      if (!mediaPermission.granted) {
        setCameraState('denied');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(result.assets[0].uri);
      setCameraState('saved');
    } catch {
      setCameraState('denied');
    }
  }

  function handleScheduleReminder(scheduledFor: Date, reminderType: ReminderType) {
    setPickerMode(null);
    onScheduleReminder(scheduledFor, reminderType);
  }

  function handleCancelReminder() {
    setPickerMode(null);
    onCancelReminder();
  }

  function handleSetReaction(reaction: ChallengeReaction) {
    setPickerMode(null);
    onSetReaction(reaction);
  }

  return (
    <Animated.View
      // Entrada suave quando o card aparece pela primeira vez (nova ação revelada, ou volta pra
      // tela) e transição de posição quando a lista reordena (ver highlighted/mostRecentAction em
      // home.tsx) — sem isso, cards simplesmente "pulavam" de lugar sem nenhuma continuidade visual.
      // Duração fixa (não spring) de propósito: nada de ultrapassar a posição final e "assentar"
      // balançando — discreto, sem chamar atenção pra própria animação.
      entering={FadeInDown.duration(220)}
      layout={LinearTransition.duration(200)}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        actionTypeCardStyle,
        // Sinaliza a ação mais recente só por cor (ver `highlighted` em home.tsx) — fundo e borda
        // na cor de destaque, sem depender de posição na lista nem de badge (fácil de não notar
        // rolando rápido). Independe de reação: uma ação já reagida não vira neutra por isso.
        highlighted && { backgroundColor: colors.primaryMuted, borderColor: colors.primary, borderWidth: 2 },
      ]}
    >
      {/* Banner de "isso é o que você pediu pra lembrar" — sinal textual, independente da cor de
          destaque de "ação mais recente" acima (`highlighted`): os dois podem ser cards
          diferentes, e mudar só a cor da borda não deixaria claro qual dos dois significados se
          aplica aqui. Cores de aviso (não a de destaque azul), pra não competir/confundir com o
          destaque de recência. */}
      {remindedHighlight && (
        <View style={[styles.remindedBanner, { backgroundColor: colors.warningBg }]}>
          <Ionicons name="alarm-outline" size={14} color={colors.warning} />
          <AppText variant="caption" color={colors.warning} style={styles.remindedBannerText}>
            Isso é o que você pediu pra lembrar
          </AppText>
        </View>
      )}

      {/* Horário em que a ação chegou de verdade (não o agendado, quando os dois divergem) — só
          pra conferência/debug de quem tá acompanhando o motor, não é informação pro fluxo normal
          do usuário (por isso canto, discreto, sem badge/cor de destaque). */}
      <AppText variant="caption" color={colors.textMuted} style={styles.deliveredTime}>
        {formatTime(instance.deliveredAt ?? instance.scheduledFor)}
      </AppText>

      <View style={styles.body}>
        <View style={[styles.iconCircle, { backgroundColor: iconChipBackground }]}>
          <Ionicons name={actionTypeBadge && !highlighted ? actionTypeBadge.icon : icon} size={20} color={iconColor} />
        </View>
        <View style={styles.textGroup}>
          <View style={styles.badgeRow}>
            <View style={[styles.timingBadge, { backgroundColor: chipBackground }]}>
              <AppText variant="pillLabel" color={colors.primary}>
                {TIMING_LABELS[timing]}
              </AppText>
            </View>
            {actionTypeBadge && (
              <View style={[styles.actionTypeBadge, { backgroundColor: `${actionTypeBadge.color}1F` }]}>
                <Ionicons name={actionTypeBadge.icon} size={11} color={actionTypeBadge.color} />
                <AppText variant="pillLabel" color={actionTypeBadge.color}>
                  {actionTypeBadge.label}
                </AppText>
              </View>
            )}
          </View>
          <AppText variant="subtitle">{instance.titulo}</AppText>

          {bibleQuery && (
            <Button
              label="📖 Ler versículo"
              variant="outline"
              size="sm"
              onPress={handleOpenBible}
              style={styles.externalLinkButton}
            />
          )}

          {opensCamera && (
            <View>
              <Button
                label={cameraState === 'saving' ? 'Salvando na galeria...' : '📷 Tirar foto agora'}
                variant="outline"
                size="sm"
                disabled={cameraState === 'saving'}
                onPress={handleOpenCamera}
                style={styles.externalLinkButton}
              />
              {cameraState === 'saved' && (
                <AppText variant="caption" color={colors.success} style={styles.cameraFeedback}>
                  ✓ Foto salva na galeria do dispositivo.
                </AppText>
              )}
              {cameraState === 'denied' && (
                <AppText variant="caption" color={colors.textMuted} style={styles.cameraFeedback}>
                  Não conseguimos salvar a foto na galeria — verifique a permissão de fotos do app.
                </AppText>
              )}
            </View>
          )}

          <ActionSupport supportType={supportType} supportLabel={supportLabel} supportData={supportData} />

          {!showingPicker && asksToWrite(instance) && <NoteField value={instance.note ?? ''} onSave={onSaveNote} />}

          {!showingPicker && (
            <View style={styles.pendingActions}>
              {/* "Lembrar mais tarde" fica disponível em qualquer timing (now/today/contextual) —
                  não é uma decisão de `timing`, é a pessoa dizendo que esse momento específico não
                  é bom. Ausente só na primeira ação (ver isFirstAction) — essa é feita ali, no
                  momento em que a pessoa está abrindo o app, não em outra hora — e também some
                  assim que a pessoa já marcou uma reação: reagir já indica que ela fez/viveu essa
                  ação agora, então "lembrar mais tarde" deixa de fazer sentido pra ela. */}
              {!isFirstAction && !instance.reaction && (
                <Button
                  // Antes só mostrava a hora ("⏰ 10:57"), sem dizer o que ela significa — dava a
                  // impressão de prazo/conclusão. "Lembrete às" deixa claro que é uma notificação
                  // futura, não um horário limite.
                  label={instance.reminder ? `⏰ Lembrete às ${formatTime(instance.reminder.scheduledFor)}` : '⏰ Lembrar mais tarde'}
                  tone={instance.reminder ? 'primary' : 'neutral'}
                  variant="soft"
                  size="sm"
                  onPress={() => setPickerMode('reminder')}
                />
              )}
              {/* "Como você se sentiu" é só uma marcação opcional, a qualquer momento — não é um
                  passo de conclusão (não existe mais Concluir/Não consegui, ver comentário no
                  topo do arquivo). Vira um chip com o emoji escolhido depois de marcada, que
                  reabre o picker pra trocar a resposta. Continua disponível na primeira ação
                  (diferente de "lembrar mais tarde" acima) porque é o próprio sinal que libera a
                  tela de transição "o que acontece agora" (ver home.tsx). */}
              {instance.reaction ? (
                <Pressable
                  onPress={() => setPickerMode('reaction')}
                  style={[styles.reactionPill, { borderColor: colors.border }]}
                >
                  <AppText style={styles.reactionPillEmoji}>{REACTION_EMOJI[instance.reaction]}</AppText>
                  <AppText variant="caption">{CHALLENGE_REACTION_LABELS[instance.reaction]}</AppText>
                </Pressable>
              ) : (
                <Button
                  label="💬 Como você se sentiu?"
                  tone="neutral"
                  variant="soft"
                  size="sm"
                  onPress={() => setPickerMode('reaction')}
                />
              )}
            </View>
          )}
        </View>
      </View>

      {pickerMode === 'reminder' && (
        <Animated.View entering={FadeInDown.duration(180)} exiting={FadeOutUp.duration(120)}>
          <ReminderPicker
            activeReminderLabel={instance.reminder ? formatTime(instance.reminder.scheduledFor) : null}
            onSchedule={handleScheduleReminder}
            onCancelReminder={handleCancelReminder}
            onClose={() => setPickerMode(null)}
          />
        </Animated.View>
      )}

      {pickerMode === 'reaction' && (
        <Animated.View entering={FadeInDown.duration(180)} exiting={FadeOutUp.duration(120)}>
          <ReactionPicker selected={instance.reaction} onSelect={handleSetReaction} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const WRITING_VERBS = ['escreva', 'anote', 'liste'];

/** Detecta ações que pedem pra escrever/anotar algo, a partir do texto já resolvido da própria
 * instância — não existe hoje nenhum campo de dados confiável pra isso. Mesmo espírito do
 * prefix-match de scripts/challengeHeuristics.js, só que em runtime. */
function asksToWrite(instance: ChallengeInstance): boolean {
  const title = normalizeText(instance.titulo);
  if (WRITING_VERBS.some((verb) => title.startsWith(verb))) return true;
  const description = normalizeText(instance.descricao ?? '');
  return WRITING_VERBS.some((verb) => description.includes(verb));
}

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  deliveredTime: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.md,
    fontSize: 11,
  },
  remindedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  remindedBannerText: {
    fontWeight: '600',
  },
  body: {
    flexDirection: 'row',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textGroup: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  timingBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  actionTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  externalLinkButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  cameraFeedback: {
    marginTop: spacing.xs,
  },
  pendingActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    gap: spacing.xs,
  },
  reactionPillEmoji: {
    fontSize: 14,
  },
});
