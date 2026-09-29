import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { spacing, useTheme } from '@/theme';

// Placeholder visual do banner fixo acima das tabs (MVP: só esse formato, sem intersticial nem
// rewarded). Tamanho igual ao banner padrão do AdMob (320x50 "Standard Banner") pra já reservar o
// espaço real. Escolhido por AdBannerSlot.tsx sempre que o banner real não pode rodar (preview
// web, Expo Go) e também como fallback de `AdBannerBoundary` se o banner real falhar de um jeito
// que derrube o render (ver comentário completo em AdBannerSlot.tsx).
const BANNER_HEIGHT = 50;

export function AdBanner() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { height: BANNER_HEIGHT, backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
      <AppText variant="caption" color={colors.textMuted}>
        Espaço reservado — Anúncio (AdMob)
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: spacing.sm,
  },
});
