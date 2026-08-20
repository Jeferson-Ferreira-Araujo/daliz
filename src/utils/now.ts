import { devClock } from '@/dev/devClock';

/**
 * Fonte única de "agora" para todo o app. Em produção sempre retorna a hora
 * real do dispositivo. Em desenvolvimento, se o relógio simulado do Modo
 * Desenvolvedor estiver ativo, retorna o instante simulado no lugar.
 */
export function getCurrentDate(): Date {
  if (__DEV__ && devClock.isEnabled()) {
    return devClock.getSimulatedAt();
  }
  return new Date();
}
