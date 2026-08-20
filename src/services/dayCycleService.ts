import { challengeInstanceRepository } from '@/storage/repositories/challengeInstanceRepository';
import { selectDailyChallenges, buildInstance, type SelectDailyChallengesOptions } from '@/engine/ChallengeEngine';
import { sleepDeadlineFor } from '@/engine/dayModel';
import { FIRST_ACTION_CHALLENGE } from '@/data/firstActionChallenge';
import { getInstanceActionKind } from '@/data/challenges';
import { notificationService } from './notificationService';
import { weeklyRecapService } from './weeklyRecapService';
import { progressionService } from './progressionService';
import { weatherService } from './weatherService';
import { contextService } from './contextService';
import { profileService } from './profileService';
import { preferencesRepository } from '@/storage/repositories/preferencesRepository';
import { currentLocationService } from './currentLocationService';
import { analyticsService } from './analyticsService';
import { crashService } from './crashService';
import { minuteToDate } from '@/engine/scheduling';
import { daysBetween, logicalDateFor, yesterdayOf } from '@/utils/date';
import { getCurrentDate } from '@/utils/now';
import { timeToMinutes } from '@/utils/time';
import { EMPTY_CONTEXT, type AppContext } from '@/types/context';
import type { ChallengeInstance, DaySummary, UserProfile } from '@/types';

const REFLECTION_REMINDER_MINUTES_BEFORE_SLEEP = 30;

// "Recuperação/recomeço" (ver app/(main)/(tabs)/home.tsx) — a partir de quantos dias sem abrir o
// app o retorno vira um momento a celebrar, não só mais um dia comum. Abaixo disso (1-2 dias),
// ninguém precisa se sentir "recebido de volta" — é só o uso normal do app.
export const RECOVERY_THRESHOLD_DAYS = 3;

// Trava em memória, por `activeDate` — `ensureUpcomingActions` é chamado de vários lugares que
// podem disparar quase ao mesmo tempo (mount da Home, useFocusEffect ao voltar pra tela,
// listener de notificação recebida). Sem isso, cada chamada concorrente lê `instances.length
// === 0` ANTES de qualquer uma delas terminar de salvar (AsyncStorage é assíncrono) e todas
// entram no bloco de "primeira geração do período" — gerando o dia inteiro, agendando
// notificações e o lembrete de fim de dia (`scheduleDayReflectionReminder`) MAIS DE UMA VEZ.
// Era isso que fazia o lembrete "Como foi seu dia hoje?" chegar triplicado à noite: 3 chamadas
// concorrentes, cada uma agendando sua própria notificação pro mesmo horário. A trava garante
// que só a primeira chamada de cada período realmente gera; as demais esperam o mesmo resultado.
const generationLocks = new Map<string, Promise<{ instances: ChallengeInstance[]; returningAfterGapDays: number | null; profile: UserProfile }>>();

export interface DailyActionsResult {
  instances: ChallengeInstance[];
  // Dias desde a última vez que existiu alguma ação anterior a `activeDate` — só quando esse gap
  // ultrapassa RECOVERY_THRESHOLD_DAYS (null no uso normal, dia a dia).
  returningAfterGapDays: number | null;
  // Perfil possivelmente atualizado por `syncRegisteredLocationForToday` (cidade sincronizada com
  // o GPS na primeira geração do período) — sempre presente, mesmo quando igual ao perfil
  // recebido, pra quem chama nunca precisar decidir entre o perfil antigo e um "talvez atualizado".
  profile: UserProfile;
}

// Sem Concluir/Não consegui (ver plano de migração seção 4), não existe mais status de conclusão
// pra contar — `completed`/`notCompleted`/`ignored` ficam sempre 0, `total` conta o que foi
// entregue (`deliveredAt`). Mantém o shape de `DaySummary` intacto (menor mudança possível — ver
// DayCard.tsx, que já foi ajustado pra não depender mais dessas contagens).
function buildSummary(date: string, instances: ChallengeInstance[]): DaySummary {
  const total = instances.filter((i) => i.deliveredAt != null).length;
  return { date, completed: 0, notCompleted: 0, ignored: 0, total, completionRate: 0 };
}

