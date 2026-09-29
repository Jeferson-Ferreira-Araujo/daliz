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

// `__DEV__` sozinho não bastava: é `false` em QUALQUER build EAS que não seja dev client — inclusive
// o profile "preview" (o que é usado pra testar no aparelho, ver eas.json), então builds de teste
// estavam servindo o anúncio REAL sem ninguém perceber (mesmo motivo do banner não ter fill ainda:
// conta/bloco novo). `EXPO_PUBLIC_APP_VARIANT` vem de `eas.json` → build.<profile>.env — só o
// profile "production" o define como "production"; qualquer outro cenário (dev, preview, ou a
// variável simplesmente não existir) cai em teste. Erra sempre pro lado seguro: a política do
// AdMob proíbe interagir com o próprio anúncio real, e um tester tocando sem querer num anúncio
// real durante QA é exatamente esse risco.
const IS_PRODUCTION_BUILD = process.env.EXPO_PUBLIC_APP_VARIANT === 'production';

export const ADMOB_BANNER_AD_UNIT_ID = IS_PRODUCTION_BUILD ? REAL_BANNER_AD_UNIT_ID : TEST_BANNER_AD_UNIT_ID!;

export { ADMOB_APP_ID };
