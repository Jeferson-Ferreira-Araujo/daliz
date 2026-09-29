import React from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { AdBanner } from './AdBanner';
import { AdBannerBoundary } from './AdBannerBoundary';

// Versão ANDROID/iOS — a versão web fica em AdBannerSlot.web.tsx (mesmo motivo de
// admobService.web.ts: o Metro recusa bundlar react-native-google-mobile-ads pra web mesmo com
// guarda de runtime, porque a falha é na hora de montar o grafo de dependências, não em runtime).
//
// Aqui em android/ios o problema é outro: o SDK nativo não existe dentro do Expo Go (só depois de
// build EAS de verdade) — igual ao padrão já usado em analyticsService.ts/crashService.ts, o
// `require` do componente visual só é tentado fora do Expo Go, e nunca no topo do arquivo de forma
// incondicional (é exatamente essa falta de guarda em TabBar.tsx que já fez o menu inferior inteiro
// sumir num teste no Expo Go — o `require` de um módulo nativo ausente falha na primeira avaliação
// e isso não é algo que um Error Boundary de render consegue pegar).
const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- só resolvido em runtime nativo, ver comentário acima
let AdBannerNativeComponent: React.ComponentType<any> | null = null;
if (!IS_EXPO_GO) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires -- carregado sob demanda, ver comentário acima
    AdBannerNativeComponent = require('./AdBannerNative').AdBannerNative;
  } catch {
    AdBannerNativeComponent = null;
  }
}

/** Ponto único de uso do banner em TabBar.tsx — decide sozinho entre o anúncio real (build EAS) e
 * o placeholder (Expo Go), sem exigir trocar nenhum import à mão. `AdBannerBoundary` continua como
 * segunda camada de segurança, só pro caso do SDK falhar de um jeito que só apareça no render. */
export function AdBannerSlot() {
  if (!AdBannerNativeComponent) return <AdBanner />;
  const RealBanner = AdBannerNativeComponent;
  return (
    <AdBannerBoundary>
      <RealBanner />
    </AdBannerBoundary>
  );
}
