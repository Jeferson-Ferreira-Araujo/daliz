/**
 * Override de clima/data comemorativa do Modo Desenvolvedor — mesmo padrão do devClock.ts
 * (estado em memória, não persiste entre reloads). Permite simular os cenários pedidos
 * (seção 27: "30°C sol + Dia dos Pais em 3 dias", "chuva + evento hoje", "sem clima" etc.)
 * sem precisar esperar o clima real mudar ou a data comemorativa chegar de verdade.
 */
import { useEffect, useState } from 'react';
import type { EventPhaseInfo, NormalizedWeather } from '@/types';

let enabled = false;
let weatherOverride: NormalizedWeather | null = null;
let eventOverride: EventPhaseInfo | null | undefined = undefined; // undefined = não sobrescreve
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export const devContext = {
  isEnabled(): boolean {
    return __DEV__ && enabled;
  },

  getWeatherOverride(): NormalizedWeather | null {
    return weatherOverride;
  },

  getEventOverride(): EventPhaseInfo | null | undefined {
    return eventOverride;
  },

  setWeatherOverride(weather: NormalizedWeather | null) {
    if (!__DEV__) return;
    weatherOverride = weather;
    enabled = true;
    notify();
  },

  setEventOverride(event: EventPhaseInfo | null) {
    if (!__DEV__) return;
    eventOverride = event;
    enabled = true;
    notify();
  },

  reset() {
    if (!__DEV__) return;
    enabled = false;
    weatherOverride = null;
    eventOverride = undefined;
    notify();
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useDevContextState(): { enabled: boolean; weather: NormalizedWeather | null; event: EventPhaseInfo | null | undefined } {
  const [, bump] = useState(0);
  useEffect(() => devContext.subscribe(() => bump((n) => n + 1)), []);
  return { enabled: devContext.isEnabled(), weather: devContext.getWeatherOverride(), event: devContext.getEventOverride() };
}
