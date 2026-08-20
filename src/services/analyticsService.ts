import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { Analytics } from '@react-native-firebase/analytics';

// Firebase Analytics é um SDK nativo (@react-native-firebase/analytics) — não existe no Expo Go
// nem no preview web (`expo start`), só depois de `expo prebuild`/build nativo. `require` é feito
// sob demanda (não no topo do arquivo), mas isso sozinho NÃO basta: o Metro reporta como erro
// fatal global qualquer módulo que falhe na primeira avaliação (`guardedLoadModule`), mesmo com
// o `require` dentro de um try/catch — o app trava mesmo assim (visto num teste real no Expo Go).
// Por isso o `require` nem é tentado quando `executionEnvironment` é `StoreClient` (Expo Go); o
// try/catch continua como segunda camada pra qualquer outro cenário sem o módulo nativo (web).
const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let cachedAnalytics: Analytics | null | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- só resolvido em runtime nativo, ver getAnalyticsInstance
let analyticsModule: any;

function getAnalyticsInstance(): Analytics | null {
  if (cachedAnalytics !== undefined) return cachedAnalytics;
  if (IS_EXPO_GO) {
    cachedAnalytics = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires -- carregado sob demanda, ver comentário acima
    analyticsModule = require('@react-native-firebase/analytics');
    cachedAnalytics = analyticsModule.getAnalytics();
  } catch {
    cachedAnalytics = null;
  }
  return cachedAnalytics ?? null;
}

// Firebase só aceita string/number/boolean como valor de parâmetro de evento — filtra qualquer
// outra coisa (undefined, objeto aninhado) em vez de deixar o SDK nativo rejeitar/travar em runtime.
function sanitizeParams(params?: Record<string, unknown>): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string | number | boolean] =>
      typeof entry[1] === 'string' || typeof entry[1] === 'number' || typeof entry[1] === 'boolean',
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export const analyticsService = {
  log(event: string, params?: Record<string, unknown>): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[analytics] ${event}`, params ?? {});
    }
    const analytics = getAnalyticsInstance();
    if (!analytics) return;
    analyticsModule.logEvent(analytics, event, sanitizeParams(params)).catch(() => {});
  },

  logScreenView(screenName: string): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[analytics] screen_view`, { screenName });
    }
    const analytics = getAnalyticsInstance();
    if (!analytics) return;
    analyticsModule.logScreenView(analytics, { screen_name: screenName, screen_class: screenName }).catch(() => {});
  },

  // Propriedades persistentes do usuário — diferente de log(), que é "isso aconteceu agora",
  // isso é "isso é verdade sobre essa pessoa", disponível como filtro/segmento em qualquer
  // relatório do Firebase, não só nos eventos onde foi enviado explicitamente.
  setUserProperties(properties: Record<string, string | number | boolean | null>): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[analytics] user_properties`, properties);
    }
    const analytics = getAnalyticsInstance();
    if (!analytics) return;
    const stringified = Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, value == null ? null : String(value)]));
    analyticsModule.setUserProperties(analytics, stringified).catch(() => {});
  },
};
