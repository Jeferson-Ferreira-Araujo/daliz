/**
 * Camada de orquestração do Modo Desenvolvedor. Tudo aqui chama os mesmos
 * serviços/repositórios usados pelo app normal — nada de regra de negócio
 * duplicada. Este arquivo só existe para provocar, de forma controlada,
 * situações que seriam difíceis de reproduzir manualmente.
 *
 * Todas as funções assumem que já foram chamadas dentro de `if (__DEV__)`
 * pela camada de UI (app/dev/*). Não há checagem redundante aqui para não
 * espalhar verificações de ambiente pelo código.
 */
import { profileService, type OnboardingProfileInput } from '@/services/profileService';
import { dayCycleService, resolveActiveDate } from '@/services/dayCycleService';
import { challengeActionsService } from '@/services/challengeActionsService';
import { notificationService } from '@/services/notificationService';
import { statsService } from '@/services/statsService';
import { buildTopHighlightPhrase } from '@/data/weeklyHighlightCopy';
import { progressionService } from '@/services/progressionService';
import { actionPerformanceRepository } from '@/storage/repositories/actionPerformanceRepository';
import { challengeInstanceRepository } from '@/storage/repositories/challengeInstanceRepository';
import { preferencesRepository } from '@/storage/repositories/preferencesRepository';
import { journalRepository } from '@/storage/repositories/journalRepository';
import { buildInstance, explainNextChallenge, type ChallengeExplanation } from '@/engine/ChallengeEngine';
import { getChallengeTiming } from '@/engine/challengeTiming';
import { allChallenges } from '@/data/challenges';
import { weatherService } from '@/services/weatherService';
import { contextService } from '@/services/contextService';
import { getCurrentEventContext } from '@/services/holidayService';
import { getSeason } from '@/utils/season';
import { toISODate } from '@/utils/date';
import { getCurrentDate } from '@/utils/now';
import { generateId } from '@/utils/id';
import { devClock } from './devClock';
import { devContext } from './devContext';
import { devNotificationTester } from './devNotificationTester';
import { devOnboardingAutofill, DEV_ONBOARDING_TEST_DATA } from './onboardingAutofill';
import { CHALLENGE_CATEGORY_LABELS, DEFAULT_PREFERENCES } from '@/types';
import type {
  AbandonReason,
  ActionSupportType,
  AppContext,
  Challenge,
  ChallengeCategory,
  ChallengeInstance,
  ChallengeReaction,
  ChallengeTiming,
  EventPhaseInfo,
  ImportantPerson,
  Interest,
  NormalizedWeather,
  UserProfile,
} from '@/types';

const ALL_CATEGORIES = Object.keys(CHALLENGE_CATEGORY_LABELS) as ChallengeCategory[];

function randomChallenge(profile: UserProfile | null, exclude: Set<string> = new Set()): Challenge {
  const selected = profile?.selectedCategories;
  const pool = allChallenges.filter(
    (c) => (!selected || selected.includes(c.categoria)) && !exclude.has(c.id),
  );
  const source = pool.length > 0 ? pool : allChallenges;
  return source[Math.floor(Math.random() * source.length)];
}

/** Igual a `randomChallenge`, mas restrita a um subconjunto (ex: só desafios com `musicQuery`) —
 * ignora o filtro de categoria do perfil se ele deixasse o pool vazio, pra sempre conseguir
 * achar um candidato de teste em Modo Dev. */
function randomChallengeWith(profile: UserProfile | null, predicate: (c: Challenge) => boolean): Challenge | null {
  const selected = profile?.selectedCategories;
  const all = allChallenges.filter(predicate);
  const pool = all.filter((c) => !selected || selected.includes(c.categoria));
  const source = pool.length > 0 ? pool : all;
  if (source.length === 0) return null;
  return source[Math.floor(Math.random() * source.length)];
}

/** Cria um desafio específico e dispara a notificação real imediatamente — mesma lógica de
 * `sendChallengeNow`, extraída pra ser reaproveitada com um desafio já escolhido em vez de
 * sorteado. */
