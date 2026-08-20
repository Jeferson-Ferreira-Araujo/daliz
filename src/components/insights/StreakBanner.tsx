import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { radius, spacing, useTheme } from '@/theme';

interface StreakBannerProps {
  currentStreak: number;
  bestStreak: number;
}

/** Não é um gráfico — é um número-herói: a sequência é o dado mais motivador que
 * existe aqui, então ganha destaque próprio em vez de virar mais uma barra. */
export function StreakBanner({ currentStreak, bestStreak }: StreakBannerProps) {
  const { colors } = useTheme();
  const isBest = currentStreak > 0 && currentStreak >= bestStreak;

  return (
    <View style={[styles.container, { backgroundColor: colors.warningBg }]}>
      <AppText style={styles.emoji}>🔥</AppText>
      <View style={styles.textBlock}>
        <AppText variant="statNumber" color={colors.text}>
          {currentStreak} {currentStreak === 1 ? 'dia seguido' : 'dias seguidos'}
        </AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {isBest
            ? 'Sua melhor sequência até agora!'
            : `Seu recorde é de ${bestStreak} ${bestStreak === 1 ? 'dia' : 'dias'} seguidos.`}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  emoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  textBlock: {
    flex: 1,
  },
});
