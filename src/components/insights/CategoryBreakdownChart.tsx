import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { CATEGORY_CHART_COLORS, radius, spacing, useTheme } from '@/theme';
import { CHALLENGE_CATEGORY_ICONS, CHALLENGE_CATEGORY_LABELS, type CategoryBreakdownEntry } from '@/types';

interface CategoryBreakdownChartProps {
  entries: CategoryBreakdownEntry[];
}

/** Uma barra por categoria — a cor é fixa por identidade (nunca escolhida por
 * posição/índice), o comprimento é a taxa de conclusão daquela categoria. */
export function CategoryBreakdownChart({ entries }: CategoryBreakdownChartProps) {
  const { colors } = useTheme();

  return (
    <View>
      {entries.map((entry) => {
        const percent = Math.round(entry.completionRate * 100);
        const color = CATEGORY_CHART_COLORS[entry.categoria];
        return (
          <View key={entry.categoria} style={styles.row}>
            <View style={styles.labelRow}>
              <AppText variant="body">
                {CHALLENGE_CATEGORY_ICONS[entry.categoria]} {CHALLENGE_CATEGORY_LABELS[entry.categoria]}
              </AppText>
              <AppText variant="bodyStrong" color={color}>
                {percent}%
              </AppText>
            </View>
            <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
              <View style={[styles.fill, { width: `${Math.max(4, percent)}%`, backgroundColor: color }]} />
            </View>
            <AppText variant="caption" color={colors.textMuted}>
              {entry.totalCompleted}/{entry.totalResolved} concluídos
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
