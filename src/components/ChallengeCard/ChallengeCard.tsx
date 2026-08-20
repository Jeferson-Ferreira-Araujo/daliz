import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { radius, spacing, useTheme } from '@/theme';
import { ReactionPicker } from './ReactionPicker';
import { AbandonReasonPicker } from './AbandonReasonPicker';
import { NoteField } from './NoteField';
import { ActionSupport } from './ActionSupport';
import { ReminderPicker } from './ReminderPicker';
import { CATEGORY_ICON_NAMES } from '@/utils/categoryIcons';
import { getEncouragementMessage } from '@/data/encouragementMessages';
import { buildSpotifySearchUrl } from '@/utils/spotify';
import { buildBibleSearchUrl } from '@/utils/bible';
import { challengeById, getInstanceTiming } from '@/data/challenges';
import { TIMING_LABELS } from '@/engine/challengeTiming';
import {
  ABANDON_REASON_LABELS,
  CHALLENGE_REACTION_LABELS,
  type AbandonReason,
  type ChallengeInstance,
  type ChallengeReaction,
  type ReminderType,
} from '@/types';

const REACTION_EMOJI: Record<ChallengeReaction, string> = {
  fez_muito_bem: '❤️',
  foi_bom: '🙂',
  foi_normal: '😐',
  nao_fez_diferenca: '😕',
  foi_dificil: '😣',
};

interface ChallengeCardProps {
  instance: ChallengeInstance;
  isLate: boolean;
  highlighted?: boolean;
  onComplete: (reaction: ChallengeReaction) => void;
  onAbandon: (reason: AbandonReason, detail?: string) => void;
  onSaveNote: (note: string) => void;
  onScheduleReminder: (scheduledFor: Date, reminderType: ReminderType) => void;
  onCancelReminder: () => void;
}

type PickerMode = null | 'reaction' | 'abandon' | 'reminder';
type CameraState = 'idle' | 'saving' | 'saved' | 'denied';

