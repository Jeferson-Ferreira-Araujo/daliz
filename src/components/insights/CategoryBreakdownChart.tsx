import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { CATEGORY_CHART_COLORS, radius, spacing, useTheme } from '@/theme';
import { CHALLENGE_CATEGORY_ICONS, CHALLENGE_CATEGORY_LABELS, type CategoryCount } from '@/types';

interface CategoryBreakdownChartProps {
  entries: CategoryCount[];
}

/** Uma barra por categoria — a cor é fixa por identidade (nunca escolhida por posição/índice), o
 * comprimento é relativo à categoria mais recebida (não uma taxa de conclusão, que não existe
 * mais). Mostra quanto essa pessoa tem recebido de cada assunto, não o quanto "concluiu". */
export function CategoryBreakdownChart({ entries }: CategoryBreakdownChartProps) {
  const { colors } = useTheme();
  const max = Math.max(1, ...entries.map((e) => e.count));

  return (
    <View>
      {entries.map((entry) => {
        const percent = Math.round((entry.count / max) * 100);
        const color = CATEGORY_CHART_COLORS[entry.categoria];
        return (
          <View key={entry.categoria} style={styles.row}>
            <View style={styles.labelRow}>
              <AppText variant="body">
                {CHALLENGE_CATEGORY_ICONS[entry.categoria]} {CHALLENGE_CATEGORY_LABELS[entry.categoria]}
              </AppText>
              <AppText variant="bodyStrong" color={color}>
                {entry.count}
              </AppText>
            </View>
            <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
              <View style={[styles.fill, { width: `${Math.max(4, percent)}%`, backgroundColor: color }]} />
            </View>
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
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
