import React from 'react';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { ADMOB_BANNER_AD_UNIT_ID } from '@/constants/admob';
import { analyticsService } from '@/services/analyticsService';

/**
 * Banner real do AdMob (SDK nativo, react-native-google-mobile-ads) — pronto pra produção, mas
 * NUNCA importado por nenhuma tela ainda (ver TabBar.tsx, que continua usando o placeholder visual
 * em AdBanner.tsx). Esse SDK não roda no Expo Go nem no preview web (`expo start`), só depois de
 * `expo prebuild`/build nativo — importar isto num arquivo ativo quebraria o app inteiro no fluxo
 * de desenvolvimento atual.
 *
 * Pra ativar de verdade na hora de gerar o build final: em TabBar.tsx, trocar
 * `import { AdBanner } from '@/components/AdBanner'` por
 * `import { AdBannerNative as AdBanner } from '@/components/AdBannerNative'` — o resto do arquivo
 * não precisa mudar (mesmo nome de uso, `<AdBanner />`).
 */
export function AdBannerNative() {
  return (
    <BannerAd
      unitId={ADMOB_BANNER_AD_UNIT_ID}
      size={BannerAdSize.BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      onAdLoaded={() => analyticsService.log('banner_ad_loaded')}
      onAdFailedToLoad={(error) => analyticsService.log('banner_ad_failed', { errorMessage: error.message })}
      onAdOpened={() => analyticsService.log('banner_ad_clicked')}
    />
  );
}
