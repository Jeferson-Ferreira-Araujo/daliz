import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { CATEGORY_CHART_COLORS, radius, spacing, useTheme } from '@/theme';
import { challengeInstanceRepository } from '@/storage/repositories/challengeInstanceRepository';
import { journalService } from '@/services/journalService';
import { resolveActiveDate } from '@/services/dayCycleService';
import { getInstanceActionKind } from '@/data/challenges';
import { CATEGORY_ICON_NAMES } from '@/utils/categoryIcons';
import { REACTION_EMOJI } from '@/components/ChallengeCard/ReactionPicker';
import { formatLongDate, logicalDateFor, parseISODate } from '@/utils/date';
import { getCurrentDate } from '@/utils/now';
import { CHALLENGE_REACTION_LABELS } from '@/types';
import type { ChallengeInstance, DaySummary, UserProfile } from '@/types';

interface DayCardProps {
  summary: DaySummary;
  profile: UserProfile | null;
  // Abre o card já expandido, carregando os dados de uma vez — usado quando a pessoa chega aqui
  // pelo lembrete "Como foi seu dia hoje?" (ver notificationService.scheduleDayReflectionReminder
  // e app/(main)/(tabs)/history.tsx), pra não ter que achar e tocar no card de novo.
  autoExpand?: boolean;
}

/** Card de um dia no Histórico — resumo sempre visível, detalhe (quais tarefas foram
 * feitas, a reação e a anotação de cada uma, e o resumo em texto livre do dia) só
 * carrega quando a pessoa expande. */
