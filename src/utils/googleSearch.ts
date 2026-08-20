/** Busca no Google — mesmo padrão de buildSpotifySearchUrl/buildBibleSearchUrl (link universal,
 * sem configuração extra em app.json/Info.plist, abre externamente no navegador). */
export function buildGoogleSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
