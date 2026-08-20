// Categoria única e simples que o motor de desafios consome — o algoritmo nunca lida
// com os dezenas de códigos meteorológicos brutos da API (ver src/services/weatherModel.ts
// pra normalização). Prioridade conceitual: chuva/tempestade > temperatura extrema > céu.
export type WeatherType =
  | 'hot'
  | 'warm'
  | 'comfortable'
  | 'cold'
  | 'very_cold'
  | 'rain'
  | 'heavy_rain'
  | 'storm'
  | 'cloudy'
  | 'sunny'
  | 'unknown';

export interface CurrentWeatherRaw {
  temperature: number;
  feelsLike: number | null;
  precipitation: number; // mm na última hora
  weatherCode: number; // código WMO cru da Open-Meteo
  isDay: boolean;
}

export interface DailyForecastEntry {
  date: string; // "YYYY-MM-DD"
  weatherCode: number;
  maxTemp: number;
  minTemp: number;
  precipitationProbability: number | null; // 0-100
}

/** O que fica salvo em cache local — bruto, ainda não normalizado (ver STORAGE_KEYS.weather). */
export interface WeatherSnapshot {
  fetchedAt: string; // ISO datetime
  latitude: number;
  longitude: number;
  current: CurrentWeatherRaw;
  forecast: DailyForecastEntry[]; // inclui hoje, alguns dias à frente
}

/** O que o motor de desafios realmente usa — derivado de WeatherSnapshot (ver weatherModel.ts). */
export interface NormalizedWeather {
  type: WeatherType;
  temperature: number;
  feelsLike: number | null;
  precipitationProbability: number; // 0-100, do dia de hoje
  isGoodForOutdoor: boolean;
  isGoodForIndoor: boolean;
  isRaining: boolean;
  isVeryHot: boolean;
  isCold: boolean;
  isDay: boolean; // usado só pra exibição (sol vs. lua no ícone da Home), motor de seleção ignora
}

export const WEATHER_TYPE_LABELS: Record<WeatherType, string> = {
  hot: 'Muito quente',
  warm: 'Quente',
  comfortable: 'Agradável',
  cold: 'Frio',
  very_cold: 'Muito frio',
  rain: 'Chuva',
  heavy_rain: 'Chuva forte',
  storm: 'Tempestade',
  cloudy: 'Nublado',
  sunny: 'Ensolarado',
  unknown: 'Desconhecido',
};
