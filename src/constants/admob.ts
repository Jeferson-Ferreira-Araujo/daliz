import { Platform } from 'react-native';

// App ID cadastrado no AdMob (ver app.json → plugins → react-native-google-mobile-ads). Hoje só
// existe UM app criado no painel do AdMob ("melhor_que_ontem"), reaproveitado aqui pras duas
// plataformas — antes de publicar de verdade pra iOS, criar o app iOS separado no AdMob (cada
// plataforma tem contagem/relatório próprios) e atualizar este arquivo + app.json com o ID real.
const ADMOB_APP_ID = 'ca-app-pub-9737931606490656~7167414237';

// Ad unit "banner_principal", criado no painel do AdMob — único bloco de anúncio deste MVP (banner
// fixo acima das tabs, ver AdBannerNative.tsx). Mesmo caveat do App ID acima: reaproveitado pras
// duas plataformas até existir um bloco separado pra iOS.
const REAL_BANNER_AD_UNIT_ID = 'ca-app-pub-9737931606490656/6988234651';

// IDs de teste oficiais do Google (https://developers.google.com/admob/android/test-ads e
// .../ios/test-ads) — públicos, documentados, iguais pra qualquer conta AdMob do mundo. Usados
// automaticamente em __DEV__ pra nunca gerar clique/impressão de teste na conta real (política do
// AdMob proíbe interagir com seus próprios anúncios reais).
const TEST_BANNER_AD_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-3940256099942544/2934735716',
  android: 'ca-app-pub-3940256099942544/6300978111',
  default: 'ca-app-pub-3940256099942544/6300978111',
});

export const ADMOB_BANNER_AD_UNIT_ID = __DEV__ ? TEST_BANNER_AD_UNIT_ID! : REAL_BANNER_AD_UNIT_ID;

export { ADMOB_APP_ID };