async function sendSpecificChallengeNow(profile: UserProfile, challenge: Challenge): Promise<ChallengeInstance> {
  const now = getCurrentDate();
  let instance = buildInstance(challenge, now, resolveActiveDate(profile, now));
  await ensureTodayHasActions(profile, instance);

  const notificationId = await notificationService.sendNow(instance);
  instance = { ...instance, notificationId };
  await challengeInstanceRepository.save(instance);
  return instance;
}

/** Garante que o período acordado atual já tem seu lote normal gerado (senão essa instância de
 * teste ficaria sozinha, sem as ações regulares do dia), depois salva a instância de teste. */
async function ensureTodayHasActions(profile: UserProfile, instance: ChallengeInstance): Promise<void> {
  await dayCycleService.ensureUpcomingActions(profile, getCurrentDate());
  await challengeInstanceRepository.save(instance);
}

export const devService = {
  // ===== Desafios =====

  /** Cria um desafio hoje e dispara a notificação real imediatamente. */
  async sendChallengeNow(profile: UserProfile): Promise<ChallengeInstance> {
    return sendSpecificChallengeNow(profile, randomChallenge(profile));
  },

  /**
   * Igual a `sendChallengeNow`, mas força um desafio com `musicQuery`/`bibleQuery` (em vez de
   * sortear de todo o pool) — pra testar o botão "Abrir no Spotify"/"Ler versículo" sem depender
   * de sorte na seleção aleatória do dia. Retorna null se nenhum desafio desse tipo existir no
   * pool filtrado pelas categorias do perfil (não deveria acontecer, mas o botão trata o caso).
   */
  async sendMusicChallengeNow(profile: UserProfile): Promise<ChallengeInstance | null> {
    const challenge = randomChallengeWith(profile, (c) => !!c.musicQuery);
    return challenge ? sendSpecificChallengeNow(profile, challenge) : null;
  },

  async sendBibleChallengeNow(profile: UserProfile): Promise<ChallengeInstance | null> {
    const challenge = randomChallengeWith(profile, (c) => !!c.bibleQuery);
    return challenge ? sendSpecificChallengeNow(profile, challenge) : null;
  },

  /** Igual a `sendMusicChallengeNow`/`sendBibleChallengeNow`, mas força um timing específico —
   * "Testar ação AGORA/HOJE/QUANDO FIZER SENTIDO" (ver seção 15 do pedido de timing). */
  async sendTimedChallengeNow(profile: UserProfile, timing: ChallengeTiming): Promise<ChallengeInstance | null> {
    const challenge = randomChallengeWith(profile, (c) => getChallengeTiming(c) === timing);
    return challenge ? sendSpecificChallengeNow(profile, challenge) : null;
  },

  /** Igual a `sendTimedChallengeNow`, mas força uma ação `actionKind: 'sugestao'` — pra testar o
   * formato de notificação próprio de sugestão ("💡 Uma orientação pra agora", ver
   * notificationService.notificationTitleFor) sem depender do sorteio normal do dia incluir uma. */
  async sendSuggestionNow(profile: UserProfile): Promise<ChallengeInstance | null> {
    const challenge = randomChallengeWith(profile, (c) => (c.actionKind ?? 'acao') === 'sugestao');
    return challenge ? sendSpecificChallengeNow(profile, challenge) : null;
  },

  /** Igual a `sendMusicChallengeNow`/`sendBibleChallengeNow`, mas força um `supportType`
   * específico — pra testar cada botão da camada de assistência (busca/filmes/maps/spotify)
   * sem depender de sorte na seleção aleatória do dia. */
  async sendSupportChallengeNow(profile: UserProfile, supportType: ActionSupportType): Promise<ChallengeInstance | null> {
    const challenge = randomChallengeWith(profile, (c) => c.supportType === supportType);
    return challenge ? sendSpecificChallengeNow(profile, challenge) : null;
  },

  /**
   * Sistema de dificuldade adaptativa (ver src/engine/progression.ts / progressionService.ts).
   * Envia sempre o desafio de NÍVEL 1 de um `progressionGroup` de teste — combine com
   * `setInstanceStatus(instance, 'concluido')` (já usado pela tela "Desafios") 3x seguidas pra
   * simular consistência, depois use "Testar seleção" (Contexto Inteligente) pra conferir que o
   * nível 1 sumiu do pool e o nível 2 passa a competir normalmente.
   */
  async sendProgressiveChallengeNow(profile: UserProfile, concept: string): Promise<ChallengeInstance | null> {
    const challenge = randomChallengeWith(profile, (c) => c.concept === concept && c.difficulty === 1);
    return challenge ? sendSpecificChallengeNow(profile, challenge) : null;
  },

  async getPerformanceSnapshot() {
    return actionPerformanceRepository.getAll();
  },

  async resetProgressionData(): Promise<void> {
    await actionPerformanceRepository.clear();
  },

  /**
   * Dispara a notificação de "O que você melhorou?" agora, com os dados reais da semana ATUAL
   * (em produção só dispara na segunda seguinte, sobre a semana que fechou — ver
   * weeklyRecapService.ts). Só pra testar o formato/entrega da notificação sem esperar virar
   * segunda-feira; não passa pelo controle de "uma vez por semana".
   */
  async sendWeeklyRecapNow(): Promise<string | null> {
    const weekly = await statsService.getWeeklyInsight();
    const body = weekly.currentWeek.topHighlight
      ? buildTopHighlightPhrase(weekly.currentWeek.topHighlight.categoria, weekly.currentWeek.topHighlight.count)
      : `Você concluiu ${weekly.currentWeek.totalCompleted} ações essa semana.`;
    return notificationService.sendWeeklyRecap(body);
  },

  /** Expira agora as pendências de fora do período acordado atual (ver
   * dayCycleService.forceExpirePending) — "Encerrar dia"/"Expirar ações abertas" da seção 15:
   * pendentes (`now`, `today` ou `contextual`) viram `ignorado`. */
  async closeTodayNow(profile: UserProfile): Promise<boolean> {
    return dayCycleService.forceExpirePending(profile, getCurrentDate());
  },

  /** Cria um desafio pendente hoje, sem disparar notificação. */
  async createTestChallenge(profile: UserProfile): Promise<ChallengeInstance> {
    const now = getCurrentDate();
    const challenge = randomChallenge(profile);
    const instance = buildInstance(challenge, now, resolveActiveDate(profile, now));
    await ensureTodayHasActions(profile, instance);
    return instance;
  },

  /** Cria um desafio de teste já atrasado (horário no passado), pra testar o indicador "Atrasado". */
  async createOverdueChallenge(profile: UserProfile): Promise<ChallengeInstance> {
    const now = getCurrentDate();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const challenge = randomChallenge(profile);
    const instance = buildInstance(challenge, twoHoursAgo, resolveActiveDate(profile, now));
    await ensureTodayHasActions(profile, instance);
    return instance;
  },

  async listTodayInstances(profile: UserProfile): Promise<ChallengeInstance[]> {
    const { instances } = await dayCycleService.ensureUpcomingActions(profile, getCurrentDate());
    return [...instances].sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  },

  /** Aplica um novo status a uma instância reutilizando os mesmos serviços do fluxo real.
   * 'ignorado' é a exceção: não existe um método de "ignorar" no fluxo real (só acontece em lote
   * no fechamento do dia, ver dayCycleService.closeCycle) — aqui replica exatamente o mesmo
   * assignment, só que pra uma instância isolada, pra testar sem precisar fechar o dia inteiro. */
  async setInstanceStatus(
    instance: ChallengeInstance,
    status: 'concluido' | 'nao_concluido' | 'ignorado' | 'pendente',
  ): Promise<ChallengeInstance> {
    if (status === 'concluido') return challengeActionsService.complete(instance, 'foi_bom');
    if (status === 'nao_concluido') return challengeActionsService.abandon(instance, 'sem_tempo', undefined);
    if (status === 'ignorado') {
      const updated: ChallengeInstance = { ...instance, status: 'ignorado' };
      await challengeInstanceRepository.save(updated);
      return updated;
    }
    return challengeActionsService.resetStatus(instance);
  },

  // ===== Notificações =====

  async sendTestNotification(): Promise<void> {
    await notificationService.sendTestNotification();
  },

  async sendChallengeNotification(instance: ChallengeInstance): Promise<void> {
    await notificationService.sendNow(instance);
  },

  async getLastSentInstance(): Promise<ChallengeInstance | null> {
    const all = await challengeInstanceRepository.getAll();
    return all.length > 0 ? all[all.length - 1] : null;
  },

  /** Quantas das ações de hoje já foram enviadas pelo botão "Enviar próxima notificação",
   * de quantas no total — pra mostrar o progresso sem precisar apertar o botão. */
  async getNotificationQueueProgress(profile: UserProfile): Promise<{ sent: number; total: number }> {
    const { instances } = await dayCycleService.ensureUpcomingActions(profile, getCurrentDate());
    const total = instances.length;
    const sent = instances.filter((i) => devNotificationTester.isSent(i.id)).length;
    return { sent, total };
  },

  /**
   * Dispara de verdade (via `notificationService.sendNow`) a próxima notificação da fila de
   * hoje que ainda não foi testada — em ordem de `scheduledFor`, independente do status da
   * ação (pra testar coerência/quantidade de todas, não só as pendentes). Cada chamada avança
   * um item; devolve `null` quando a fila do dia acabou.
   */
  async sendNextQueuedNotification(
    profile: UserProfile,
  ): Promise<{ instance: ChallengeInstance; sentIndex: number; total: number } | null> {
    const { instances } = await dayCycleService.ensureUpcomingActions(profile, getCurrentDate());
    const sorted = [...instances].sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
    const next = sorted.find((i) => !devNotificationTester.isSent(i.id));
    if (!next) return null;

    await notificationService.sendNow(next);
    devNotificationTester.markSent(next.id);
    return { instance: next, sentIndex: sorted.findIndex((i) => i.id === next.id) + 1, total: sorted.length };
  },

  /** Reinicia a contagem da fila de notificações de hoje, sem regenerar o ciclo do dia. */
  resetNotificationQueue(): void {
    devNotificationTester.reset();
  },

  // ===== Memória / histórico =====

  async getMemorySummary(): Promise<MemorySummary> {
    const instances = await challengeInstanceRepository.getAll();
    const categories = new Set<ChallengeCategory>();
    const dates = new Set<string>();
    let completed = 0;
    let notCompleted = 0;
    let pending = 0;
    for (const instance of instances) {
      categories.add(instance.categoria);
      dates.add(instance.date);
      if (instance.status === 'concluido') completed += 1;
      else if (instance.status === 'nao_concluido' || instance.status === 'ignorado') notCompleted += 1;
      else if (instance.status === 'pendente') pending += 1;
    }
    return { completed, notCompleted, pending, daysRegistered: dates.size, categoriesUsed: categories.size };
  },

  async getFullHistory(): Promise<ChallengeInstance[]> {
    const all = await challengeInstanceRepository.getAll();
    return [...all].sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  },

  /** Usado tanto por "Limpar histórico" quanto por "Resetar aprendizado" — neste app, o aprendizado É derivado do histórico, não há tabela separada. */
  async clearHistoryAndLearning(): Promise<void> {
    const pending = await challengeInstanceRepository.getAll();
    await notificationService.cancelForInstances(pending);
    await challengeInstanceRepository.clear();
  },

  // ===== Dados / sistema =====

  async getStateSnapshot(): Promise<{
    realNow: string;
    simulatedNow: string | null;
    clockEnabled: boolean;
    profile: UserProfile | null;
    activeDate: string | null;
    todayInstances: ChallengeInstance[];
    notificationsPermission: string;
    memory: MemorySummary;
  }> {
    const profile = await profileService.getProfile();
    const now = getCurrentDate();
    const activeDate = profile ? resolveActiveDate(profile, now) : null;
    const todayInstances = activeDate ? await challengeInstanceRepository.getByDate(activeDate) : [];
    const notificationsPermission = await notificationService.getPermissionStatus();
    const memory = await devService.getMemorySummary();

    return {
      realNow: new Date().toISOString(),
      simulatedNow: devClock.isEnabled() ? devClock.getSimulatedAt().toISOString() : null,
      clockEnabled: devClock.isEnabled(),
      profile,
      activeDate,
      todayInstances,
      notificationsPermission,
      memory,
    };
  },

  async exportLocalDataAsJson(): Promise<string> {
    const [profile, instances, preferences] = await Promise.all([
      profileService.getProfile(),
      challengeInstanceRepository.getAll(),
      preferencesRepository.get(),
    ]);
    return JSON.stringify({ exportedAt: new Date().toISOString(), profile, preferences, challengeInstances: instances }, null, 2);
  },

  /** Reset completo — perfil, histórico e preferências. Simula uma instalação nova. */
  async resetAllData(): Promise<void> {
    await profileService.resetAccount();
    await preferencesRepository.save(DEFAULT_PREFERENCES);
    devClock.reset();
  },

  // ===== Cenários =====

  /** Mesma ação de "Sair" — é a forma segura já existente de voltar ao estado de instalação nova. */
  async simulateNewUser(): Promise<void> {
    await profileService.resetAccount();
    devClock.reset();
  },

  /**
   * Perfil recém-cadastrado que ainda não tocou em "Receber minha primeira ação" — pra testar
   * `app/onboarding/first-action.tsx` e o roteamento de `app/index.tsx` sem precisar repetir o
   * onboarding manualmente. `completeOnboarding` já marca `firstActionState: 'not_requested'` por
   * padrão, então só precisamos garantir que não existe ciclo/histórico de dias anteriores.
   */
  async simulateOnboardedNotYetFirstAction(): Promise<UserProfile> {
    await profileService.resetAccount();
    devClock.reset();
    return ensureTestProfile();
  },

  /**
   * Diferente dos demais cenários (que chamam `completeOnboarding` direto e pulam pra Home): este
   * reseta a conta e "arma" os dados de teste pra `app/onboarding/profile.tsx` consumir no mount —
   * a pessoa navega pelas telas reais do cadastro (welcome → concept → profile → notifications →
   * first-action) já com os campos preenchidos, só apertando "Continuar" em cada passo, pra
   * revisar mudanças de UI/copy no fluxo sem digitar tudo de novo manualmente.
   */
  async simulateOnboardingFormTest(): Promise<void> {
    await profileService.resetAccount();
    devClock.reset();
    devOnboardingAutofill.arm(DEV_ONBOARDING_TEST_DATA);
  },

  async simulateEngagedUser(): Promise<UserProfile> {
    const profile = await ensureTestProfile();
    await generateHistoryDays(profile, {
      days: 12,
      instancesPerDay: [3, 4],
      completedRatio: 0.85,
      positiveReactionRatio: 0.9,
    });
    return profile;
  },

  async simulateLowEngagementUser(): Promise<UserProfile> {
    const profile = await ensureTestProfile();
    await generateHistoryDays(profile, {
      days: 10,
      instancesPerDay: [3, 4],
      completedRatio: 0.2,
      positiveReactionRatio: 0.3,
    });
    return profile;
  },

  async simulateEndOfDay(profile: UserProfile): Promise<void> {
    devClock.setTimeOfDay(23, 59);
    const { instances } = await dayCycleService.ensureUpcomingActions(profile, getCurrentDate());
    const pending = instances.filter((i) => i.status === 'pendente');
    for (let i = 0; i < pending.length; i += 1) {
      if (i % 3 === 0) await challengeActionsService.complete(pending[i], 'foi_bom');
      else if (i % 3 === 1) await challengeActionsService.abandon(pending[i], 'sem_tempo', undefined);
      // o restante fica pendente de propósito, pra ver o fechamento tratar como "ignorado"
    }
  },

  async simulatePendingChallenge(profile: UserProfile): Promise<ChallengeInstance> {
    return devService.createOverdueChallenge(profile);
  },

  // ===== Interesses =====

  /** Atualiza só os interesses do perfil de teste — usado pelo painel de testes de interesses. */
  async setTestInterests(profile: UserProfile, interests: Interest[], stillDiscovering: boolean): Promise<UserProfile> {
    return profileService.updateProfile({ ...profileToInput(profile), interests, stillDiscoveringInterests: stillDiscovering });
  },

  /**
   * Roda exatamente o mesmo pipeline de seleção do app real (ver ChallengeEngine.explainNextChallenge),
   * só que devolvendo o raciocínio por trás da escolha em vez de aplicar de fato — pra validar a
   * lógica de personalização sem esperar o comportamento real do usuário (ver seção 13/17 dos pedidos).
   * Usa o contexto simulado (clima/evento) do painel "Contexto Inteligente" quando ativo, senão o real.
   */
  async explainNextChallenge(profile: UserProfile): Promise<ChallengeExplanation> {
    const history = await challengeInstanceRepository.getAll();
    const context = await devService.getEffectiveContext(profile);
    const performanceByConcept = await progressionService.getPerformanceByConcept();
    return explainNextChallenge(profile, history, getCurrentDate(), context, performanceByConcept);
  },

  // ===== Pessoas importantes =====

  /** Substitui a lista de pessoas do perfil de teste — usado pelo painel de testes de pessoas. */
  async setTestPeople(profile: UserProfile, importantPeople: ImportantPerson[]): Promise<UserProfile> {
    return profileService.updateProfile({ ...profileToInput(profile), importantPeople });
  },

  /** Adiciona uma pessoa de teste rápida ao perfil, sem passar pelo formulário completo. */
  async addTestPerson(profile: UserProfile, person: Omit<ImportantPerson, 'id'>): Promise<UserProfile> {
    const newPerson: ImportantPerson = { ...person, id: generateId('person') };
    return devService.setTestPeople(profile, [...profile.importantPeople, newPerson]);
  },

  // ===== Contexto inteligente (clima + calendário) =====

  /** Contexto que a seleção de verdade usaria agora — com override do painel de testes, se ativo. */
  async getEffectiveContext(profile: UserProfile): Promise<AppContext> {
    if (devContext.isEnabled()) {
      const now = getCurrentDate();
      const eventOverride = devContext.getEventOverride();
      return {
        weather: devContext.getWeatherOverride(),
        season: getSeason(now, profile.location?.latitude ?? null),
        event: eventOverride !== undefined ? eventOverride : getCurrentEventContext(now, 'BR'),
      };
    }
    return contextService.getCurrentContext(profile, getCurrentDate());
  },

  /** Busca clima de verdade agora (ignora cache) — útil pra testar a chamada real à Open-Meteo. */
  async refreshWeatherNow(profile: UserProfile): Promise<void> {
    if (!profile.location) return;
    await weatherService.ensureFreshWeather(profile.location, getCurrentDate(), 0);
  },

  async getWeatherSnapshot() {
    return weatherService.getSnapshot();
  },

  async clearWeatherCache(): Promise<void> {
    await weatherService.clearCache();
  },

  setSimulatedWeather(weather: NormalizedWeather | null): void {
    devContext.setWeatherOverride(weather);
  },

  setSimulatedEvent(event: EventPhaseInfo | null): void {
    devContext.setEventOverride(event);
  },

  clearContextOverrides(): void {
    devContext.reset();
  },
};

