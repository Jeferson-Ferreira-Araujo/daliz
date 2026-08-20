import type { ChallengeCategory } from '@/types/challenge';

/**
 * Cores da identidade visual "Daliz" — paleta definida a partir da arte real
 * (identidade/LOGO, identidade/BACKGROUND), usada na marca, ícones e como base da paleta
 * funcional abaixo. Regra da marca: azul-marinho + branco dominam a interface; os quatro tons
 * coloridos (turquesa, azul vivo, roxo, dourado/laranja) entram só pra dar emoção e indicar
 * ações/progresso — nunca pra preencher fundos grandes.
 */
export const brand = {
  confidence: '#0B1B3A', // navy — texto principal, base da identidade
  calm: '#22C1A2', // turquesa — ação positiva (concluir, sucesso)
  action: '#3577FF', // azul vivo — botão principal, progresso
  balance: '#7B5CFF', // roxo — equilíbrio, ponto do gradiente de progresso
  optimism: '#FFB629', // dourado — conquistas, pontos, energia
  energy: '#FF9D1C', // laranja — energia/aviso suave
} as const;

/** Os 3 gradientes nomeados da identidade — sempre nessa ordem de stops. */
export const gradients = {
  principal: [brand.calm, brand.action, brand.balance] as const,
  energia: [brand.calm, brand.optimism, brand.energy] as const,
  fundoClaro: ['#FFFFFF', '#F8FAFF', '#F2EEFF'] as const,
  progresso: [brand.action, brand.balance] as const,
} as const;

/**
 * Tons pastel do fundo (ondas suaves, parte inferior das telas) — sempre com opacidade entre
 * 20% e 50% dependendo do elemento, nunca sólidos: o fundo do Daliz precisa continuar leve e
 * respirável, não virar um carnaval de gradientes.
 */
export const waveTints = {
  mint: '#DDF4F1',
  azul: '#DCEEFF',
  lavanda: '#E7E1FF',
  pessego: '#FFF0DF',
} as const;

// Cor fixa por categoria nos gráficos de Insights — identidade (categórica), nunca
// escolhida dinamicamente por índice/ciclo. Reaproveita as cores da marca onde faz
// sentido semântico e completa com tons vizinhos e harmônicos pras categorias restantes,
// sempre nessa mesma ordem.
export const CATEGORY_CHART_COLORS: Record<ChallengeCategory, string> = {
  desenvolvimento_pessoal: brand.balance,
  relacionamentos: brand.energy,
  familia_presenca: '#E8927C',
  trabalho_produtividade: '#3E5C89',
  saude_energia: brand.calm,
  financas_consumo: brand.optimism,
  aprendizado_curiosidade: brand.action,
  bondade_comunidade: '#6FBF73',
  fe_espiritualidade: '#8E6BAF',
};

export interface ColorPalette {
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  textInverse: string;
  border: string;
  overlay: string;

  primary: string;
  primaryMuted: string;
  onPrimary: string;

  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;

  tabInactive: string;
  tabIndicator: string;
}

export const lightColors: ColorPalette = {
  background: '#FCFCFD',
  surface: '#FFFFFF',
  surfaceMuted: '#F4F6FA',
  text: brand.confidence,
  textMuted: '#64748B',
  textInverse: '#FFFFFF',
  border: '#E9EDF4',
  overlay: 'rgba(11, 27, 58, 0.45)',

  primary: brand.action,
  primaryMuted: waveTints.azul,
  onPrimary: '#FFFFFF',

  success: brand.calm,
  successBg: waveTints.mint,
  warning: brand.optimism,
  warningBg: waveTints.pessego,
  danger: '#E0574F',
  dangerBg: '#FBE4E1',

  tabInactive: '#A6AEC2',
  tabIndicator: brand.confidence,
};

export const darkColors: ColorPalette = {
  background: '#0B1220',
  surface: brand.confidence,
  surfaceMuted: '#16213D',
  text: '#F3F5FA',
  textMuted: '#93A0BE',
  textInverse: brand.confidence,
  border: '#28345A',
  overlay: 'rgba(0, 0, 0, 0.6)',

  primary: '#6E93FF',
  primaryMuted: '#1C2C52',
  onPrimary: '#0B1220',

  success: '#3FD4B4',
  successBg: '#123830',
  warning: '#FFC65C',
  warningBg: '#3B2A12',
  danger: '#EB7A72',
  dangerBg: '#3B2020',

  tabInactive: '#6B7590',
  tabIndicator: '#F3F5FA',
};
