import type { Ionicons } from '@expo/vector-icons';
import type { ActionSupportType } from '@/types';

export interface ActionTypeBadge {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
}

// Cor de cada badge: pra Spotify/Maps, a cor real da marca externa (reconhecimento instantâneo —
// a pessoa já associa verde a Spotify, vermelho a mapa/local, então usar outra cor só confundiria).
// Pra Filme/Pesquisa/Bíblia/Foto (sem marca externa reconhecível), reaproveita tons já usados no
// resto do app (roxo, azul, dourado, laranja — ver theme/palette.ts) em vez de inventar cor nova.
export const ACTION_SUPPORT_BADGES: Partial<Record<ActionSupportType, ActionTypeBadge>> = {
  spotify: { icon: 'musical-notes-outline', label: 'Música', color: '#1DB954' },
  maps: { icon: 'map-outline', label: 'Local', color: '#EA4335' },
  categories: { icon: 'film-outline', label: 'Filme', color: '#7B5CFF' },
  search: { icon: 'search-outline', label: 'Pesquisa', color: '#3577FF' },
};

// `bibleQuery`/`opensCamera` não fazem parte de `ActionSupportType` (são flags à parte no
// Challenge, ver ChallengeCard.tsx) — mesma ideia de badge, só que resolvidas fora do mapa acima.
export const BIBLE_ACTION_BADGE: ActionTypeBadge = { icon: 'book-outline', label: 'Bíblia', color: '#FFB629' };
export const CAMERA_ACTION_BADGE: ActionTypeBadge = { icon: 'camera-outline', label: 'Foto', color: '#FF9D1C' };