function profileToInput(profile: UserProfile): OnboardingProfileInput {
  const {
    photoUri: _photoUri,
    discoveredInterests: _discoveredInterests,
    notificationsEnabled: _notificationsEnabled,
    onboardingCompletedAt: _onboardingCompletedAt,
    createdAt: _createdAt,
    ...input
  } = profile;
  return input;
}

async function ensureTestProfile(): Promise<UserProfile> {
  const existing = await profileService.getProfile();
  if (existing) return existing;

  // Perfil alinhado ao critério de sucesso da personalização por interesses: trabalha
  // seg-sex 08h-17h, dorme 23h, gosta de música/esportes/tecnologia, usa bastante rede
  // social, aceita fé — dá pra testar a hierarquia de contexto (horário > rotina >
  // perfil > interesses) variando só o relógio simulado (ver app/dev/interests.tsx).
  const input: OnboardingProfileInput = {
    name: 'Usuário Teste',
    birthDate: '1995-06-15',
    occupation: 'Testador(a)',
    isWorking: true,
    workStartTime: '08:00',
    workEndTime: '17:00',
    workSchedule: 'fixa',
    workDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
    shiftPattern: null,
    receiveDuringWorkHours: true,
    wakeTime: '07:00',
    sleepTime: '23:00',
    selectedCategories: ALL_CATEGORIES,
    interests: ['music', 'photography', 'technology'],
    otherInterestText: null,
    stillDiscoveringInterests: false,
    // Mesmo exemplo completo do pedido de "pessoas importantes": esposa e filho,
    // ambos morando com o usuário — dá pra testar filho+jogos, filho+fotografia,
    // cônjuge+música etc. variando só o relógio simulado (ver app/dev/people.tsx).
    importantPeople: [
      { id: 'person_maria', name: 'Maria', relationship: 'conjuge', age: 32, birthDate: null, livesWithUser: true },
      { id: 'person_joao', name: 'João', relationship: 'filho', age: 7, birthDate: null, livesWithUser: true },
    ],
    // Cidade do próprio exemplo do pedido de clima/calendário — dá pra testar a
    // camada de contexto (estação, clima) sem precisar preencher o onboarding manualmente.
    location: { city: 'Patrocínio', state: 'MG', country: 'Brasil', latitude: -18.9439, longitude: -46.9925 },
    challengeIntensity: 'equilibrado',
    socialMediaUsage: 'varias_vezes_dia',
    socialChallengesInterest: 'sim',
    socialNetworks: ['instagram', 'whatsapp'],
  };
  // true porque, com o novo fluxo obrigatório de permissão (ver app/onboarding/notifications.tsx),
  // todo usuário real chega ao app com notificação ativa — o perfil de teste simula isso, não o
  // caso raro de alguém que nunca concedeu a permissão.
  return profileService.completeOnboarding(input, true);
}

