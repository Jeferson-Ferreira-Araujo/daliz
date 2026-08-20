import { challengeInstanceRepository } from '@/storage/repositories/challengeInstanceRepository';
import { actionPerformanceRepository } from '@/storage/repositories/actionPerformanceRepository';
import { preferencesRepository } from '@/storage/repositories/preferencesRepository';

export const progressResetService = {
  /**
   * "Recomeçar do zero" (ver app/(main)/settings.tsx) — limpa histórico de desafios, sequência/
   * streak (calculada a partir do histórico, some junto) e o sistema de dificuldade adaptativa.
   * Diferente de "Sair" (profileService.resetAccount): o perfil — nome, categorias, horários,
   * notificações, localização — continua exatamente como estava, a pessoa não precisa refazer o
   * cadastro pra recomeçar as contagens.
   */
  async resetProgress(): Promise<void> {
    await challengeInstanceRepository.clear();
    await actionPerformanceRepository.clear();

    const prefs = await preferencesRepository.get();
    await preferencesRepository.save({
      ...prefs,
      hasSeenInsightsIntro: false,
      lastWeeklyRecapNotifiedWeekStart: null,
    });
  },
};
