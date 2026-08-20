import type { Ionicons } from '@expo/vector-icons';
import type { ChallengeCategory } from '@/types';

type IconName = keyof typeof Ionicons.glyphMap;

export const CATEGORY_ICON_NAMES: Record<ChallengeCategory, IconName> = {
  desenvolvimento_pessoal: 'leaf-outline',
  relacionamentos: 'call-outline',
  familia_presenca: 'home-outline',
  trabalho_produtividade: 'briefcase-outline',
  saude_energia: 'flash-outline',
  financas_consumo: 'wallet-outline',
  aprendizado_curiosidade: 'book-outline',
  bondade_comunidade: 'people-outline',
  fe_espiritualidade: 'sparkles-outline',
};