/**
 * Não existe nenhum registro de "ciclo aberto" — a data ativa é sempre calculada, nunca lida de um
 * objeto salvo. Normalmente é hoje (`logicalDateFor(now)`); só é ontem quando `now` ainda está
 * antes do horário de dormir de ontem (`sleepDeadlineFor`) — cobre rotina que atravessa a
 * meia-noite (ex: acorda 16h, dorme 10h do dia seguinte) sem depender de nenhum estado guardado.
 * Pura e síncrona (função de `profile`/`now`, sem storage) — por isso exportada separadamente,
 * reaproveitada por `DayCard`/`history.tsx` pra decidir se ainda deve esconder ações futuras.
 */
export function resolveActiveDate(profile: UserProfile, now: Date = getCurrentDate()): string {
  const today = logicalDateFor(now);
  const yesterday = yesterdayOf(today);
  return now.getTime() < sleepDeadlineFor(yesterday, profile).getTime() ? yesterday : today;
}

/**
 * DORMENTE (ver plano de migração seção 4): existia pra transicionar ações `pendente` de um
 * período já dormido pra `ignorado` — esse status não existe mais em `ChallengeInstance` (histórico
 * virou orientado a eventos, ver deliveredAt/completedAt/dismissedAt/skippedAt). Mantida como
 * função sem efeito, em vez de removida, pra não precisar mexer nos call sites (`ensureUpcomingActions`/
 * `forceExpirePending`) até o produto decidir o que "expirar" significa nesse modelo novo.
 */
async function expireStalePending(_profile: UserProfile, _now: Date, _activeDate: string, _force = false): Promise<void> {
  // no-op — ver comentário acima.
}

/**
 * Corpo real da "primeira geração do período" — extraído pra ser compartilhado por chamadas
 * concorrentes via `generationLocks` (ver comentário acima). Só quem primeiro chega a esse
 * ponto pra um dado `activeDate` de fato executa isso; as demais chamadas concorrentes recebem
 * o mesmo resultado (mesmas instâncias, mesma notificação de lembrete já agendada uma única vez).
 */
