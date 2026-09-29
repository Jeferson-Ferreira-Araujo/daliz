import Constants, { ExecutionEnvironment } from 'expo-constants';
import { crashService } from './crashService';

// Este arquivo é a versão ANDROID/iOS — a versão web fica em admobService.web.ts (ver comentário
// lá pra entender por quê: react-native-google-mobile-ads quebra o bundling do Metro pra web
// mesmo com o require dentro de um try/catch, então a separação por arquivo é obrigatória, não só
// o guard de Expo Go abaixo).
//
// Mesmo padrão de analyticsService.ts/crashService.ts pro resto: react-native-google-mobile-ads é
// um SDK nativo, não existe no Expo Go. `require` sob demanda + try/catch não basta sozinho pra
// esse caso — o Metro reporta como erro fatal global qualquer módulo que falhe na primeira
// avaliação (`guardedLoadModule`), mesmo com o `require` dentro de um try/catch. Por isso o
// `require` nem é tentado quando `executionEnvironment` é `StoreClient` (Expo Go).
const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let initialized = false;

export const admobService = {
  /**
   * Chamado uma única vez na inicialização do app (ver app/_layout.tsx) — antes disso o SDK do
   * AdMob nunca tinha `mobileAds().initialize()` chamado em lugar nenhum, o que pode ter
   * contribuído pro crash real visto no onboarding num build de teste anterior (ver comentário em
   * AdBannerNative.tsx). Idempotente e nunca lança: falha de inicialização não pode derrubar o
   * app, só significa que o banner real não vai carregar (AdBannerNative trata isso via
   * onAdFailedToLoad, não aqui).
   */
  initialize(): void {
    if (initialized || IS_EXPO_GO) return;
    initialized = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires -- carregado sob demanda, ver comentário acima
      const mobileAds = require('react-native-google-mobile-ads').default;
      mobileAds()
        .initialize()
        .catch((error: unknown) => crashService.recordError(error, 'admobService.initialize'));
    } catch (error) {
      crashService.recordError(error, 'admobService.initialize.require');
    }
  },
};
