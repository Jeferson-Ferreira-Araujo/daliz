import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { radius, spacing, useTheme } from '@/theme';
import { challengeInstanceRepository } from '@/storage/repositories/challengeInstanceRepository';
import { journalService } from '@/services/journalService';
import { resolveActiveDate } from '@/services/dayCycleService';
import { getInstanceActionKind } from '@/data/challenges';
import { formatLongDate, logicalDateFor, parseISODate } from '@/utils/date';
import { getCurrentDate } from '@/utils/now';
import type { ChallengeInstance, ChallengeInstanceStatus, DaySummary, UserProfile } from '@/types';

interface DayCardProps {
  summary: DaySummary;
  profile: UserProfile | null;
}

const STATUS_META: Record<ChallengeInstanceStatus, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  concluido: { icon: 'checkmark-circle', label: 'Concluído' },
  nao_concluido: { icon: 'close-circle', label: 'Não concluído' },
  ignorado: { icon: 'remove-circle', label: 'Ignorado' },
  pendente: { icon: 'time', label: 'Pendente' },
  atrasado: { icon: 'alert-circle', label: 'Atrasado' },
};

/** Card de um dia no Histórico — resumo sempre visível, detalhe (quais tarefas foram
 * feitas e o resumo em texto livre daquele dia) só carrega quando a pessoa expande. */
export function DayCard({ summary, profile }: DayCardProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [instances, setInstances] = useState<ChallengeInstance[]>([]);
  const [journalText, setJournalText] = useState('');
  const [savedText, setSavedText] = useState('');
  const [saving, setSaving] = useState(false);

  const percentage = Math.round(summary.completionRate * 100);

  async function handleToggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && !loaded) {
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
      // Sugestões nunca aparecem no Histórico (ver ChallengeActionKind) — nunca transicionam de
      // status (nunca tiveram botão de conclusão), então ficariam "Pendente" pra sempre na lista.
      setInstances(visible.filter((i) => getInstanceActionKind(i) === 'acao'));
      setJournalText(entry?.text ?? '');
      setSavedText(entry?.text ?? '');
      setLoaded(true);
    }
  }

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
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Pressable style={styles.header} onPress={handleToggle}>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong">{formatLongDate(parseISODate(summary.date))}</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {summary.completed} concluídas · {summary.notCompleted + summary.ignored} não realizadas
          </AppText>
        </View>
        <View style={[styles.percentageBadge, { backgroundColor: percentage >= 50 ? colors.successBg : colors.surfaceMuted }]}>
          <AppText variant="pillLabel" color={percentage >= 50 ? colors.success : colors.textMuted}>
            {percentage}%
          </AppText>
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
                    const meta = STATUS_META[instance.status];
                    const isDone = instance.status === 'concluido';
                    return (
                      <View key={instance.id} style={styles.taskRow}>
                        <Ionicons
                          name={meta.icon}
                          size={16}
                          color={isDone ? colors.success : colors.textMuted}
                          style={styles.taskIcon}
                        />
                        <AppText variant="body" color={isDone ? colors.text : colors.textMuted} style={styles.taskTitle}>
                          {instance.titulo}
                        </AppText>
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

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  percentageBadge: {
    paddingVertical: spacing.xs,
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
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  taskIcon: {
    marginRight: spacing.sm,
  },
  taskTitle: {
    flex: 1,
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
