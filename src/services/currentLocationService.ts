import * as Location from 'expo-location';
import { fetchFromOpenMeteo } from './weatherService';
import { normalizeWeather } from './weatherModel';
import type { NormalizedWeather } from '@/types/weather';
import type { UserLocation } from '@/types/location';

// Widget de clima "ao vivo" (Home + Perfil) — completamente separado do clima que o
// ChallengeEngine usa pra pontuar desafios (esse continua vindo só da cidade cadastrada, ver
// weatherService.ts). Aqui a fonte é a posição real do dispositivo agora, pra cobrir o caso de
// alguém viajando: a cidade cadastrada não muda, mas o clima relevante nesse widget deve ser o
// de onde a pessoa está de fato.

export type LocationPermissionState = 'undetermined' | 'granted' | 'denied';

export interface CurrentLocationWeather {
  location: UserLocation;
  weather: NormalizedWeather;
}

// TTL curto — GPS+API só quando a pessoa realmente reabre uma tela depois de um tempo, não a
// cada troca de aba (Home ↔ Perfil compartilham o mesmo cache em memória).
const CACHE_TTL_MS = 30 * 60 * 1000;
const REVERSE_GEOCODE_TIMEOUT_MS = 8000;

let cache: { result: CurrentLocationWeather; fetchedAt: number } | null = null;

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/** Coordenada → nome da cidade. O Open-Meteo (já usado pro clima) só faz busca por nome, não tem
 * endpoint reverso — BigDataCloud é gratuita, sem chave, e funciona tanto nativo quanto web (o
 * `reverseGeocodeAsync` do expo-location não funciona no preview web usado pra verificar o app). */
async function reverseGeocode(latitude: number, longitude: number): Promise<UserLocation> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: 'pt',
  });
  const response = await fetchWithTimeout(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`,
    REVERSE_GEOCODE_TIMEOUT_MS,
  );
  if (!response.ok) throw new Error(`Reverse geocode respondeu ${response.status}`);
  const data = await response.json();
  const city: string = data.city || data.locality || data.localityInfo?.administrative?.[0]?.name || 'Local desconhecido';
  return {
    city,
    state: data.principalSubdivision ?? '',
    country: data.countryName ?? '',
    latitude,
    longitude,
  };
}

export const currentLocationService = {
  /** Só lê o status atual — nunca dispara o prompt nativo sozinho. */
  async getPermissionStatus(): Promise<LocationPermissionState> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') return 'granted';
      if (status === 'denied') return 'denied';
      return 'undetermined';
    } catch {
      return 'denied'; // geolocalização indisponível nessa plataforma/navegador
    }
  },

  /** Dispara o prompt nativo — só deve ser chamada a partir de um toque explícito da pessoa. */
  async requestPermission(): Promise<LocationPermissionState> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted' ? 'granted' : 'denied';
    } catch {
      return 'denied';
    }
  },

  getCached(): CurrentLocationWeather | null {
    if (!cache) return null;
    if (Date.now() - cache.fetchedAt > CACHE_TTL_MS) return null;
    return cache.result;
  },

  /**
   * Busca a posição atual (precisão baixa — só precisa saber a cidade, ver seção 23 do pedido
   * original de clima: nunca localização precisa), resolve cidade + clima. Nunca lança: qualquer
   * falha (sem permissão, sem GPS, API fora do ar) devolve `null` e o widget some, em vez de
   * quebrar a tela.
   */
  async fetchCurrent(): Promise<CurrentLocationWeather | null> {
    const cached = currentLocationService.getCached();
    if (cached) return cached;

    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const { latitude, longitude } = position.coords;
      const [location, snapshot] = await Promise.all([
        reverseGeocode(latitude, longitude),
        fetchFromOpenMeteo({ city: '', state: '', country: '', latitude, longitude }),
      ]);
      const today = snapshot.forecast.find((entry) => entry.date === snapshot.fetchedAt.slice(0, 10));
      const weather = normalizeWeather(snapshot.current, today);
      const result: CurrentLocationWeather = { location, weather };
      cache = { result, fetchedAt: Date.now() };
      return result;
    } catch {
      return null;
    }
  },

  /** Usada pelo modo desenvolvedor pra forçar uma nova busca ignorando o cache em memória. */
  clearCache(): void {
    cache = null;
  },

  /**
   * Só a localização, sem clima — usada no cadastro ("Usar minha localização atual") e no botão
   * "Atualizar" de Configurações/Editar perfil (ver CurrentLocationField.tsx), onde só a cidade
   * importa. Nunca reaproveita o cache do widget de clima (`fetchCurrent`) nem grava nele: a
   * pessoa tocou o botão justamente pra saber onde está agora, uma busca em cache poderia devolver
   * uma cidade de minutos atrás. Mesma precisão baixa, nunca lança (falha = null).
   */
  async fetchLocationOnly(): Promise<UserLocation | null> {
    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      return await reverseGeocode(position.coords.latitude, position.coords.longitude);
    } catch {
      return null;
    }
  },
};
