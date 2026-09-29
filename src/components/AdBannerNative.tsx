import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { ADMOB_BANNER_AD_UNIT_ID } from '@/constants/admob';
import { analyticsService } from '@/services/analyticsService';

/**
 * Banner real do AdMob (SDK nativo, react-native-google-mobile-ads) — usado por AdBannerSlot.tsx,
 * nunca importado direto por um arquivo ativo em Expo Go/web (ver comentário lá pra entender por
 * quê). `admobService.initialize()` roda no boot (ver app/_layout.tsx). Ainda existe uma suspeita
 * documentada (não confirmada) de que o `BannerAd` (Fabric Native Component) tenha suporte
 * incompleto à New Architecture no Android (`newArchEnabled: true` no app.json) — ver
 * https://github.com/invertase/react-native-google-mobile-ads/issues/225 e /issues/529; por isso
 * AdBannerSlot sempre envolve isto num `AdBannerBoundary`.
 *
 * `alignItems: 'center'` no wrapper é necessário: o `BannerAd` tem largura fixa (320dp no tamanho
 * BANNER) e, sem isso, alinha à esquerda em vez de centralizar na tela — View por padrão não
 * centraliza filhos de largura menor que a própria largura no eixo cruzado.
 */
export function AdBannerNative() {
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={ADMOB_BANNER_AD_UNIT_ID}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        onAdLoaded={() => analyticsService.log('banner_ad_loaded')}
        onAdFailedToLoad={(error) => analyticsService.log('banner_ad_failed', { errorMessage: error.message })}
        onAdOpened={() => analyticsService.log('banner_ad_clicked')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
