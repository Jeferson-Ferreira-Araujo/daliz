import type { Ionicons } from '@expo/vector-icons';
import type { ChallengeCategory } from '@/types';

type IconName = keyof typeof Ionicons.glyphMap;

export const CATEGORY_ICON_NAMES: Record<ChallengeCategory, IconName> = {
  relacionamentos: 'call-outline',
  familia: 'people-outline',
  aprendizado_desenvolvimento: 'book-outline',
  saude_bemestar: 'fitness-outline',
  rotina_organizacao: 'checkbox-outline',
  trabalho_financas: 'briefcase-outline',
  criatividade_cultura: 'color-palette-outline',
  experiencias_lazer: 'compass-outline',
  casa_ambiente: 'home-outline',
  fe_espiritualidade: 'sparkles-outline',
};
