import React from 'react';
import { crashService } from '@/services/crashService';
import { AdBanner } from './AdBanner';

interface AdBannerBoundaryState {
  hasError: boolean;
}

/**
 * Boundary local só pro banner do AdMob — diferente do ErrorBoundary de app/_layout.tsx (que
 * substitui a árvore inteira), este cai pro placeholder (AdBanner) em vez de derrubar o app todo.
 * Existe por causa do crash real já visto com o BannerAd (ver comentário em AdBannerNative.tsx):
 * anúncio é sempre periférico, nunca deveria conseguir levar o resto do app junto se o SDK nativo
 * falhar de um jeito que nem o try/catch de dentro do componente consiga pegar (erro de render).
 */
export class AdBannerBoundary extends React.Component<React.PropsWithChildren, AdBannerBoundaryState> {
  state: AdBannerBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AdBannerBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    crashService.recordError(error, `admob_banner_render_error: ${info.componentStack?.slice(0, 200) ?? ''}`);
  }

  render() {
    if (this.state.hasError) return <AdBanner />;
    return this.props.children;
  }
}
