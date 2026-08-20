import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { Crashlytics } from '@react-native-firebase/crashlytics';

// Mesmo padrão de analyticsService.ts: @react-native-firebase/crashlytics é um SDK nativo, não
// existe no Expo Go nem no preview web. `require` sob demanda + try/catch não basta sozinho — o
// Metro reporta como erro fatal global qualquer módulo que falhe na primeira avaliação
// (`guardedLoadModule`), derrubando o app mesmo com o `require` dentro de um try/catch (visto num
// teste real no Expo Go). Por isso o `require` nem é tentado em `executionEnvironment ===
// StoreClient` (Expo Go); o try/catch continua como segunda camada pra outros cenários (web).
const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let cachedCrashlytics: Crashlytics | null | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- só resolvido em runtime nativo, ver getCrashlyticsInstance
let crashlyticsModule: any;

function getCrashlyticsInstance(): Crashlytics | null {
  if (cachedCrashlytics !== undefined) return cachedCrashlytics;
  if (IS_EXPO_GO) {
    cachedCrashlytics = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires -- carregado sob demanda, ver comentário acima
    crashlyticsModule = require('@react-native-firebase/crashlytics');
    cachedCrashlytics = crashlyticsModule.getCrashlytics();
  } catch {
    cachedCrashlytics = null;
  }
  return cachedCrashlytics ?? null;
}

export const crashService = {
  // Registra um erro não-fatal — o app continua rodando, mas o crash some no relatório do
  // Firebase com stack trace completo. É o que a maioria dos try/catch "silenciosos" do projeto
  // (ver dayCycleService.requestFirstAction, analyticsService etc.) deveria estar chamando, em
  // vez de só engolir o erro.
  recordError(error: unknown, context?: string): void {
    const normalized = error instanceof Error ? error : new Error(String(error));
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error(`[crash]${context ? ` [${context}]` : ''}`, normalized);
    }
    const crashlytics = getCrashlyticsInstance();
    if (!crashlytics) return;
    if (context) crashlyticsModule.log(crashlytics, context);
    crashlyticsModule.recordError(crashlytics, normalized);
  },

  // Trilha de contexto (breadcrumbs) — aparece junto do próximo crash/erro registrado, não é um
  // evento em si. Útil pra reconstruir "o que a pessoa estava fazendo" quando o crash aconteceu.
  log(message: string): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[crash-log] ${message}`);
    }
    const crashlytics = getCrashlyticsInstance();
    if (!crashlytics) return;
    crashlyticsModule.log(crashlytics, message);
  },
};
