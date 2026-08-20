// APP_STORE_URL é provisório — mesmo id de pacote do app.json (com.melhorqueontem.app, mantido
// por baixo dos panos no rebranding pra "Daliz" pra não invalidar Firebase/AdMob/EAS já
// configurados — ver ARCHITECTURE.md), mas a ficha só existe de verdade depois da primeira
// publicação. Atualizar quando a loja aprovar o app.
export const APP_NAME = 'Daliz';
export const APP_TAGLINE = 'Pequenas ações. Grandes transformações.';
export const APP_STORE_URL = 'https://play.google.com/store/apps/details?id=com.melhorqueontem.app';
export const SUPPORT_EMAIL = 'suporte@daliz.com.br';

export interface SocialLink {
  label: string;
  icon: 'logo-instagram' | 'logo-tiktok' | 'logo-facebook' | 'logo-youtube';
  // Fictícios por enquanto (handle @daliz reservado, ver app/(main)/settings.tsx) — trocar
  // pelos perfis reais assim que existirem.
  url: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'Instagram', icon: 'logo-instagram', url: 'https://instagram.com/daliz' },
  { label: 'TikTok', icon: 'logo-tiktok', url: 'https://tiktok.com/@daliz' },
  { label: 'Facebook', icon: 'logo-facebook', url: 'https://facebook.com/daliz' },
  { label: 'YouTube', icon: 'logo-youtube', url: 'https://youtube.com/@daliz' },
];