async function generateForActiveDate(
  profile: UserProfile,
  now: Date,
  activeDate: string,
  options: SelectDailyChallengesOptions,
): Promise<{ instances: ChallengeInstance[]; returningAfterGapDays: number | null; profile: UserProfile }> {
  // "Recuperação/recomeço": maior data distinta já existente antes de `activeDate` — mesmo
  // sinal de antes (diferença de dias = há quanto tempo a pessoa não abre o app), só que
  // calculado a partir do próprio dado em vez de um registro de ciclo.
  const all = await challengeInstanceRepository.getAll();
  const previousDates = [...new Set(all.map((i) => i.date))].filter((d) => d < activeDate).sort();
  const lastDate = previousDates[previousDates.length - 1];
  let returningAfterGapDays: number | null = null;
  if (lastDate) {
    const gap = daysBetween(lastDate, activeDate);
    if (gap >= RECOVERY_THRESHOLD_DAYS) returningAfterGapDays = gap;
  }

  // Só na primeira geração do período (uma vez por período, mesmo "gatilho" da atualização de
  // clima logo abaixo) — sem isso, alguém que viaja continuaria com o clima/estação/datas
  // comemorativas calculados pra a cidade cadastrada há meses, porque `profile.location` só
  // mudava se a pessoa fosse em Configurações trocar manualmente.
  profile = await syncRegisteredLocationForToday(profile);

  const history = await challengeInstanceRepository.getAll();
  const context = await buildTodayContext(profile, now);
  // Sistema de dificuldade adaptativa (ver src/engine/progression.ts) — carregado aqui, fora
  // do motor síncrono, mesmo padrão de `buildTodayContext` pra clima/evento. Se o call site já
  // passou `performanceByConcept` explicitamente (não acontece hoje, mas deixa a porta
  // aberta), respeita o que foi passado em vez de sobrescrever.
  const performanceByConcept = options.performanceByConcept ?? (await progressionService.getPerformanceByConcept());
  let newInstances = selectDailyChallenges(profile, history, now, context, { ...options, performanceByConcept });

  if (profile.notificationsEnabled) {
    newInstances = await notificationService.scheduleForInstances(newInstances);
  }

  await challengeInstanceRepository.saveMany(newInstances);

  // Convite pra registrar o resumo do dia, perto da hora de dormir — só uma vez por período. A
  // trava em memória (`generationLocks`) já evita chamadas concorrentes DENTRO do mesmo processo,
  // mas não sobrevive ao app ser encerrado pelo sistema operacional no meio da primeira geração
  // (comum em segundo plano): se isso acontecer antes de `saveMany` acima terminar, a próxima
  // abertura veria `instances.length === 0` de novo e cairia aqui uma segunda vez, reagendando o
  // lembrete mesmo que o primeiro agendamento já tivesse ido pro SO com sucesso — era isso que
  // fazia "Como foi seu dia hoje?" chegar duplicado em alguns dias. Esse guard persistido (mesmo
  // padrão de `lastWeeklyRecapNotifiedWeekStart`, ver weeklyRecapService) fecha a brecha: sobrevive
  // a reabrir o app, então só a primeira geração de fato bem-sucedida de cada `activeDate` agenda.
  if (profile.notificationsEnabled) {
    const prefs = await preferencesRepository.get();
    if (prefs.lastDayReflectionReminderDate !== activeDate) {
      const reminderMinute = timeToMinutes(profile.sleepTime) - REFLECTION_REMINDER_MINUTES_BEFORE_SLEEP;
      await notificationService.scheduleDayReflectionReminder(minuteToDate(now, reminderMinute), now);
      await preferencesRepository.save({ ...prefs, lastDayReflectionReminderDate: activeDate });
    }
  }

  // "O que você melhorou?" ficou pronto — só dispara na segunda-feira (início de uma nova
  // semana), aqui dentro do "gera pela primeira vez" garante no máximo uma checagem por
  // período, e o próprio weeklyRecapService garante no máximo uma notificação por semana.
  if (profile.notificationsEnabled) {
    await weeklyRecapService.notifyIfReady(now);
  }

  return { instances: newInstances, returningAfterGapDays, profile };
}

