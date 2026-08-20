/** Link universal do Spotify (não o esquema `spotify:`) — com o app instalado, o sistema
 * intercepta e abre nativo sozinho; sem o app, abre o player web. Não precisa de nenhuma
 * configuração em app.json/Info.plist. */
export function buildSpotifySearchUrl(query: string): string {
  return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
}
