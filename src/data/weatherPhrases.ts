import type { WeatherType } from '@/types';

// Uma frase curta e contextual pro clima real do dia — só aparece quando existe clima de
// verdade (cidade cadastrada + cache válido, ver src/services/weatherService.ts); nunca
// inventa dado, só reage ao que a API já trouxe. Várias opções por tipo pra não repetir
// a mesma frase todo dia — a escolha usa o mesmo hash determinístico de
// src/data/motivationalPhrases.ts, então fica estável ao longo do dia, mas muda amanhã.
const WEATHER_PHRASES: Partial<Record<WeatherType, string[]>> = {
  storm: [
    'Tem tempestade a caminho — melhor manter os planos por dentro de casa hoje.',
    'Vem trovoada hoje. Um bom dia pra ficar mais protegido em casa.',
  ],
  heavy_rain: [
    'Chuva forte hoje — separe um tempo extra se precisar sair.',
    'Vai chover bastante hoje. Guarda-chuva por perto é uma boa ideia.',
  ],
  rain: [
    'Hoje o dia está chuvoso, lembre-se do guarda-chuva!',
    'Chuvinha no ar hoje — vale levar um agasalho a mais.',
  ],
  very_cold: [
    'Frio de verdade hoje — capriche no agasalho antes de sair.',
    'Está bem frio hoje. Um casaco extra faz diferença.',
  ],
  cold: [
    'Esfriou hoje — vale um casaco a mais pro seu dia.',
    'Dia mais frio hoje. Bom pra um café quentinho.',
  ],
  hot: [
    'Vai fazer calor hoje — não esqueça de se hidratar.',
    'Calor firme hoje. Beba mais água que o normal.',
  ],
  warm: ['Dia quentinho hoje — leve, mas vale se hidratar bem.'],
  comfortable: [
    'O clima está agradável hoje — ótimo dia pra sair um pouco.',
    'Temperatura gostosa hoje. Bom momento pra uma pausa lá fora.',
  ],
  sunny: [
    'Sol firme hoje — aproveite se puder tomar um ar.',
    'Dia de sol hoje. Boa oportunidade pra sair um pouco de casa.',
  ],
  cloudy: ['Céu nublado hoje, mas sem chuva à vista por enquanto.'],
};

export function weatherPhraseFor(type: WeatherType, dateISO: string): string | null {
  const phrases = WEATHER_PHRASES[type];
  if (!phrases || phrases.length === 0) return null;
  let hash = 0;
  for (let i = 0; i < dateISO.length; i += 1) {
    hash = (hash * 31 + dateISO.charCodeAt(i)) >>> 0;
  }
  return phrases[hash % phrases.length];
}
