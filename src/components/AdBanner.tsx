import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { spacing, useTheme } from '@/theme';

// Placeholder visual do banner fixo acima das tabs (MVP: só esse formato, sem intersticial nem
// rewarded). Tamanho igual ao banner padrão do AdMob (320x50 "Standard Banner") pra já reservar o
// espaço real.
//
// O banner de verdade (react-native-google-mobile-ads) já está pronto e configurado — ver
// AdBannerNative.tsx, app.json (plugin com os App IDs reais) e src/constants/admob.ts (ad unit ID
// real + IDs de teste). Só não está ligado ainda porque esse SDK nativo não roda no Expo Go nem no
// preview web usados durante o desenvolvimento — só depois de um build nativo (prebuild/EAS).
//
// Pra ativar na hora de gerar o build final: em TabBar.tsx, trocar
//   import { AdBanner } from '@/components/AdBanner';
// por
//   import { AdBannerNative as AdBanner } from '@/components/AdBannerNative';
// (mesmo nome de uso, `<AdBanner />` — o resto do arquivo não muda). Depois, remover este arquivo.
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