export function DayCard({ summary, profile, autoExpand }: DayCardProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [instances, setInstances] = useState<ChallengeInstance[]>([]);
  const [journalText, setJournalText] = useState('');
  const [savedText, setSavedText] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadDetail() {
    const [dayInstances, entry] = await Promise.all([
      challengeInstanceRepository.getByDate(summary.date),
      journalService.getForDate(summary.date),
    ]);
    const now = getCurrentDate();
    // Hoje ainda em andamento: só mostra o que já foi revelado — nunca as próximas ações
    // que ainda vão chegar (mesma regra de dayCycleService.getSummaryForDate/resolveActiveDate).
    const today = profile ? resolveActiveDate(profile, now) : logicalDateFor(now);
    const visible =
      summary.date === today ? dayInstances.filter((i) => new Date(i.scheduledFor).getTime() <= now.getTime()) : dayInstances;
    // ChallengeActionKind hoje só tem 'acao' (sugestões existiram no catálogo antigo e foram
    // removidas na Fase 2) — filtro mantido por segurança/documentação, não filtra nada de fato.
    setInstances(visible.filter((i) => getInstanceActionKind(i) === 'acao'));
    setJournalText(entry?.text ?? '');
    setSavedText(entry?.text ?? '');
    setLoaded(true);
  }

  async function handleToggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && !loaded) await loadDetail();
  }

  useEffect(() => {
    if (!autoExpand) return;
    setExpanded(true);
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só deve rodar uma vez, ao montar já com autoExpand
  }, []);

  async function handleSaveJournal() {
    setSaving(true);
    try {
      await journalService.saveForDate(summary.date, journalText);
      setSavedText(journalText.trim());
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable style={styles.header} onPress={handleToggle}>
        {/* Ícone de calendário só pra dar uma cor de entrada em cada linha — sem isso a lista
            inteira é só texto preto/cinza em cima de branco, ver pedido de "menos opaco". */}
        <View style={[styles.headerIcon, { backgroundColor: colors.primaryMuted }]}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <AppText variant="bodyStrong">{formatLongDate(parseISODate(summary.date))}</AppText>
          <View style={[styles.countPill, { backgroundColor: colors.primaryMuted }]}>
            <AppText variant="pillLabel" color={colors.primary}>
              {summary.total} {summary.total === 1 ? 'ação' : 'ações'}
            </AppText>
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textMuted}
          style={styles.chevron}
        />
      </Pressable>

      {expanded && (
        <View style={[styles.detail, { borderTopColor: colors.border }]}>
          {!loaded ? (
            <ActivityIndicator color={colors.primary} style={styles.loading} />
          ) : (
            <>
              {instances.length === 0 ? (
                <AppText variant="caption" color={colors.textMuted}>
                  Nenhuma ação registrada nesse dia.
                </AppText>
              ) : (
                <View style={styles.taskList}>
                  {instances.map((instance) => {
                    const categoryColor = CATEGORY_CHART_COLORS[instance.categoria];
                    return (
                      <View key={instance.id} style={[styles.taskRow, { borderColor: colors.border }]}>
                        {/* Ícone colorido por categoria (mesma paleta de Insights) — é a principal
                            fonte de cor da lista, e ajuda a reconhecer o tipo de ação de relance. */}
                        <View style={[styles.taskIconCircle, { backgroundColor: `${categoryColor}26` }]}>
                          <Ionicons name={CATEGORY_ICON_NAMES[instance.categoria]} size={16} color={categoryColor} />
                        </View>
                        <View style={styles.taskContent}>
                          <View style={styles.taskHeaderRow}>
                            <AppText variant="caption" color={colors.textMuted}>
                              {formatTime(instance.deliveredAt ?? instance.scheduledFor)}
                            </AppText>
                            {/* Status/reação, se a pessoa marcou uma — mesmo emoji+label do
                                ReactionPicker, pra reconhecer de cara sem precisar lembrar o que
                                cada emoji significa. */}
                            {instance.reaction && (
                              <View style={[styles.reactionChip, { backgroundColor: colors.surfaceMuted }]}>
                                <AppText style={styles.reactionEmoji}>{REACTION_EMOJI[instance.reaction]}</AppText>
                                <AppText variant="caption" color={colors.textMuted}>
                                  {CHALLENGE_REACTION_LABELS[instance.reaction]}
                                </AppText>
                              </View>
                            )}
                          </View>
                          <AppText variant="body" style={styles.taskTitle}>
                            {instance.titulo}
                          </AppText>
                          {/* A resposta que a pessoa escreveu nessa ação (ver ChallengeCard.NoteField),
                              se houver — sem isso, o que foi escrito só aparecia em Insights
                              ("Suas anotações"), nunca aqui junto da própria ação. */}
                          {instance.note && (
                            <View style={[styles.noteBox, { backgroundColor: colors.surfaceMuted, borderLeftColor: categoryColor }]}>
                              <AppText variant="caption" color={colors.text} style={styles.noteText}>
                                {instance.note}
                              </AppText>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              <AppText variant="caption" color={colors.textMuted} style={styles.journalLabel}>
                Como foi esse dia? (opcional)
              </AppText>
              <TextField
                value={journalText}
                onChangeText={setJournalText}
                placeholder="Escreva livremente sobre como você se sentiu nesse dia..."
                multiline
                numberOfLines={3}
                style={styles.journalInput}
              />
              <View style={styles.journalFooter}>
                {journalText.trim() === savedText && savedText.length > 0 && (
                  <AppText variant="caption" color={colors.success}>
                    Salvo
                  </AppText>
                )}
                <Button
                  label={saving ? 'Salvando...' : 'Salvar'}
                  size="sm"
                  variant="outline"
                  onPress={handleSaveJournal}
                  disabled={saving || journalText.trim() === savedText}
                  style={styles.saveButton}
                />
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  countPill: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  chevron: {
    marginLeft: spacing.sm,
  },
  detail: {
    borderTopWidth: 1,
    padding: spacing.md,
  },
  loading: {
    marginVertical: spacing.sm,
  },
  taskList: {
    marginBottom: spacing.md,
  },
  taskRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  taskIconCircle: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  taskContent: {
    flex: 1,
  },
  taskHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  taskTitle: {
    flex: 1,
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  noteBox: {
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
  },
  noteText: {
    fontStyle: 'italic',
  },
  journalLabel: {
    marginBottom: spacing.xs,
  },
  journalInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  journalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  saveButton: {
    minWidth: 90,
  },
});
