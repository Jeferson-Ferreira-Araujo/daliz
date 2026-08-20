/** Busca no Bible.com (YouVersion) — funciona sem nenhuma configuração em app.json/Info.plist:
 * com o app instalado, o sistema intercepta o link universal e abre nativo; sem o app, abre
 * o site. Mesmo padrão do buildSpotifySearchUrl (src/utils/spotify.ts). */
export function buildBibleSearchUrl(query: string): string {
  return `https://www.bible.com/search/bible?q=${encodeURIComponent(query)}`;
}