export const dayCycleService = {
  /**
   * Garante que existem ações geradas para o período acordado atual (ver resolveActiveDate) e
   * expira preguiçosamente qualquer pendência de um período anterior já dormido. Idempotente por
   * dado (não por registro): reabrir o app várias vezes dentro do mesmo período nunca gera um
   * segundo lote, porque já existem instâncias salvas pra `activeDate`.
   */
  async ensureUpcomingActions(
    profile: UserProfile,
    now: Date = getCurrentDate(),
    options: SelectDailyChallengesOptions = {},
  ): Promise<DailyActionsResult> {
    const activeDate = resolveActiveDate(profile, now);
    await expireStalePending(profile, now, activeDate);

    let instances = await challengeInstanceRepository.getByDate(activeDate);
    let returningAfterGapDays: number | null = null;

    if (instances.length === 0) {
      // Trava por `activeDate` (ver comentário em `generationLocks`) — se outra chamada
      // concorrente já está gerando esse período, espera o MESMO resultado em vez de gerar (e
      // notificar) tudo de novo.
      let pending = generationLocks.get(activeDate);
      if (!pending) {
        pending = generateForActiveDate(profile, now, activeDate, options).finally(() => {
          generationLocks.delete(activeDate);
        });
        generationLocks.set(activeDate, pending);
      }
      const generated = await pending;
      instances = generated.instances;
      returningAfterGapDays = generated.returningAfterGapDays;
      profile = generated.profile;
    }

    // Propriedades persistentes do usuário no Firebase — reenviadas a cada abertura do app (ver
    // home.tsx, que chama ensureUpcomingActions no load), não só na criação do perfil, pra refletir
    // mudanças feitas depois em Editar Perfil (intensidade, notificações etc.).
    analyticsService.setUserProperties({
      challenge_intensity: profile.challengeIntensity,
      notifications_enabled: profile.notificationsEnabled,
      is_working: profile.isWorking,
      social_media_usage: profile.socialMediaUsage,
      important_people_count: profile.importantPeople.length,
    });

    return { instances, returningAfterGapDays, profile };
  },

  /**
   * Resumo de um dia pro Histórico. Pro dia ainda em andamento (data ativa agora), conta só as
   * instâncias já reveladas (`scheduledFor <= now`) — nunca as próximas ações que ainda vão
   * chegar. Sem esse filtro, a % concluída e a lista expandida denunciariam quantas ações
   * ainda restam hoje, quebrando a surpresa (ver seção "não revelar ação futura").
   */
  async getSummaryForDate(date: string, profile: UserProfile | null, now: Date = getCurrentDate()): Promise<DaySummary> {
    const instances = await challengeInstanceRepository.getByDate(date);
    const activeDate = profile ? resolveActiveDate(profile, now) : logicalDateFor(now);
    const visible = date === activeDate ? instances.filter((i) => new Date(i.scheduledFor).getTime() <= now.getTime()) : instances;
    // Sugestões nunca contam nas estatísticas de dia (ver ChallengeActionKind) — sem isso, uma
    // sugestão que nunca teve botão de conclusão ficaria "pendente" pra sempre e, depois de
    // expirada, contaria como "ignorado" no cabeçalho do Histórico.
    const tracked = visible.filter((i) => getInstanceActionKind(i) === 'acao');
    return buildSummary(date, tracked);
  },

  /**
   * Ponto de entrada do botão "Receber minha primeira ação" (ver app/onboarding/first-action.tsx).
   * Reaproveita `ensureUpcomingActions` (mesmo motor, mesmo clima/evento/família), forçando a
   * primeiríssima ação a ser sempre `FIRST_ACTION_CHALLENGE` (fixa, fora do catálogo — ver
   * src/data/firstActionChallenge.ts) em vez de sorteada. Idempotente: se a pessoa já tem uma
   * primeira ação (ex: voltou pra essa tela sem querer), devolve a mesma instância em vez de
   * gerar outra.
   */
  async requestFirstAction(profile: UserProfile, now: Date = getCurrentDate()): Promise<{ profile: UserProfile; instance: ChallengeInstance; notificationSent: boolean }> {
    if (profile.firstActionInstanceId) {
      const activeDate = resolveActiveDate(profile, now);
      const activeInstances = await challengeInstanceRepository.getByDate(activeDate);
      const existing = activeInstances.find((i) => i.id === profile.firstActionInstanceId);
      if (existing) return { profile, instance: existing, notificationSent: false };
    }

    const { instances } = await dayCycleService.ensureUpcomingActions(profile, now, { fixedFirstChallenge: FIRST_ACTION_CHALLENGE });
    let first = [...instances].sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))[0];

    if (!first) {
      // computeDaySlots pode não abrir nenhum período pra "agora" (ex: pessoa testando/abrindo o
      // app depois do horário de dormir que ela mesma configurou, ou durante o expediente com
      // "não notificar no trabalho" marcado) — comportamento certo pro ciclo normal do dia, mas
      // aqui a pessoa acabou de tocar em "Receber minha primeira ação" pedindo isso NA HORA, então
      // não faz sentido cair no silêncio do motor. Cria a ação fixa diretamente, fora do
      // pipeline de slots — já fica achável depois via challengeInstanceRepository.getByDate.
      const activeDate = resolveActiveDate(profile, now);
      first = buildInstance(FIRST_ACTION_CHALLENGE, now, activeDate);
      await challengeInstanceRepository.save(first);
    }

    // A ação já foi criada e salva a essa altura — uma falha ao disparar a notificação (permissão
    // negada no meio do caminho, erro do SO, etc.) não pode derrubar o fluxo inteiro e mostrar erro
    // pra quem só queria ver a ação na tela.
    let notificationSent = false;
    if (profile.notificationsEnabled) {
      try {
        const notificationId = await notificationService.sendNow(first);
        notificationSent = notificationId != null;
      } catch (error) {
        notificationSent = false;
        crashService.recordError(error, 'requestFirstAction.sendNow');
      }
    }

    const updatedProfile = await profileService.markFirstActionAvailable(first.id);
    analyticsService.log('first_action_generated', { notificationSent });
    return { profile: updatedProfile, instance: first, notificationSent };
  },

  /**
   * Expira agora qualquer pendência de fora do período acordado atual, mesmo antes do horário de
   * dormir — só pro Modo Dev (botão "Encerrar dia agora"), pra testar o comportamento de expiração
   * sem esperar o horário real. `true` se havia alguma pendência pra expirar.
   */
  // DORMENTE (ver expireStalePending) — sempre `false`, não existe mais status "pendente" pra
  // expirar. Mantida pro botão "Encerrar dia agora" do Modo Dev continuar compilando/chamável.
  async forceExpirePending(_profile: UserProfile, _now: Date = getCurrentDate()): Promise<boolean> {
    return false;
  },
};

