/** Busca no Google Maps — mesmo padrão dos outros builders de URL externa. Com coordenadas,
 * ancora a busca na posição atual (ver ActionSupport.tsx); sem coordenadas, faz uma busca comum
 * (o próprio Maps usa a localização do dispositivo/navegador quando permitido). */
export function buildMapsSearchUrl(query: string, coords?: { latitude: number; longitude: number }): string {
  const base = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
  if (!coords) return base;
  return `${base}/@${coords.latitude},${coords.longitude},15z`;
}
