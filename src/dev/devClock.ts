/**
 * Relógio simulado do Modo Desenvolvedor. Estado em memória (não persiste
 * entre reloads completos do app — isso é intencional, mantém o mecanismo
 * simples e garante que produção nunca herda um estado de teste).
 *
 * O relógio é "congelado": ao ativar/ajustar, ele fixa um instante exato e
 * só muda quando você mexe nele de novo — não fica correndo sozinho. Isso
 * facilita inspecionar telas sem a hora mudar debaixo dos seus pés.
 */
import { useEffect, useState } from 'react';

type Listener = () => void;

let enabled = false;
let simulatedAt = new Date();
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

export const devClock = {
  isEnabled(): boolean {
    return __DEV__ && enabled;
  },

  getSimulatedAt(): Date {
    return new Date(simulatedAt);
  },

  setEnabled(next: boolean) {
    if (!__DEV__) return;
    enabled = next;
    notify();
  },

  /** Fixa o relógio simulado neste instante exato e ativa a simulação. */
  setSimulatedAt(date: Date) {
    if (!__DEV__) return;
    simulatedAt = new Date(date);
    enabled = true;
    notify();
  },

  /** Aplica um delta (ms, pode ser negativo) ao instante simulado atual. */
  adjust(deltaMs: number) {
    if (!__DEV__) return;
    simulatedAt = new Date(simulatedAt.getTime() + deltaMs);
    enabled = true;
    notify();
  },

  /** Mantém a data simulada, troca só o horário (HH:mm). */
  setTimeOfDay(hours: number, minutes: number) {
    if (!__DEV__) return;
    const next = new Date(simulatedAt);
    next.setHours(hours, minutes, 0, 0);
    simulatedAt = next;
    enabled = true;
    notify();
  },

  /** Avança um dia inteiro e posiciona à meia-noite — horário em que o app considera "novo dia". */
  jumpToNextDayStart() {
    if (!__DEV__) return;
    const next = new Date(simulatedAt);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    simulatedAt = next;
    enabled = true;
    notify();
  },

  /** Sincroniza o instante simulado com o relógio real, sem desativar a simulação. */
  syncToRealNow() {
    if (!__DEV__) return;
    simulatedAt = new Date();
    enabled = true;
    notify();
  },

  /** Desliga a simulação e volta a usar o relógio real do dispositivo. */
  reset() {
    if (!__DEV__) return;
    enabled = false;
    simulatedAt = new Date();
    notify();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/** Hook de conveniência: re-renderiza o componente sempre que o relógio simulado mudar. */
export function useDevClockState(): { enabled: boolean; simulatedAt: Date } {
  const [, bump] = useState(0);
  useEffect(() => devClock.subscribe(() => bump((n) => n + 1)), []);
  return { enabled: devClock.isEnabled(), simulatedAt: devClock.getSimulatedAt() };
}
