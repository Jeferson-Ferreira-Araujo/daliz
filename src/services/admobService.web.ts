// Versão web de admobService — o Metro escolhe este arquivo em vez de admobService.ts pra
// qualquer bundle de plataforma "web", ANTES mesmo de tentar resolver imports/requires dentro dele
// (resolução por extensão de arquivo, não um guard em runtime). Isso importa de verdade: o pacote
// `react-native-google-mobile-ads` tem, na própria raiz do módulo, um import de
// `codegenNativeComponent` (Fabric) que o Metro recusa bundlar pra web — mesmo um `require()`
// dentro de um `try/catch` nunca chega a rodar, porque o Metro já falha ANTES disso, na hora de
// montar o grafo de dependências (é bundling-time, não runtime — o mesmo motivo documentado em
// AdBannerNative.tsx pro componente visual, só que agora pro service headless também). Sem este
// arquivo `.web.ts`, `app/_layout.tsx` chamando `admobService.initialize()` (pra qualquer
// plataforma) já é o bastante pra quebrar o preview web inteiro.
export const admobService = {
  initialize(): void {
    // no-op — AdMob nunca roda no preview web.
  },
};