/**
 * Contexto de clima/estação/data comemorativa pro período que está sendo gerado — chamado só
 * aqui, uma vez por período (nunca por desafio, ver seção 20 do pedido). Clima e datas
 * comemorativas sempre fazem parte do contexto (não são mais opcionais em Configurações);
 * `ensureFreshWeather` só bate na API se o cache estiver vencido, e sem localização
 * cadastrada simplesmente não tenta. Nunca lança: qualquer falha aqui devolve
 * EMPTY_CONTEXT e o motor segue funcionando normalmente (seção 21/26).
 */
async function buildTodayContext(profile: UserProfile, now: Date): Promise<AppContext> {
  try {
    await weatherService.ensureFreshWeather(profile.location, now);
    return await contextService.getCurrentContext(profile, now);
  } catch {
    return EMPTY_CONTEXT;
  }
}

/**
 * Atualiza `profile.location` com a cidade real da pessoa agora, uma vez por período — cobre quem
 * viaja: sem isso, `profile.location` só mudava se a pessoa fosse em Configurações trocar
 * manualmente, e o clima/estação/datas comemorativas ficariam presos pra sempre na cidade
 * cadastrada no cadastro, mesmo que a pessoa estivesse em outro lugar há dias.
 *
 * Nunca pede permissão (só lê o status já concedido — pedir aqui, no meio da abertura do dia,
 * seria fora de contexto pra pessoa) e nunca lança: qualquer falha de GPS/rede/API mantém a
 * cidade cadastrada como está, exatamente como se essa sincronização não existisse.
 */
async function syncRegisteredLocationForToday(profile: UserProfile): Promise<UserProfile> {
  try {
    const status = await currentLocationService.getPermissionStatus();
    if (status !== 'granted') return profile;

    const detected = await currentLocationService.fetchLocationOnly();
    if (!detected) return profile;

    const registered = profile.location;
    const sameCity = registered != null && registered.city.trim().toLowerCase() === detected.city.trim().toLowerCase();
    if (sameCity) return profile;

    return await profileService.updateLocation(detected);
  } catch {
    return profile;
  }
}
