export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

// Meses (1-12) → estação no hemisfério SUL (Brasil). O hemisfério norte usa exatamente
// o oposto (mesmo mês, estação trocada por espelhamento — ver getSeason).
const SOUTHERN_HEMISPHERE_SEASON_BY_MONTH: Record<number, Season> = {
  1: 'summer',
  2: 'summer',
  3: 'autumn',
  4: 'autumn',
  5: 'autumn',
  6: 'winter',
  7: 'winter',
  8: 'winter',
  9: 'spring',
  10: 'spring',
  11: 'spring',
  12: 'summer',
};

const OPPOSITE_SEASON: Record<Season, Season> = {
  summer: 'winter',
  winter: 'summer',
  spring: 'autumn',
  autumn: 'spring',
};

// Sem localização, assume hemisfério sul — o app nasceu pro Brasil (ver seção 5:
// "não assumir hemisfério norte" — o fallback deliberadamente vai pro outro lado).
const DEFAULT_HEMISPHERE: 'norte' | 'sul' = 'sul';

/**
 * Estação do ano calculada a partir do mês e do hemisfério da pessoa (latitude), nunca
 * assumindo hemisfério norte por padrão. Sem latitude, usa DEFAULT_HEMISPHERE.
 */
export function getSeason(date: Date, latitude: number | null): Season {
  const month = date.getMonth() + 1;
  const base = SOUTHERN_HEMISPHERE_SEASON_BY_MONTH[month];
  const hemisphere = latitude == null ? DEFAULT_HEMISPHERE : latitude >= 0 ? 'norte' : 'sul';
  return hemisphere === 'sul' ? base : OPPOSITE_SEASON[base];
}

export const SEASON_LABELS: Record<Season, string> = {
  spring: 'Primavera',
  summer: 'Verão',
  autumn: 'Outono',
  winter: 'Inverno',
};
