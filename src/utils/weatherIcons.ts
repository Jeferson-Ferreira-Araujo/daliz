import type { Ionicons } from '@expo/vector-icons';
import type { NormalizedWeather } from '@/types';

type IconName = keyof typeof Ionicons.glyphMap;

// Mesmo estilo outline usado em src/utils/categoryIcons.ts e no resto do app — o ícone do
// clima na Home precisa parecer parte da mesma família visual, não um widget de terceiros.
// 'sunny'/'warm'/'comfortable' variam entre sol e lua conforme `isDay` (clima real de dia
// muito diferente de madrugada); os demais tipos são reconhecíveis em qualquer horário.
export function getWeatherIconName(weather: NormalizedWeather): IconName {
  switch (weather.type) {
    case 'storm':
      return 'thunderstorm-outline';
    case 'heavy_rain':
    case 'rain':
      return 'rainy-outline';
    case 'very_cold':
      return 'snow-outline';
    case 'cold':
      return 'thermometer-outline';
    case 'hot':
      return 'flame-outline';
    case 'cloudy':
      return weather.isDay ? 'cloudy-outline' : 'cloudy-night-outline';
    case 'sunny':
      return weather.isDay ? 'sunny-outline' : 'moon-outline';
    case 'warm':
    case 'comfortable':
      return weather.isDay ? 'partly-sunny-outline' : 'moon-outline';
    default:
      return 'partly-sunny-outline';
  }
}