export function ChallengeCard({
  instance,
  isLate,
  highlighted,
  onComplete,
  onAbandon,
  onSaveNote,
  onScheduleReminder,
  onCancelReminder,
}: ChallengeCardProps) {
  const { colors } = useTheme();
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [expanded, setExpanded] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>('idle');

  const icon = CATEGORY_ICON_NAMES[instance.categoria];
  const isPending = instance.status === 'pendente';
  const isDone = instance.status === 'concluido';
  const isNotDone = instance.status === 'nao_concluido';
  const isIgnored = instance.status === 'ignorado';

  const tone = isDone ? colors.success : isNotDone ? colors.danger : isIgnored ? colors.textMuted : colors.warning;
  const toneBg = isDone ? colors.successBg : isNotDone ? colors.dangerBg : isIgnored ? colors.surfaceMuted : colors.warningBg;
  const statusLabel = isDone
    ? 'Concluída'
    : isNotDone
      ? 'Não realizada'
      : isIgnored
        ? 'Sem interação'
        : isLate
          ? 'Atrasado'
          : 'Pendente';

  const canExpand = isDone || isNotDone;
  const showingPicker = pickerMode !== null;
  const timing = getInstanceTiming(instance);
  const musicQuery = challengeById[instance.challengeId]?.musicQuery;
  const bibleQuery = challengeById[instance.challengeId]?.bibleQuery;
  const opensCamera = challengeById[instance.challengeId]?.opensCamera ?? false;
  const supportType = challengeById[instance.challengeId]?.supportType;
  const supportLabel = challengeById[instance.challengeId]?.supportLabel;
  const supportData = challengeById[instance.challengeId]?.supportData;

  function handleHeaderPress() {
    if (canExpand) setExpanded((prev) => !prev);
  }

  function handleOpenSpotify() {
    if (musicQuery) Linking.openURL(buildSpotifySearchUrl(musicQuery)).catch(() => {});
  }

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

  function handleComplete(reaction: ChallengeReaction) {
    setPickerMode(null);
    onComplete(reaction);
  }

  function handleAbandon(reason: AbandonReason, detail?: string) {
    setPickerMode(null);
    onAbandon(reason, detail);
  }

  function handleScheduleReminder(scheduledFor: Date, reminderType: ReminderType) {
    setPickerMode(null);
    onScheduleReminder(scheduledFor, reminderType);
  }

  function handleCancelReminder() {
    setPickerMode(null);
    onCancelReminder();
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }, highlighted && { borderColor: colors.primary, borderWidth: 2 }]}>
      <Pressable
        onPress={handleHeaderPress}
        style={styles.header}
        disabled={!canExpand}
        accessibilityRole={canExpand ? 'button' : undefined}
      >
        <AppText variant="pillLabel" color={tone}>
          {statusLabel}
        </AppText>
        {canExpand && (
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
        )}
      </Pressable>

      <View style={styles.body}>
        <View style={[styles.iconCircle, { backgroundColor: toneBg }]}>
          <Ionicons name={icon} size={20} color={tone} />
        </View>
        <View style={styles.textGroup}>
          {isPending && (
            <View style={[styles.timingBadge, { backgroundColor: colors.primaryMuted }]}>
              <AppText variant="pillLabel" color={colors.primary}>
                {TIMING_LABELS[timing]}
              </AppText>
            </View>
          )}
          <AppText variant="subtitle">{instance.titulo}</AppText>
          {!isPending && (
            <AppText variant="caption" color={colors.textMuted} style={styles.subtitle}>
              {subtitleFor(instance)}
            </AppText>
          )}

          {isPending && musicQuery && (
            <Button
              label="🎧 Abrir no Spotify"
              variant="outline"
              size="sm"
              onPress={handleOpenSpotify}
              style={styles.externalLinkButton}
            />
          )}

          {isPending && bibleQuery && (
            <Button
              label="📖 Ler versículo"
              variant="outline"
              size="sm"
              onPress={handleOpenBible}
              style={styles.externalLinkButton}
            />
          )}

          {isPending && opensCamera && (
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

          {isPending && (
            <ActionSupport supportType={supportType} supportLabel={supportLabel} supportData={supportData} />
          )}

          {isPending && !showingPicker && asksToWrite(instance) && (
            <NoteField value={instance.note ?? ''} onSave={onSaveNote} />
          )}

          {isPending && !showingPicker && (
            <View style={styles.pendingActions}>
              <Button label="Concluir" tone="success" size="sm" onPress={() => setPickerMode('reaction')} />
              <Button
                label="Não consegui fazer"
                tone="neutral"
                variant="soft"
                size="sm"
                onPress={() => setPickerMode('abandon')}
              />
              {/* "Lembrar mais tarde" fica disponível em qualquer timing (now/today/contextual) —
                  não é uma decisão de `timing`, é a pessoa dizendo que esse momento específico não
                  é bom (ver seção 1 do pedido de lembretes). */}
              <Button
                label={instance.reminder ? `⏰ ${formatTime(instance.reminder.scheduledFor)}` : '⏰ Lembrar mais tarde'}
                tone={instance.reminder ? 'primary' : 'neutral'}
                variant="soft"
                size="sm"
                onPress={() => setPickerMode('reminder')}
              />
            </View>
          )}

          {isDone && !expanded && instance.reaction && (
            <Pressable onPress={() => setExpanded(true)} style={[styles.recapPill, { borderColor: colors.border }]}>
              <AppText style={styles.recapEmoji}>{REACTION_EMOJI[instance.reaction]}</AppText>
              <AppText variant="caption">{CHALLENGE_REACTION_LABELS[instance.reaction]}</AppText>
              <Ionicons name="chevron-forward" size={13} color={colors.textMuted} />
            </Pressable>
          )}

          {isNotDone && !expanded && instance.abandonReason && (
            <Pressable onPress={() => setExpanded(true)} style={[styles.recapPill, { borderColor: colors.border }]}>
              <AppText variant="caption" numberOfLines={1} style={{ flexShrink: 1 }}>
                {instance.abandonReason === 'outro' && instance.abandonReasonDetail
                  ? instance.abandonReasonDetail
                  : ABANDON_REASON_LABELS[instance.abandonReason]}
              </AppText>
              <Ionicons name="chevron-forward" size={13} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {pickerMode === 'reaction' && <ReactionPicker onSelect={handleComplete} />}
      {pickerMode === 'abandon' && <AbandonReasonPicker onSelect={handleAbandon} />}
      {pickerMode === 'reminder' && (
        <ReminderPicker
          activeReminderLabel={instance.reminder ? formatTime(instance.reminder.scheduledFor) : null}
          onSchedule={handleScheduleReminder}
          onCancelReminder={handleCancelReminder}
          onClose={() => setPickerMode(null)}
        />
      )}

      {expanded && isDone && instance.reaction && (
        <View style={styles.expandedDetail}>
          <ReactionRecap reaction={instance.reaction} />
          <View style={[styles.encouragementBox, { backgroundColor: colors.successBg }]}>
            <AppText variant="body" color={colors.success}>
              ✨ {getEncouragementMessage(instance.categoria, instance.reaction)}
            </AppText>
          </View>
          {instance.note && <NoteRecap text={instance.note} />}
        </View>
      )}

      {expanded && isNotDone && instance.abandonReason && (
        <View style={styles.expandedDetail}>
          <AbandonRecap reason={instance.abandonReason} detail={instance.abandonReasonDetail} />
          {instance.note && <NoteRecap text={instance.note} />}
        </View>
      )}
    </View>
  );
}

function ReactionRecap({ reaction }: { reaction: ChallengeReaction }) {
  const { colors } = useTheme();
  const order: ChallengeReaction[] = ['fez_muito_bem', 'foi_bom', 'foi_normal', 'nao_fez_diferenca', 'foi_dificil'];
  return (
    <View style={styles.recapGrid}>
      <AppText variant="bodyStrong" style={styles.question}>
        Como essa ação fez você se sentir?
      </AppText>
      <View style={styles.options}>
        {order.map((r) => {
          const selected = r === reaction;
          return (
            <View key={r} style={styles.option}>
              <View
                style={[
                  styles.emojiCircle,
                  { backgroundColor: colors.surface, borderColor: selected ? colors.success : colors.border },
                  selected && { borderWidth: 2 },
                ]}
              >
                <AppText style={styles.emoji}>{REACTION_EMOJI[r]}</AppText>
              </View>
              <AppText variant="caption" color={selected ? colors.text : colors.textMuted} style={styles.optionLabel}>
                {CHALLENGE_REACTION_LABELS[r]}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function AbandonRecap({ reason, detail }: { reason: AbandonReason; detail: string | null }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.abandonRecapBox, { backgroundColor: colors.dangerBg }]}>
      <AppText variant="body" color={colors.danger}>
        {reason === 'outro' && detail ? detail : ABANDON_REASON_LABELS[reason]}
      </AppText>
    </View>
  );
}

function NoteRecap({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.noteRecapBox, { backgroundColor: colors.surfaceMuted }]}>
      <AppText variant="caption" color={colors.textMuted} style={styles.noteRecapLabel}>
        📝 O que você escreveu
      </AppText>
      <AppText variant="body">{text}</AppText>
    </View>
  );
}

const WRITING_VERBS = ['escreva', 'anote', 'liste'];

/** Detecta ações que pedem pra escrever/anotar algo, a partir do texto já resolvido da própria
 * instância — não existe hoje nenhum campo de dados confiável pra isso (ver plano). Mesmo
 * espírito do prefix-match de scripts/challengeHeuristics.js, só que em runtime. */
function asksToWrite(instance: ChallengeInstance): boolean {
  const title = normalizeText(instance.titulo);
  if (WRITING_VERBS.some((verb) => title.startsWith(verb))) return true;
  const description = normalizeText(instance.descricao);
  return WRITING_VERBS.some((verb) => description.includes(verb));
}

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// Só chamada pra status resolvidos (isPending já filtra "pendente" antes de renderizar isto) —
// enquanto pendente, o card não mostra nenhuma estimativa de tempo (ver seção "primeira
// notificação" do pedido: tempo estimado passava a sensação errada de prazo pra concluir).
function subtitleFor(instance: ChallengeInstance): string {
  if (instance.status === 'concluido') {
    return instance.timeToCompleteMs != null
      ? `Você fez isso em ${formatMinutes(instance.timeToCompleteMs)}.`
      : 'Concluído.';
  }
  if (instance.status === 'nao_concluido') return 'Você não realizou essa ação.';
  return 'Você não interagiu com essa ação.';
}

function formatMinutes(ms: number): string {
  const minutes = Math.max(1, Math.round(ms / 60000));
  return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
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
  subtitle: {
    marginTop: 2,
  },
  timingBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
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
  recapPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    gap: spacing.xs,
    maxWidth: '100%',
  },
  recapEmoji: {
    fontSize: 14,
  },
  expandedDetail: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'transparent',
  },
  recapGrid: {},
  question: {
    marginBottom: spacing.md,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  option: {
    alignItems: 'center',
    width: '19%',
    minWidth: 58,
    marginBottom: spacing.sm,
  },
  emojiCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emoji: {
    fontSize: 22,
  },
  optionLabel: {
    textAlign: 'center',
    fontSize: 11,
  },
  encouragementBox: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  abandonRecapBox: {
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noteRecapBox: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noteRecapLabel: {
    marginBottom: spacing.xs,
  },
});
