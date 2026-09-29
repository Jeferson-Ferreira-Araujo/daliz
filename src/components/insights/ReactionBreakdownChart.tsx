import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { REACTION_EMOJI } from '@/components/ChallengeCard/ReactionPicker';
import { radius, spacing, useTheme } from '@/theme';
import { CHALLENGE_REACTION_LABELS, type ChallengeReaction, type ReactionCount } from '@/types';

interface ReactionBreakdownChartProps {
  entries: ReactionCount[];
}

/** Uma barra por reação — cor fixa por sentimento (positivo/neutro/difícil), nunca por posição. O
 * comprimento é relativo à reação mais marcada, igual CategoryBreakdownChart: mostra o que a
 * pessoa tem sentido, não uma taxa de "sucesso". */
export function ReactionBreakdownChart({ entries }: ReactionBreakdownChartProps) {
  const { colors } = useTheme();
  const colorFor: Record<ChallengeReaction, string> = {
    fez_muito_bem: colors.success,
    foi_bom: colors.success,
    foi_normal: colors.textMuted,
    nao_fez_diferenca: colors.textMuted,
    foi_dificil: colors.danger,
  };
  const max = Math.max(1, ...entries.map((e) => e.count));

  return (
    <View>
      {entries.map((entry) => {
        const percent = Math.round((entry.count / max) * 100);
        const color = colorFor[entry.reaction];
        return (
          <View key={entry.reaction} style={styles.row}>
            <View style={styles.labelRow}>
              <AppText variant="body">
                {REACTION_EMOJI[entry.reaction]} {CHALLENGE_REACTION_LABELS[entry.reaction]}
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
