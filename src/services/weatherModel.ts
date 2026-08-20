import type { CurrentWeatherRaw, DailyForecastEntry, NormalizedWeather, WeatherType } from '@/types/weather';

// Limites de temperatura centralizados aqui — nada de número mágico espalhado pelo
// motor de desafios (ver seção 4 do pedido). Valores em °C, pensados pro clima
// brasileiro; ajustar aqui é o único lugar que precisa mudar.
export const WEATHER_THRESHOLDS = {
  veryHotC: 32,
  warmC: 24,
  comfortableMinC: 16,
  coldC: 10,
};

// Grupos de código meteorológico WMO (usados pela Open-Meteo) — https://open-meteo.com/en/docs
const STORM_CODES = new Set([95, 96, 99]);
const HEAVY_RAIN_CODES = new Set([65, 67, 82]);
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 66, 80, 81]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]); // raro no Brasil, tratado como muito frio
const CLOUDY_CODES = new Set([1, 2, 3, 45, 48]);
const CLEAR_CODES = new Set([0]);

function classifyByCode(weatherCode: number): 'storm' | 'heavy_rain' | 'rain' | 'very_cold' | 'cloudy' | 'sunny' | null {
  if (STORM_CODES.has(weatherCode)) return 'storm';
  if (HEAVY_RAIN_CODES.has(weatherCode)) return 'heavy_rain';
  if (RAIN_CODES.has(weatherCode)) return 'rain';
  if (SNOW_CODES.has(weatherCode)) return 'very_cold';
  if (CLOUDY_CODES.has(weatherCode)) return 'cloudy';
  if (CLEAR_CODES.has(weatherCode)) return 'sunny';
  return null;
}

function classifyByTemperature(temperature: number): WeatherType | null {
  if (temperature >= WEATHER_THRESHOLDS.veryHotC) return 'hot';
  if (temperature < WEATHER_THRESHOLDS.coldC) return 'very_cold';
  return null;
}

/**
 * Prioridade conceitual: chuva/tempestade sempre vence (é o que mais importa pra decidir
 * uma ação), depois temperatura extrema, depois céu (nublado/ensolarado), com "comfortable"
 * como padrão pra faixa de temperatura amena sem chuva.
 */
function resolveWeatherType(weatherCode: number, temperature: number): WeatherType {
  const byCode = classifyByCode(weatherCode);
  if (byCode === 'storm' || byCode === 'heavy_rain' || byCode === 'rain' || byCode === 'very_cold') return byCode;

  const byTemp = classifyByTemperature(temperature);
  if (byTemp) return byTemp;

  if (byCode === 'cloudy') return 'cloudy';
  if (byCode === 'sunny') return 'sunny';

  if (temperature >= WEATHER_THRESHOLDS.warmC) return 'warm';
  if (temperature >= WEATHER_THRESHOLDS.comfortableMinC) return 'comfortable';
  return 'cold';
}

const RAINY_TYPES: WeatherType[] = ['rain', 'heavy_rain', 'storm'];
const BAD_FOR_OUTDOOR_TYPES: WeatherType[] = ['rain', 'heavy_rain', 'storm', 'very_cold'];

/** Deriva os sinais simples que o motor de desafios consome a partir do clima bruto do dia. */
export function normalizeWeather(current: CurrentWeatherRaw, today: DailyForecastEntry | undefined): NormalizedWeather {
  const type = resolveWeatherType(current.weatherCode, current.temperature);
  const isVeryHot = current.temperature >= WEATHER_THRESHOLDS.veryHotC;
  const isCold = current.temperature < WEATHER_THRESHOLDS.coldC;
  const isRaining = RAINY_TYPES.includes(type);

  return {
    type,
    temperature: current.temperature,
    feelsLike: current.feelsLike,
    precipitationProbability: today?.precipitationProbability ?? (current.precipitation > 0 ? 100 : 0),
    isGoodForOutdoor: !BAD_FOR_OUTDOOR_TYPES.includes(type) && !isVeryHot,
    isGoodForIndoor: true, // clima nunca impede uma ação de dentro de casa
    isRaining,
    isVeryHot,
    isCold,
    isDay: current.isDay,
  };
}
