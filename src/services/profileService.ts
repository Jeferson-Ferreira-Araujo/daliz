import { profileRepository } from '@/storage/repositories/profileRepository';
import { challengeInstanceRepository } from '@/storage/repositories/challengeInstanceRepository';
import { journalRepository } from '@/storage/repositories/journalRepository';
import { weatherRepository } from '@/storage/repositories/weatherRepository';
import { preferencesRepository } from '@/storage/repositories/preferencesRepository';
import { actionPerformanceRepository } from '@/storage/repositories/actionPerformanceRepository';
import { notificationService } from './notificationService';
import { analyticsService } from './analyticsService';
import { otherInterestFeedbackService } from './otherInterestFeedbackService';
import { getCurrentDate } from '@/utils/now';
import type {
  ChallengeCategory,
  ChallengeInstance,
  ChallengeIntensity,
  DayOfWeek,
  ImportantPerson,
  Interest,
  ShiftPattern,
  SocialChallengesInterest,
  SocialMediaUsage,
  SocialNetwork,
  UserLocation,
  UserProfile,
  WorkContext,
  WorkSchedule,
} from '@/types';

export interface OnboardingProfileInput {
  name: string;
  birthDate: string;
  occupation: string;
  workContext: WorkContext | null;
  isWorking: boolean;
  workStartTime: string | null;
  workEndTime: string | null;
  workSchedule: WorkSchedule;
  workDays: DayOfWeek[];
  shiftPattern: ShiftPattern | null;
  receiveDuringWorkHours: boolean;
  wakeTime: string;
  sleepTime: string;
  selectedCategories: ChallengeCategory[];
  challengeIntensity: ChallengeIntensity;
  socialMediaUsage: SocialMediaUsage;
  socialChallengesInterest: SocialChallengesInterest;
  socialNetworks: SocialNetwork[];
  interests: Interest[];
  otherInterestText: string | null;
  stillDiscoveringInterests: boolean;
  importantPeople: ImportantPerson[];
  location: UserLocation | null;
}

