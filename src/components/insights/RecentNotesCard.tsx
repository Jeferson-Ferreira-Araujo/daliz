import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { radius, spacing, useTheme } from '@/theme';
import { formatLongDate, parseISODate } from '@/utils/date';
import type { RecentNote } from '@/types';

interface RecentNotesCardProps {
  notes: RecentNote[];
}

/**
 * Substitui o antigo resumo semanal baseado em conclusão (removido junto do Concluir/Não
 * consegui — afirmava coisas como "Fortaleceu relacionamentos" a partir só de ter marcado
 * concluído, o que nunca garantiu nada sobre como a ação foi feita de verdade). O conteúdo mais
 * pessoal que ainda existe no histórico é o que a própria pessoa escreveu nas ações que pedem uma
 * anotação (ver ChallengeCard/NoteField) — um mini-diário, não uma métrica de desempenho.
 */
export function RecentNotesCard({ notes }: RecentNotesCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <AppText variant="bodyStrong" style={styles.title}>
        📝 Suas anotações
      </AppText>
      <AppText variant="caption" color={colors.textMuted} style={styles.subtitle}>
        O que você escreveu nas ações que pediam uma nota.
      </AppText>

      {notes.map((entry, index) => (
        <View
          key={entry.instanceId}
          style={[styles.noteRow, index < notes.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
        >
          <AppText variant="caption" color={colors.textMuted}>
            {formatLongDate(parseISODate(entry.date))} · {entry.titulo}
          </AppText>
          <AppText variant="body" style={styles.noteText}>
            {entry.note}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.md,
  },
  noteRow: {
    paddingVertical: spacing.sm,
  },
  noteText: {
    marginTop: 2,
  },
});