const POSITIVE_REACTIONS: ChallengeReaction[] = ['fez_muito_bem', 'foi_bom'];
const NEUTRAL_REACTIONS: ChallengeReaction[] = ['foi_normal', 'nao_fez_diferenca', 'foi_dificil'];
const ABANDON_REASONS: AbandonReason[] = ['sem_tempo', 'momento_inadequado', 'esqueci', 'nao_gostei', 'foi_dificil'];

interface GenerateHistoryOptions {
  days: number;
  instancesPerDay: [number, number];
  completedRatio: number;
  positiveReactionRatio: number;
}

/** Gera histórico sintético reutilizando complete()/abandon() reais, com timestamps retroativos. */
async function generateHistoryDays(profile: UserProfile, options: GenerateHistoryOptions): Promise<void> {
  const usedChallengeIds = new Set<string>();

  for (let dayOffset = options.days; dayOffset >= 1; dayOffset -= 1) {
    const dayInstant = new Date(getCurrentDate());
    dayInstant.setDate(dayInstant.getDate() - dayOffset);
    dayInstant.setHours(9, 0, 0, 0);
    const dateISO = toISODate(dayInstant);

    const count = randomBetween(options.instancesPerDay[0], options.instancesPerDay[1]);

    for (let i = 0; i < count; i += 1) {
      const sentAt = new Date(dayInstant);
      sentAt.setHours(9 + i * 3, 0, 0, 0);
      const challenge = randomChallenge(profile, usedChallengeIds);
      usedChallengeIds.add(challenge.id);

      let instance = buildInstance(challenge, sentAt, dateISO);
      await challengeInstanceRepository.save(instance);

      const willComplete = Math.random() < options.completedRatio;
      if (willComplete) {
        const completedAt = new Date(sentAt.getTime() + randomBetween(3, 40) * 60000);
        const reaction =
          Math.random() < options.positiveReactionRatio
            ? POSITIVE_REACTIONS[Math.floor(Math.random() * POSITIVE_REACTIONS.length)]
            : NEUTRAL_REACTIONS[Math.floor(Math.random() * NEUTRAL_REACTIONS.length)];
        instance = await challengeActionsService.complete(instance, reaction, completedAt);
      } else {
        const reason = ABANDON_REASONS[Math.floor(Math.random() * ABANDON_REASONS.length)];
        instance = await challengeActionsService.abandon(instance, reason, undefined, sentAt);
      }
    }
  }
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface MemorySummary {
  completed: number;
  notCompleted: number;
  pending: number;
  daysRegistered: number;
  categoriesUsed: number;
}
