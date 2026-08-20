import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { radius, spacing, useTheme } from '@/theme';
import { NoteField } from './NoteField';
import { ActionSupport } from './ActionSupport';
import { ReminderPicker } from './ReminderPicker';
import { CATEGORY_ICON_NAMES } from '@/utils/categoryIcons';
import { buildSpotifySearchUrl } from '@/utils/spotify';
import { buildBibleSearchUrl } from '@/utils/bible';
import { challengeById, getInstanceTiming } from '@/data/challenges';
import { TIMING_LABELS } from '@/engine/challengeTiming';
import type { ChallengeInstance, ReminderType } from '@/types';

interface ChallengeCardProps {
  instance: ChallengeInstance;
  highlighted?: boolean;
  onSaveNote: (note: string) => void;
  onScheduleReminder: (scheduledFor: Date, reminderType: ReminderType) => void;
  onCancelReminder: () => void;
}

type PickerMode = null | 'reminder';
type CameraState = 'idle' | 'saving' | 'saved' | 'denied';

/**
 * Sem ciclo de vida de resultado (ver plano de migração seção 4): mostra a ação, o suporte pra
 * fazê-la (Spotify/Bíblia/câmera/ActionSupport), a anotação quando faz sentido, e "Lembrar mais
 * tarde" — nunca um botão de Concluir/Não consegui. `deliveredAt` já é o único marco de histórico
 * hoje (ver ChallengeInstance).
 */
export function ChallengeCard({ instance, highlighted, onSaveNote, onScheduleReminder, onCancelReminder }: ChallengeCardProps) {
  const { colors } = useTheme();
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [cameraState, setCameraState] = useState<CameraState>('idle');

  const icon = CATEGORY_ICON_NAMES[instance.categoria];
  const showingPicker = pickerMode !== null;
  const timing = getInstanceTiming(instance);
  const musicQuery = challengeById[instance.challengeId]?.musicQuery;
  const bibleQuery = challengeById[instance.challengeId]?.bibleQuery;
  const opensCamera = challengeById[instance.challengeId]?.opensCamera ?? false;
  const supportType = challengeById[instance.challengeId]?.supportType;
  const supportLabel = challengeById[instance.challengeId]?.supportLabel;
  const supportData = challengeById[instance.challengeId]?.supportData;

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
      <View style={styles.body}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted }]}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <View style={styles.textGroup}>
          <View style={[styles.timingBadge, { backgroundColor: colors.primaryMuted }]}>
            <AppText variant="pillLabel" color={colors.primary}>
              {TIMING_LABELS[timing]}
            </AppText>
          </View>
          <AppText variant="subtitle">{instance.titulo}</AppText>

          {musicQuery && (
            <Button
              label="🎧 Abrir no Spotify"
              variant="outline"
              size="sm"
              onPress={handleOpenSpotify}
              style={styles.externalLinkButton}
            />
          )}

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
                  é bom. Independente de conclusão (ver ChallengeInstance). */}
              <Button
                label={instance.reminder ? `⏰ ${formatTime(instance.reminder.scheduledFor)}` : '⏰ Lembrar mais tarde'}
                tone={instance.reminder ? 'primary' : 'neutral'}
                variant="soft"
                size="sm"
                onPress={() => setPickerMode('reminder')}
              />
            </View>
          )}
        </View>
      </View>

      {pickerMode === 'reminder' && (
        <ReminderPicker
          activeReminderLabel={instance.reminder ? formatTime(instance.reminder.scheduledFor) : null}
          onSchedule={handleScheduleReminder}
          onCancelReminder={handleCancelReminder}
          onClose={() => setPickerMode(null)}
        />
      )}

      {instance.note && (
        <View style={styles.expandedDetail}>
          <NoteRecap text={instance.note} />
        </View>
      )}
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
    padding: spacing.md,
    marginBottom: spacing.md,
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
  expandedDetail: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'transparent',
  },
  noteRecapBox: {
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noteRecapLabel: {
    marginBottom: spacing.xs,
  },
});