export const profileService = {
  async getProfile(): Promise<UserProfile | null> {
    return profileRepository.get();
  },

  async hasCompletedOnboarding(): Promise<boolean> {
    const profile = await profileRepository.get();
    return profile != null;
  },

  async completeOnboarding(input: OnboardingProfileInput, notificationsEnabled: boolean): Promise<UserProfile> {
    const now = getCurrentDate().toISOString();
    const profile: UserProfile = {
      ...input,
      photoUri: null,
      // Interesses "descobertos" pelo comportamento só existem depois de algum uso —
      // um perfil recém-criado sempre começa vazio aqui, mesmo que já tenha `interests`.
      discoveredInterests: [],
      notificationsEnabled,
      onboardingCompletedAt: now,
      createdAt: now,
      // Ninguém chega até aqui sem ter marcado a checkbox de aceite na tela de boas-vindas (ver
      // app/onboarding/welcome.tsx) — "agora" é o registro correto do momento do aceite de fato.
      termsAcceptedAt: now,
      firstActionState: 'not_requested',
      firstActionInstanceId: null,
    };
    await profileRepository.save(profile);
    analyticsService.log('onboarding_completed', {
      challengeIntensity: profile.challengeIntensity,
      notificationsEnabled,
      importantPeopleCount: profile.importantPeople.length,
    });
    if (profile.otherInterestText) {
      otherInterestFeedbackService.submitOtherInterest(profile.otherInterestText);
    }
    return profile;
  },

  /** Ao desativar, cancela também qualquer notificação já agendada (ex: as do resto do dia de
   * hoje) — sem isso a pessoa desliga o interruptor e ainda assim recebe as que já estavam na
   * fila, o que contradiz a própria ação de desativar. */
  async updateNotificationsEnabled(enabled: boolean): Promise<void> {
    const profile = await profileRepository.get();
    if (!profile) return;
    if (!enabled) {
      const instances = await challengeInstanceRepository.getAll();
      await notificationService.cancelForInstances(instances);
    }
    await profileRepository.save({ ...profile, notificationsEnabled: enabled });
  },

  async updateProfile(input: OnboardingProfileInput): Promise<UserProfile> {
    const existing = await profileRepository.get();
    if (!existing) throw new Error('Nenhum perfil para atualizar');
    const updated: UserProfile = { ...existing, ...input };
    await profileRepository.save(updated);
    // Só reenvia se o texto mudou de verdade — sem isso, salvar o perfil de novo sem tocar
    // nesse campo (ex: só trocou a intensidade) reenviaria o mesmo texto toda vez.
    if (updated.otherInterestText && updated.otherInterestText !== existing.otherInterestText) {
      otherInterestFeedbackService.submitOtherInterest(updated.otherInterestText);
    }
    return updated;
  },

  async updatePhoto(photoUri: string | null): Promise<UserProfile> {
    const existing = await profileRepository.get();
    if (!existing) throw new Error('Nenhum perfil para atualizar');
    const updated: UserProfile = { ...existing, photoUri };
    await profileRepository.save(updated);
    return updated;
  },

  /** Atualização leve só de Pessoas Importantes — usada em editar perfil (nunca no onboarding,
   * onde o perfil ainda não existe pra atualizar). `ImportantPeopleEditor` tem seu próprio botão
   * "Adicionar", que parece uma ação concluída em si — sem salvar na hora, dava pra adicionar
   * alguém e sair da tela sem tocar em "Salvar alterações" lá embaixo, perdendo a pessoa cadastrada
   * sem perceber. Mesmo padrão de updateLocation logo abaixo. */
  async updateImportantPeople(importantPeople: ImportantPerson[]): Promise<UserProfile> {
    const existing = await profileRepository.get();
    if (!existing) throw new Error('Nenhum perfil para atualizar');
    const updated: UserProfile = { ...existing, importantPeople };
    await profileRepository.save(updated);
    return updated;
  },

  /** Atualização leve só da localização — usada em Configurações, sem precisar montar o
   * OnboardingProfileInput inteiro (ver seção 1: "Alterar localização" nas configurações). */
  async updateLocation(location: UserLocation | null): Promise<UserProfile> {
    const existing = await profileRepository.get();
    if (!existing) throw new Error('Nenhum perfil para atualizar');
    const updated: UserProfile = { ...existing, location };
    await profileRepository.save(updated);
    return updated;
  },

  /** Chamado depois que `dayCycleService.requestFirstAction` gera a primeira ação — marca qual
   * instância é essa e que ela já está disponível (ver Estado B da Home). */
  async markFirstActionAvailable(instanceId: string): Promise<UserProfile> {
    const existing = await profileRepository.get();
    if (!existing) throw new Error('Nenhum perfil para atualizar');
    const updated: UserProfile = { ...existing, firstActionState: 'available', firstActionInstanceId: instanceId };
    await profileRepository.save(updated);
    return updated;
  },

  /** Chamado quando a instância da primeira ação é concluída/não concluída — dispara a tela de
   * transição (Estado C da Home) uma única vez, sem precisar reaparecer depois. */
  async markFirstActionResolved(completed: boolean): Promise<UserProfile> {
    const existing = await profileRepository.get();
    if (!existing) throw new Error('Nenhum perfil para atualizar');
    const updated: UserProfile = { ...existing, firstActionState: completed ? 'completed' : 'not_completed' };
    await profileRepository.save(updated);
    return updated;
  },

  /**
   * Sinal secundário de descoberta de interesse (seção 9): quando a pessoa conclui com
   * reação positiva um desafio ligado a um interesse que ela NÃO tinha marcado no
   * cadastro, isso é um indício real de afinidade — mais forte que qualquer suposição.
   * Nunca mexe em `interests` (a escolha original do cadastro fica intocada), só
   * acrescenta a `discoveredInterests`, usado pelo ChallengeEngine como sinal a mais.
   */
  // DORMENTE (ver plano de migração seção 4): dependia de "concluiu com reação positiva", sinal
  // que não existe mais desde a remoção de Concluir/Não consegui — sempre devolve o perfil sem
  // mudança. Mantida (não removida) pro call site em home.tsx continuar compilando/chamável.
  async registerInterestDiscovery(profile: UserProfile, _instance: ChallengeInstance): Promise<UserProfile> {
    return profile;
  },

  /** Limpa TUDO que fica salvo neste aparelho — perfil, dias, histórico de ações, resumos de
   * dia, preferências do app e dados de progressão adaptativa. Usado pela ação "Sair", cujo
   * texto promete apagar "todo o histórico" — precisa cobrir literalmente todas as chaves de
   * storage, não só as "óbvias", senão a promessa da tela fica incorreta. */
  async resetAccount(): Promise<void> {
    const pendingInstances = await challengeInstanceRepository.getAll();
    await notificationService.cancelForInstances(pendingInstances);
    await profileRepository.clear();
    await challengeInstanceRepository.clear();
    await journalRepository.clear();
    await weatherRepository.clear(); // clima em cache é específico da localização do perfil anterior
    await preferencesRepository.clear();
    await actionPerformanceRepository.clear();
  },
};
