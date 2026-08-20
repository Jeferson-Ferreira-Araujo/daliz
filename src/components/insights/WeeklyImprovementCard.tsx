import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { radius, spacing, useTheme } from '@/theme';
import { WEEKLY_HIGHLIGHT_LABELS, buildTopHighlightPhrase } from '@/data/weeklyHighlightCopy';
import type { WeeklyInsightWeek } from '@/types';

interface WeeklyImprovementCardProps {
  week: WeeklyInsightWeek;
}

// Abaixo desse total, ainda mostramos uma nota de incentivo junto do número — nunca "você fez
// pouco" (seção 14 do pedido), só um lembrete de que a semana ainda está em andamento.
const LOW_COUNT_THRESHOLD = 3;

/**
 * "O que você melhorou?" — card de resumo semanal dentro de Insights. Puramente apresentacional:
 * toda a lógica (período da semana, contagem por categoria, desempate) já vem pronta em
 * `week` (ver statsService.getWeeklyInsight). Sem gamificação (sem XP/pontos/streak aqui — o
 * streak já tem seu próprio banner) e sem comparação com semanas anteriores (fora de escopo
 * nesta versão, ver WeeklyInsight.previousWeek).
 */
export function WeeklyImprovementCard({ week }: WeeklyImprovementCardProps) {
  const { colors } = useTheme();
  const hasAnyCompleted = week.totalCompleted > 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <AppText variant="bodyStrong" style={styles.title}>
        ✨ O que você melhorou?
      </AppText>
      <AppText variant="caption" color={colors.textMuted} style={styles.subtitle}>
        Veja como pequenas ações fizeram parte da sua semana.
      </AppText>

      {!hasAnyCompleted ? (
        <AppText variant="body" color={colors.textMuted} style={styles.emptyText}>
          Sua semana ainda está começando. Complete algumas pequenas ações e, no fim da semana,
          veremos onde você esteve mais presente.
        </AppText>
      ) : (
        <>
          <View style={styles.totalBlock}>
            <AppText variant="statNumber" color={colors.text}>
              {week.totalCompleted}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {week.totalCompleted === 1 ? 'ação concluída' : 'ações concluídas'}
            </AppText>
            {week.totalCompleted < LOW_COUNT_THRESHOLD && (
              <AppText variant="caption" color={colors.textMuted} style={styles.lowCountNote}>
                A semana está apenas começando.
              </AppText>
            )}
          </View>

          {week.highlights.length > 0 && (
            <View style={styles.highlights}>
              {week.highlights.map(({ categoria, count }) => {
                const { title, icon } = WEEKLY_HIGHLIGHT_LABELS[categoria];
                return (
                  <View key={categoria} style={styles.highlightRow}>
                    <AppText style={styles.highlightEmoji}>{icon}</AppText>
                    <View style={styles.highlightText}>
                      <AppText variant="body">{title}</AppText>
                      <AppText variant="caption" color={colors.textMuted}>
                        {count === 1 ? '1 ação' : `${count} ações`}
                      </AppText>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {week.topHighlight && (
            <View style={[styles.topHighlight, { borderTopColor: colors.border }]}>
              <AppText variant="bodyStrong" style={styles.topHighlightTitle}>
                ✨ Mudança que mais se destacou
              </AppText>
              <AppText variant="body" color={colors.textMuted}>
                {buildTopHighlightPhrase(week.topHighlight.categoria, week.topHighlight.count)}
              </AppText>
            </View>
          )}
        </>
      )}
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
  emptyText: {
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  totalBlock: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  lowCountNote: {
    marginTop: spacing.xs,
  },
  highlights: {
    marginBottom: spacing.md,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  highlightEmoji: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  highlightText: {
    flex: 1,
    flexShrink: 1,
  },
  topHighlight: {
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  topHighlightTitle: {
    marginBottom: spacing.xs,
  },
});
