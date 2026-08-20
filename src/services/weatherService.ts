import { weatherRepository } from '@/storage/repositories/weatherRepository';
import { normalizeWeather } from './weatherModel';
import type { CurrentWeatherRaw, DailyForecastEntry, NormalizedWeather, WeatherSnapshot } from '@/types/weather';
import type { UserLocation } from '@/types/location';

// Não consultar a API a cada abertura do app — só quando o cache passou desse tempo
// (ver seção 3: "uma vez a cada algumas horas"). Configurável aqui, um único lugar.
const CACHE_MAX_AGE_MS = 3 * 60 * 60 * 1000; // 3 horas
const FETCH_TIMEOUT_MS = 8000;

function isCacheFresh(snapshot: WeatherSnapshot, now: Date, maxAgeMs: number): boolean {
  return now.getTime() - new Date(snapshot.fetchedAt).getTime() < maxAgeMs;
}

function isSameLocation(snapshot: WeatherSnapshot, location: UserLocation): boolean {
  // Compara com uma tolerância pequena — não precisamos de precisão de metros, só
  // saber se ainda é "a mesma cidade" (ver seção 23: localização não é precisa).
  return Math.abs(snapshot.latitude - location.latitude) < 0.05 && Math.abs(snapshot.longitude - location.longitude) < 0.05;
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/** Exportada pra ser reaproveitada por currentLocationService.ts (widget de clima ao vivo por
 * GPS) — mesma query da Open-Meteo, sem duplicar a lógica de fetch/parse. */
export async function fetchFromOpenMeteo(location: UserLocation): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: location.latitude.toFixed(4),
    longitude: location.longitude.toFixed(4),
    current: 'temperature_2m,apparent_temperature,precipitation,weather_code,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '4',
  });
  const response = await fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, FETCH_TIMEOUT_MS);
  if (!response.ok) throw new Error(`Open-Meteo respondeu ${response.status}`);
  const data = await response.json();

  const current: CurrentWeatherRaw = {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature ?? null,
    precipitation: data.current.precipitation ?? 0,
    weatherCode: data.current.weather_code,
    isDay: data.current.is_day === 1,
  };

  const forecast: DailyForecastEntry[] = (data.daily?.time ?? []).map((date: string, index: number) => ({
    date,
    weatherCode: data.daily.weather_code[index],
    maxTemp: data.daily.temperature_2m_max[index],
    minTemp: data.daily.temperature_2m_min[index],
    precipitationProbability: data.daily.precipitation_probability_max?.[index] ?? null,
  }));

  return {
    fetchedAt: new Date().toISOString(),
    latitude: location.latitude,
    longitude: location.longitude,
    current,
    forecast,
  };
}

export const weatherService = {
  /**
   * Busca clima novo só se o cache estiver vencido, ausente, ou for de outro lugar —
   * chamado uma vez por geração de ciclo do dia (ver dayCycleService), nunca por
   * desafio. Nunca lança: falha de rede/timeout só mantém o que já tinha em cache
   * (ver seção 3/21/26 — offline-first, a ausência de clima nunca quebra o app).
   */
  async ensureFreshWeather(location: UserLocation | null, now: Date, maxAgeMs: number = CACHE_MAX_AGE_MS): Promise<void> {
    if (!location) return;
    const cached = await weatherRepository.get();
    if (cached && isSameLocation(cached, location) && isCacheFresh(cached, now, maxAgeMs)) return;

    try {
      const fresh = await fetchFromOpenMeteo(location);
      await weatherRepository.save(fresh);
    } catch {
      // API fora do ar / sem internet — mantém o que já estava em cache (pode ser nada).
    }
  },

  /** Só lê o cache local, nunca dispara rede — é isso que o motor de desafios usa. */
  async getNormalizedWeather(): Promise<NormalizedWeather | null> {
    const snapshot = await weatherRepository.get();
    if (!snapshot) return null;
    const today = snapshot.forecast.find((entry) => entry.date === snapshot.fetchedAt.slice(0, 10));
    return normalizeWeather(snapshot.current, today);
  },

  async getSnapshot(): Promise<WeatherSnapshot | null> {
    return weatherRepository.get();
  },

  async clearCache(): Promise<void> {
    await weatherRepository.clear();
  },
};
