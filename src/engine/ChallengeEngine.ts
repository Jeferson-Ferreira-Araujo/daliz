import type {
  AppContext,
  Challenge,
  ChallengeActionKind,
  ChallengeCategory,
  ChallengeInstance,
  ChallengeIntensity,
  ChallengeLevel,
  DayOfWeek,
  ImportantPerson,
  Interest,
  ProfileTag,
  RelationshipType,
  UserActionPerformance,
  UserProfile,
} from '@/types';
import {
  CHALLENGE_CATEGORY_LABELS,
  EMPTY_CONTEXT,
  INTEREST_LABELS,
  RELATIONSHIP_GENERIC_PHRASE,
  RELATIONSHIP_LABELS,
  WEATHER_TYPE_LABELS,
} from '@/types';
import { allChallenges, challengeById } from '@/data/challenges';
import { scoreChallenge, type ScoringContext } from './scoring';
import { computeDaySlots, remainingDayRatio, type DaySlot } from './dayModel';
import { isSupersededByProgression } from './progression';
import { getChallengeTiming } from './challengeTiming';
import { computeProfileTags } from './profileTags';
import { ALGORITHM_RULES } from './algorithmRules';
import { generateId } from '@/utils/id';
import { dayOfWeekFor, daysBetween, isBirthdayToday, logicalDateFor } from '@/utils/date';
import { getCurrentDate } from '@/utils/now';
import { SEASON_LABELS } from '@/utils/season';

// Deriva minutos reais a partir de `effort.time` quando `tempoEstimado` não está explícito —
// permite que ações novas só precisem de `effort.time` (categoria), sem calibração manual em
// minutos (ver plano de migração seção 1.2). O motor continua usando minutos reais internamente
// (orçamento diário, `spreadTimesWithinSlot` etc) — isso nunca muda.
const EFFORT_TIME_MINUTES: Record<'instant' | 'short' | 'medium' | 'long', number> = {
  instant: 2,
  short: 10,
  medium: 25,
  long: 50,
};

function resolveTempoEstimado(challenge: Challenge): number {
  return challenge.tempoEstimado ?? EFFORT_TIME_MINUTES[challenge.effort?.time ?? 'short'];
}

/** Deriva `nivel` (fácil/médio/desafiador) de `difficulty` (1-5) quando ausente — mantém
 * `intensityBonus` funcionando sem exigir os dois campos calibrados nas ações novas. */
function resolveNivel(challenge: Challenge): ChallengeLevel {
  if (challenge.nivel) return challenge.nivel;
  const difficulty = challenge.difficulty ?? 2;
  if (difficulty <= 2) return 'facil';
  if (difficulty === 3) return 'medio';
  return 'desafiador';
}

/** Interesses achatados de um desafio (required+preferred) — usado tanto pro bônus de pontuação
 * quanto pra copiar em `ChallengeInstance.interests` (ver buildInstance). */
function flattenInterests(challenge: Challenge): Interest[] {
  const rules = challenge.interests;
  if (!rules) return [];
  return [...new Set([...rules.required, ...rules.preferred])];
}

const DEFAULT_COOLDOWN_DAYS = 3; // usado quando o desafio não tem cooldownDias/repetition.minIntervalDays definido
const SAME_CATEGORY_PENALTY = 6; // penalidade por categoria já usada hoje, incentiva variedade sem travar
const SAME_INTEREST_PENALTY = 6; // mesma ideia, por interesse repetido (ver ALGORITHM_RULES.maxSameInterestInSequence)

// Quantidade de ações por dia é sorteada de novo todo dia dentro dessa faixa — nem todo usuário,
// nem todo dia do mesmo usuário, recebe o mesmo número de ações (ver pickActionCountsPerSlot).
// `challengeIntensity` já existia no cadastro só pra dificuldade; reaproveitado aqui como sinal
// de apetite/frequência também, em vez de criar uma pergunta nova. Como um período do dia pode
// receber mais de 1 ação (ver spreadTimesWithinSlot), a faixa não fica mais presa ao teto de ~5
// "momentos" nomeados do dia.
const DAILY_ACTION_RANGE: Record<ChallengeIntensity, [number, number]> = {
  leve: [2, 3],
  equilibrado: [5, 7],
  desafiador: [7, 10],
};

// Orçamento diário de tempo (minutos) — escala junto com a intensidade, senão o teto de tempo
// filtraria a maioria das ações antes de a quantidade sorteada acima ser alcançável de verdade.
const DAILY_MINUTE_BUDGET: Record<ChallengeIntensity, number> = {
  leve: 45,
  equilibrado: 65,
  desafiador: 90,
};

// Espaçamento mínimo entre ações dentro do mesmo período do dia — evita amontoar notificações a
// poucos minutos de distância (pareceria spam, não "dinâmico").
const MIN_GAP_MINUTES = 30;

// Sugestões (actionKind 'sugestao') são só ~5% do catálogo (83 de ~1686) — competir por
// pontuação no MESMO pool das ações (DAILY_ACTION_RANGE) as deixaria praticamente inelegíveis
// pra sempre, já que `pickBest`/`rankCandidates` escolhe sempre o de maior pontuação, nunca por
// sorteio ponderado (ver ChallengeEngine.selectDailyChallenges). Em vez de dar bônus de pontuação
// (mudaria o "funciona igual" pedido — mesma fórmula, mesmos filtros), sugestões disputam numa
// raia própria: só contra outras sugestões elegíveis daquele momento, com sua própria faixa
// diária pequena. Escala com intensidade, igual DAILY_ACTION_RANGE.
const DAILY_SUGGESTION_RANGE: Record<ChallengeIntensity, [number, number]> = {
  leve: [0, 1],
  equilibrado: [0, 1],
  desafiador: [0, 2],
};

// Orçamento de minutos só das sugestões — independente de DAILY_MINUTE_BUDGET (não deve
// competir pelo nem ser inflado pelo orçamento de tempo das ações). Sugestões reais no catálogo
// hoje vão de 3 a 10 min (média ~4) — folga suficiente pra até 2 no mesmo dia sem forçar nada.
const SUGGESTION_MINUTE_BUDGET = 20;

// Máximo de ações `today`/`contextual` mostradas de uma vez na seção "Em aberto" da Home (ver
// app/(main)/(tabs)/home.tsx) — reaproveitada em vez de espalhar o número pelo código. Ações
// `now` nunca entram nessa seção (ver seção 5 do pedido de timing), então esse teto não as afeta.
export const MAX_OPEN_ACTIONS = 3;

// Redes sociais são ferramenta, não vício a eliminar — mas também não podem virar
// o assunto principal do app. O motor mantém a fatia de desafios 📱 pequena
// (≈10-15% do que a pessoa recebe), olhando o histórico recente, em vez de um
// limite fixo por dia. Ver seção "socialShareBonus" abaixo.
const SOCIAL_SHARE_LOOKBACK_DAYS = 30;
const SOCIAL_SHARE_CAP: Record<'sim' | 'as_vezes', number> = { sim: 0.15, as_vezes: 0.08 };
const SOCIAL_SHARE_PENALTY = 40;

// Quando a pessoa topa receber notificações durante o expediente (ver
// UserProfile.receiveDuringWorkHours), o slot "durante_dia" de trabalho só pode
// escolher entre categorias discretas e compatíveis com estar no trabalho — nunca
// exercício, família ou algo que a exponha ou atrapalhe o que ela está fazendo.
const WORK_SAFE_CATEGORIES: ChallengeCategory[] = [
  'trabalho_financas',
  'rotina_organizacao',
  'aprendizado_desenvolvimento',
];

// Interesses/hobbies são só MAIS UM sinal de pontuação — nunca podem dominar a escolha
// (ver seção 10 do pedido: "não permitir que hobbies dominem o algoritmo"). Por isso o
// bônus tem teto baixo perto dos outros fatores (categoryRate chega a +30, bestRated +20).
const INTEREST_MATCH_BASE_BONUS = 6;
const INTEREST_MATCH_MAX_BONUS = 12;
// Sem interesse batendo, mas a pessoa ainda "está descobrindo": pequeno empurrão pra
// desafios de exploração continuarem aparecendo de vez em quando (ver seção 9).
const DISCOVERY_EXPLORATION_BONUS = 4;
const DISCOVERY_TAG = 'descoberta';

// timing.preferredPeriods/avoidPeriods (ver ClockPeriod) — mesma ordem de grandeza dos outros
// bônus/penalidades de contexto soft (weatherBonus/daytimeBonus), nunca filtro duro.
const CLOCK_PERIOD_BONUS = 6;
const CLOCK_PERIOD_PENALTY = 10;

// profile.preferred (ver ProfileTag) — bônus pequeno, mesmo teto de grandeza de outros sinais soft.
const PROFILE_PREFERRED_BONUS = 5;

// Pessoas importantes — mesma filosofia dos interesses (sinal, nunca dominante), mas com
// um filtro duro a mais: um desafio que exige uma pessoa específica (relationships/idade/
// presença) só é candidato se existir alguém cadastrado que bate com esses critérios (ver
// filterCandidatesForSlot). O bônus abaixo só decide QUAL pessoa priorizar entre as que já
// bateram, e o quanto isso pesa na pontuação final.
const PERSON_MATCH_BASE_BONUS = 6;
const PERSON_MATCH_MAX_BONUS = 12;
const PERSON_NOVELTY_CAP_DAYS = 21; // depois disso, "faz tempo que não aparece" já vale o máximo
const PERSON_NOVELTY_WEIGHT = 0.3;
const SAME_PERSON_PENALTY = 6; // por repetição da mesma pessoa hoje — mesma lógica de categoryDiversityPenalty
// Token usado nos textos dos desafios (ver src/data/challenges/personCombos.ts) — resolvido
// pra o nome da pessoa (às vezes) ou pra uma frase genérica da relação (ver seção 13: nome
// demais soa artificial).
const PERSON_PLACEHOLDER = '{pessoa}';
const NAME_USE_PROBABILITY = 0.35;

// Clima é contexto, não determinação (seção 9 do pedido): uma ação outdoor em chuva
// forte perde MUITO em pontuação — na prática quase nunca vence quando há alternativa —
// mas continua tecnicamente elegível (nunca é filtro duro), pra nunca travar a seleção
// se for a única opção disponível naquele momento (ver seção 26: nada pode quebrar).
const WEATHER_OUTDOOR_RAIN_PENALTY = 60;
const WEATHER_MATCH_BONUS = 8;
const WEATHER_MISMATCH_PENALTY = 10;

// Mesma filosofia do clima acima, mas pela hora REAL do relógio (nunca a hora subjetiva da
// rotina de quem vai receber) — resolve o caso de quem trabalha de madrugada e dorme de dia: uma
// ação outdoor (visitar praça/parque/feira etc.) não faz sentido às 3h só porque é "período
// acordado" de alguém, porque o motivo é o mundo real estar fechado/escuro, não a rotina de quem
// recebe. Penalidade forte (nunca filtro duro), mesma ordem de grandeza da chuva.
const OUTDOOR_NIGHT_PENALTY = 60;
const REAL_DAYTIME_START_HOUR = 7;
const REAL_DAYTIME_END_HOUR = 20;

const SEASON_MATCH_BONUS = 5;

// Datas comemorativas têm teto maior que interesse/pessoa — são mais raras e mais
// impactantes quando realmente acontecem — mas ainda finito (seção 8: "não dominar
// o app"): mesmo no pico (hoje, evento de alta importância), não ultrapassa este valor.
const EVENT_MATCH_BASE_BONUS = 10;
const EVENT_MATCH_MAX_BONUS = 25;
const EVENT_PHASE_WEIGHT: Record<string, number> = { today: 1, near: 0.7, approaching: 0.4, after: 0.3, none: 0 };
const EVENT_IMPORTANCE_WEIGHT: Record<string, number> = { high: 1, medium: 0.7, low: 0.5 };
// Fases em que um desafio "event_specific" (só faz sentido dentro da janela do evento)
// pode aparecer — fora disso ele é filtrado, igual relationships (ver filterCandidatesForSlot).
const EVENT_SPECIFIC_PHASES = new Set(['near', 'today', 'after']);

/**
 * Contexto de pontuação compartilhado entre todos os slots do dia — computado uma
 * vez a partir do histórico, reaproveitado pra cada momento (ver buildSelectionContext).
 */
interface SelectionContext {
  scoringContext: ScoringContext;
  interestAffinity: Partial<Record<Interest, number>>;
  socialBlocked: boolean;
  socialShare: number;
  socialShareCap: number;
  todayWeekday: DayOfWeek;
  daysSinceLastUse: Map<string, number>;
  conceptDaysSinceLastUse: Map<string, number>;
  personDaysSinceLastUse: Map<string, number>;
  relationshipAffinity: Partial<Record<RelationshipType, number>>;
  context: AppContext;
  // Sistema de dificuldade adaptativa (ver src/engine/progression.ts) — {} pra quem nunca usou
  // nenhuma ação progressiva, mesmo comportamento de sempre.
  performanceByConcept: Record<string, UserActionPerformance>;
}

/**
 * Para cada momento do dia da pessoa (ver dayModel.computeDaySlots), escolhe o
 * desafio dos 901 que melhor combina com aquele momento específico — ou nenhum,
 * se nada combinar bem o suficiente. É a "regra de ouro": melhor não enviar
 * nada do que mandar um desafio que não faz sentido no contexto.
 */
export interface SelectDailyChallengesOptions {
  // Força a primeiríssima escolha do dia a ser este desafio específico, em vez de sortear/pontuar
  // candidatos do catálogo — usado só por `dayCycleService.requestFirstAction` (ver
  // src/data/firstActionChallenge.ts) pra garantir que todo usuário novo recebe a mesma ação fixa
  // de boas-vindas. As demais escolhas do dia (a partir da segunda) seguem o motor normal, já
  // contando esse desafio fixo pra variedade de categoria e orçamento de tempo do resto do dia.
  // Ausente = comportamento normal, preserva o resto do app.
  fixedFirstChallenge?: Challenge;
  // Sistema de dificuldade adaptativa (ver src/engine/progression.ts) — pré-carregado de forma
  // assíncrona por dayCycleService antes de chamar selectDailyChallenges (mesmo padrão já usado
  // pra clima/evento em buildTodayContext), porque a leitura do repositório é assíncrona e esta
  // função é síncrona. Ausente/{} = ninguém participa de nenhuma progressão, zero mudança de
  // comportamento pros call sites que não passam essa opção.
  performanceByConcept?: Record<string, UserActionPerformance>;
  // Dev-only: chamado a cada escolha real (não a fixa de `fixedFirstChallenge`) com todos os
  // candidatos já pontuados e ordenados daquele momento — usado só por
  // `app/dev/schedule-preview.tsx` pra mostrar as alternativas consideradas, não só a vencedora.
  // Nunca chamado pelo fluxo real de geração (dayCycleService não passa essa opção).
  onCandidatesScored?: (scheduledFor: Date, ranked: ScoredCandidate[]) => void;
}

export function selectDailyChallenges(
  profile: UserProfile,
  history: ChallengeInstance[],
  now: Date,
  context: AppContext = EMPTY_CONTEXT,
  options: SelectDailyChallengesOptions = {},
): ChallengeInstance[] {
  const today = logicalDateFor(now);
  const todayWeekday = dayOfWeekFor(now);
  const ctx = buildSelectionContext(profile, history, today, todayWeekday, context, options.performanceByConcept ?? {});
  const minuteBudget = DAILY_MINUTE_BUDGET[profile.challengeIntensity];

  const slots = computeDaySlots(profile, now);
  const countsPerSlot = pickActionCountsPerSlot(slots, profile.challengeIntensity, remainingDayRatio(profile, now));
  const usedTodayIds = new Set<string>();
  const usedCategoriesToday = new Map<ChallengeCategory, number>();
  const usedInterestsToday = new Map<Interest, number>();
  const usedPersonIds = new Map<string, number>();
  let totalMinutes = 0;
  const picks: { challenge: Challenge; scheduledFor: Date; person: ImportantPerson | null }[] = [];

  for (let slotIndex = 0; slotIndex < slots.length; slotIndex += 1) {
    const slot = slots[slotIndex];
    const times = spreadTimesWithinSlot(slot, countsPerSlot[slotIndex]);

    for (const scheduledFor of times) {
      let best: Challenge;
      let person: ImportantPerson | null = null;

      if (options.fixedFirstChallenge && picks.length === 0) {
        // Primeiríssima escolha do dia forçada (ver requestFirstAction) — pula filtro/pontuação
        // por completo, é sempre a mesma ação pra todo mundo.
        best = options.fixedFirstChallenge;
      } else {
        // "Janela virtual" — mesmo período (momento/tipoDia), só com o horário real da tentativa,
        // pra timeOfDayBonus/scheduling refletirem quando a ação realmente vai aparecer dentro de
        // um período longo (ver spreadTimesWithinSlot).
        const virtualSlot: DaySlot = { ...slot, start: scheduledFor };
        const candidates = filterCandidatesForSlot(virtualSlot, profile, ctx, usedTodayIds, totalMinutes, picks.length > 0, minuteBudget);
        if (candidates.length === 0) continue; // nada combina bem o suficiente nesse momento — não força nada

        const ranked = rankCandidates(candidates, virtualSlot, profile, ctx, usedCategoriesToday, usedPersonIds, usedInterestsToday);
        best = ranked[0].challenge;
        options.onCandidatesScored?.(scheduledFor, ranked);
        person = selectPersonForChallenge(best, profile, ctx)?.person ?? null;
      }

      usedTodayIds.add(best.id);
      usedCategoriesToday.set(best.categoria, (usedCategoriesToday.get(best.categoria) ?? 0) + 1);
      for (const interest of flattenInterests(best)) {
        usedInterestsToday.set(interest, (usedInterestsToday.get(interest) ?? 0) + 1);
      }
      if (person) usedPersonIds.set(person.id, (usedPersonIds.get(person.id) ?? 0) + 1);
      totalMinutes += resolveTempoEstimado(best);
      picks.push({ challenge: best, scheduledFor, person });
    }
  }

  // Sugestões (actionKind 'sugestao') disputam à parte, numa raia própria (ver
  // DAILY_SUGGESTION_RANGE) — mesmos filtros/pontuação de sempre (filterCandidatesForSlot/
  // rankCandidates, reaproveitados sem duplicar lógica), só que só contra outras sugestões, com
  // sua própria faixa diária e orçamento de minutos, nunca disputando o slot/orçamento das ações.
  const suggestionRange = DAILY_SUGGESTION_RANGE[profile.challengeIntensity];
  const suggestionCount = randomBetween(suggestionRange[0], suggestionRange[1]);
  if (suggestionCount > 0) {
    let suggestionMinutes = 0;
    for (const slotIndex of pickDistinctSlotIndexes(slots.length, suggestionCount)) {
      const virtualSlot: DaySlot = { ...slots[slotIndex], start: suggestionTimeWithinSlot(slots[slotIndex]) };
      const candidates = filterCandidatesForSlot(
        virtualSlot,
        profile,
        ctx,
        usedTodayIds,
        suggestionMinutes,
        true,
        SUGGESTION_MINUTE_BUDGET,
        'sugestao',
      );
      if (candidates.length === 0) continue; // nenhuma sugestão combina bem o suficiente agora — não força nada
      const best = rankCandidates(candidates, virtualSlot, profile, ctx, usedCategoriesToday, usedPersonIds, usedInterestsToday)[0].challenge;
      usedTodayIds.add(best.id);
      usedCategoriesToday.set(best.categoria, (usedCategoriesToday.get(best.categoria) ?? 0) + 1);
      suggestionMinutes += resolveTempoEstimado(best);
      picks.push({ challenge: best, scheduledFor: virtualSlot.start, person: null });
    }
  }

  picks.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
  const instances = picks.map(({ challenge, scheduledFor, person }) => buildInstance(challenge, scheduledFor, today, person));

  // Hoje é aniversário do usuário: garante o desafio especial, além dos normais do dia.
  // Mesma regra de silêncio no expediente vale aqui — usa o início do primeiro slot
  // disponível (já pula o expediente quando bloqueado) em vez de sempre "agora".
  if (isBirthdayToday(profile.birthDate, now)) {
    const birthdayChallenge = allChallenges.find((challenge) => challenge.tags.includes('aniversario'));
    if (birthdayChallenge) instances.unshift(buildInstance(birthdayChallenge, slots[0]?.start ?? now, today, null));
  }

  return instances;
}

/** Quantas ações cabem num período respeitando MIN_GAP_MINUTES entre elas — piso de 1 garante que
 * todo período, mesmo curto, ainda entra na disputa pelo menos uma vez. */
function slotCapacity(slot: DaySlot): number {
  const minutes = (slot.end.getTime() - slot.start.getTime()) / 60000;
  return Math.max(1, Math.floor(minutes / MIN_GAP_MINUTES));
}

/**
 * Decide quantas ações cada período do dia tenta receber hoje — sorteado de novo a cada chamada,
 * dentro da faixa de `profile.challengeIntensity` (DAILY_ACTION_RANGE), pra ninguém conseguir
 * prever quantas ações vai receber. Essa faixa é calibrada pro dia INTEIRO (acordar→dormir); se só
 * parte do dia ainda resta (ex: pessoa se cadastra às 19h com sono à 00h — só ~30% do dia pela
 * frente), a faixa é escalada por `dayRatio` (ver dayModel.remainingDayRatio) antes de sortear —
 * senão o motor tentava encaixar a quantidade do dia inteiro nas poucas horas restantes, virando
 * uma enxurrada de ações até a hora de dormir. O período mais próximo de "agora" (`slots[0]`)
 * sempre recebe pelo menos 1 — garante que nunca fica sem nenhuma chance de ação por horas, e é o
 * que sustenta `dayCycleService.requestFirstAction` (a primeira ação precisa aparecer na hora). O
 * resto é sorteado entre os períodos com capacidade sobrando — nunca enche sempre "os primeiros
 * períodos primeiro", senão o padrão viraria previsível de novo (ex: sempre manhã+tarde lotadas).
 */
function pickActionCountsPerSlot(slots: DaySlot[], intensity: ChallengeIntensity, dayRatio: number): number[] {
  if (slots.length === 0) return [];
  const capacities = slots.map(slotCapacity);
  const [rawMin, rawMax] = DAILY_ACTION_RANGE[intensity];
  const min = Math.max(1, Math.round(rawMin * dayRatio));
  const max = Math.max(min, Math.round(rawMax * dayRatio));
  let remaining = clamp(randomBetween(min, max), 1, capacities.reduce((a, b) => a + b, 0));
  const counts = slots.map(() => 0);

  if (capacities[0] > 0) {
    counts[0] = 1;
    remaining -= 1;
  }

  while (remaining > 0) {
    const pool = slots.map((_, i) => i).filter((i) => counts[i] < capacities[i]);
    if (pool.length === 0) break;
    counts[pool[Math.floor(Math.random() * pool.length)]] += 1;
    remaining -= 1;
  }

  return counts;
}

/**
 * Gera os horários de tentativa dentro de um período — 1 tentativa cai exatamente em
 * `slot.start` (igual ao comportamento de sempre, e crítico pro slot 0: é isso que garante
 * `scheduledFor` ≈ agora pra `dayCycleService.requestFirstAction`). Com mais de 1, a primeira
 * continua em `slot.start` e as demais são espalhadas com um pouco de aleatoriedade dentro do
 * resto da janela, pra não caírem sempre em horários redondos e previsíveis.
 */
function spreadTimesWithinSlot(slot: DaySlot, count: number): Date[] {
  // count === 0 precisa devolver [] (nenhuma tentativa nesse período) — antes o `count <= 1`
  // tratava 0 igual a 1 e sempre devolvia [slot.start], então TODO período do dia (até 5, ver
  // MAX_DAY_SLOTS) tentava pelo menos 1 seleção, não importa quantas ações o dia sorteou lá em
  // pickActionCountsPerSlot. Era isso que fazia qualquer intensidade (até "leve") receber quase
  // sempre 4-5 ações: o orçamento sorteado (DAILY_ACTION_RANGE) quase não influenciava o total real.
  if (count === 0) return [];
  if (count === 1) return [slot.start];
  const span = slot.end.getTime() - slot.start.getTime();
  const step = span / count;
  const times: Date[] = [slot.start];
  for (let i = 1; i < count; i += 1) {
    const jitter = Math.random() * step * 0.6;
    times.push(new Date(slot.start.getTime() + i * step + jitter));
  }
  return times;
}

/** Sorteia até `count` índices distintos dentro de `[0, length)`, em ordem crescente — usado pra
 * escolher em quais períodos do dia as sugestões vão cair (nunca mais de 1 sugestão por período,
 * espalhadas em vez de amontoadas). */
function pickDistinctSlotIndexes(length: number, count: number): number[] {
  const pool = Array.from({ length }, (_, i) => i);
  const chosen: number[] = [];
  const n = Math.min(count, length);
  for (let i = 0; i < n; i += 1) {
    const pickIndex = Math.floor(Math.random() * pool.length);
    chosen.push(pool.splice(pickIndex, 1)[0]);
  }
  return chosen.sort((a, b) => a - b);
}

/** Horário de uma sugestão dentro do período — nunca exatamente em `slot.start` (onde a primeira
 * ação do período já costuma cair, ver spreadTimesWithinSlot) pra não notificar as duas no mesmo
 * instante; sorteado na "faixa do meio" do período (15%–75%), nunca colado no fim. */
function suggestionTimeWithinSlot(slot: DaySlot): Date {
  const span = slot.end.getTime() - slot.start.getTime();
  const offset = span * (0.15 + Math.random() * 0.6);
  return new Date(slot.start.getTime() + offset);
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export interface ChallengeExplanation {
  instance: ChallengeInstance | null;
  slot: DaySlot | null;
  reasons: string[];
  candidateCount: number;
}

/**
 * Versão "modo desenvolvedor" da mesma seleção acima, só que pra um único momento
 * (o próximo a partir de `now`) e devolvendo o raciocínio por trás da escolha, em vez
 * de aplicar de fato. Reaproveita exatamente os mesmos filtros/pontuação — não é uma
 * segunda lógica paralela, só uma sonda de leitura sobre o mesmo pipeline (ver
 * app/dev/interests.tsx).
 */
export function explainNextChallenge(
  profile: UserProfile,
  history: ChallengeInstance[],
  now: Date,
  context: AppContext = EMPTY_CONTEXT,
  performanceByConcept: Record<string, UserActionPerformance> = {},
): ChallengeExplanation {
  const today = logicalDateFor(now);
  const todayWeekday = dayOfWeekFor(now);
  const ctx = buildSelectionContext(profile, history, today, todayWeekday, context, performanceByConcept);

  const slots = computeDaySlots(profile, now);
  const slot = slots[0] ?? null;
  if (!slot) {
    return { instance: null, slot: null, reasons: ['Fora da janela acordado — nenhum momento disponível agora.'], candidateCount: 0 };
  }

  const candidates = filterCandidatesForSlot(slot, profile, ctx, new Set(), 0, false, DAILY_MINUTE_BUDGET[profile.challengeIntensity]);
  if (candidates.length === 0) {
    return {
      instance: null,
      slot,
      reasons: ['Nenhuma ação combina bem o suficiente com este momento agora — regra de ouro: melhor não enviar nada.'],
      candidateCount: 0,
    };
  }

  const best = pickBest(candidates, slot, profile, ctx, new Map(), new Map());
  const person = selectPersonForChallenge(best, profile, ctx)?.person ?? null;
  return {
    instance: buildInstance(best, slot.start, today, person),
    slot,
    reasons: buildReasons(best, slot, profile, ctx, person),
    candidateCount: candidates.length,
  };
}

function buildSelectionContext(
  profile: UserProfile,
  history: ChallengeInstance[],
  today: string,
  todayWeekday: DayOfWeek,
  context: AppContext,
  performanceByConcept: Record<string, UserActionPerformance>,
): SelectionContext {
  const daysSinceLastUse = computeDaysSinceLastUse(history, today);
  const conceptDaysSinceLastUse = computeConceptDaysSinceLastUse(history, today);
  const ignoreCounts = computeRecentIgnoreCounts();
  const categoryRates = computeCategoryCompletionRates();
  const bestRatedIds = computeBestRatedIds();
  const interestAffinity = computeInterestCompletionRates();
  const personDaysSinceLastUse = computePersonDaysSinceLastUse(history, today);
  const relationshipAffinity = computeRelationshipCompletionRates();

  // Só bloqueia desafios 📱 de verdade se a pessoa disse que não quer (o sinal que
  // decide é o interesse, não a frequência de uso — ver UserProfile.socialChallengesInterest).
  const socialBlocked = profile.socialChallengesInterest === 'prefiro_nao' || profile.socialNetworks.includes('nenhuma');
  const socialShare = computeRecentSocialShare(history, today, SOCIAL_SHARE_LOOKBACK_DAYS);
  const socialShareCap = SOCIAL_SHARE_CAP[profile.socialChallengesInterest as 'sim' | 'as_vezes'] ?? SOCIAL_SHARE_CAP.as_vezes;

  return {
    scoringContext: {
      categoryCompletionRate: categoryRates,
      bestRatedChallengeIds: bestRatedIds,
      recentIgnoreCounts: ignoreCounts,
      daysSinceLastUse,
    },
    interestAffinity,
    socialBlocked,
    socialShare,
    socialShareCap,
    todayWeekday,
    daysSinceLastUse,
    conceptDaysSinceLastUse,
    personDaysSinceLastUse,
    relationshipAffinity,
    context,
    performanceByConcept,
  };
}

function filterCandidatesForSlot(
  slot: DaySlot,
  profile: UserProfile,
  ctx: SelectionContext,
  usedTodayIds: Set<string>,
  totalMinutes: number,
  hasPicks: boolean,
  minuteBudget: number,
  // 'acao' (default) mantém o comportamento de sempre pros dois call sites existentes (loop
  // principal e explainNextChallenge) — nenhum deles deve considerar sugestão como candidata.
  // Só a seleção de sugestões (ver bloco após o loop principal) passa 'sugestao' explicitamente.
  actionKind: ChallengeActionKind = 'acao',
): Challenge[] {
  const profileTags = computeProfileTags(profile);
  return allChallenges.filter((challenge) => {
    if ((challenge.type ?? 'acao') !== actionKind) return false;
    // Desafios de aniversário são especiais — só entram via injeção direta, nunca pela seleção normal.
    if (challenge.tags.includes('aniversario')) return false;
    if (challenge.status && challenge.status !== 'approved') return false;
    if (usedTodayIds.has(challenge.id)) return false;
    // Sistema de dificuldade adaptativa: se a pessoa já demonstrou consistência nesse nível e o
    // próximo nível existe no catálogo, o nível atual sai do pool — a próxima vez que esse
    // conceito surgir naturalmente, é o próximo nível quem compete (ver src/engine/progression.ts).
    // DESATIVADO na prática (nada mais popula actionPerformanceRepository, ver plano de migração
    // seção 4/6) — mantido chamado por segurança, sempre recebe mapa vazio hoje.
    if (isSupersededByProgression(challenge, ctx.performanceByConcept, challengeById)) return false;
    if (challenge.socialContext && ctx.socialBlocked) return false;
    if (!profile.selectedCategories.includes(challenge.categoria)) return false;
    if (challenge.diasIdeais !== 'qualquer' && !challenge.diasIdeais.includes(ctx.todayWeekday)) return false;

    // Interesses obrigatórios/excluídos (ver ChallengeInterestRules) — "interesse ausente nunca
    // deve deixar a pessoa sem ações disponíveis": só filtra quando `required`/`excluded`
    // realmente têm algo, o que é raro no catálogo (a maioria fica sem restrição, só bônus soft
    // via interestBonus).
    const interestRules = challenge.interests;
    if (interestRules) {
      const known = new Set<Interest>([...profile.interests, ...profile.discoveredInterests]);
      if (interestRules.required.length > 0 && !interestRules.required.every((i) => known.has(i))) return false;
      if (interestRules.excluded.some((i) => known.has(i))) return false;
    }

    // Localização (ver ChallengeLocationRules) — só bloqueia se a pessoa não tem localização
    // cadastrada. `resources.required` NÃO é filtro duro ainda (ver ResourceTag: o app não tem
    // hoje um inventário real do que está disponível pra cada pessoa) — dívida técnica documentada
    // no tipo, não simulada aqui.
    if (challenge.location?.required && !profile.location) return false;

    // Perfil obrigatório/excluído (ver ChallengeProfileRules/computeProfileTags) — generaliza os
    // filtros pontuais legados abaixo (requerFamilia/requerTempoLivre/relationships/minAge/maxAge/
    // requiresPresence), que continuam valendo em paralelo pro catálogo antigo.
    const profileRules = challenge.profile;
    if (profileRules) {
      if (profileRules.required.length > 0 && !profileRules.required.every((tag) => profileTags.has(tag))) return false;
      if (profileRules.excluded.some((tag) => profileTags.has(tag))) return false;
    }

    // Repetição (ver ChallengeRepetition) — `allowed: false` bloqueia PRA SEMPRE depois da
    // primeira aparição (não só "hoje"), cobre ações naturalmente únicas. `minIntervalDays` tem
    // prioridade sobre o `cooldownDias` legado quando presente.
    const daysSince = ctx.daysSinceLastUse.get(challenge.id);
    if (challenge.repetition?.allowed === false && daysSince != null) return false;
    const cooldown = challenge.repetition?.minIntervalDays ?? challenge.cooldownDias ?? DEFAULT_COOLDOWN_DAYS;
    if (daysSince != null && daysSince < cooldown) return false;

    // Cooldown de conceito (ver ALGORITHM_RULES.conceptCooldownDays) — duas ações de textos
    // diferentes mas do mesmo `conceptGroup` (ex: "ligar" e "mandar mensagem", ambas
    // strengthen_connection) compartilham cooldown, evitando repetição semântica mesmo com ids
    // diferentes. Só se aplica quando o desafio tem `conceptGroup` preenchido.
    if (challenge.conceptGroup) {
      const conceptDaysSince = ctx.conceptDaysSinceLastUse.get(challenge.conceptGroup);
      if (conceptDaysSince != null && conceptDaysSince < ALGORITHM_RULES.conceptCooldownDays) return false;
    }

    if (!challenge.momentos.includes(slot.momento) && !challenge.momentos.includes('qualquer')) return false;
    if (!challenge.tiposDia.includes(slot.tipoDia) && !challenge.tiposDia.includes('qualquer')) return false;
    const isWorkHoursSlot = slot.tipoDia === 'trabalho' && slot.momento === 'durante_dia';
    // "transicao" é o momento logo depois do expediente (ver TRANSITION_MINUTES em dayModel.ts) —
    // ainda é trajeto/deslocamento pra maioria das pessoas, não "chegou em casa". Família/tempo
    // livre continuam fora daqui, só WORK_SAFE_CATEGORIES (que é sobre estar EM REUNIÃO, não sobre
    // deslocamento) não se aplica — dá pra receber um desafio de saúde/aprendizado no caminho.
    const isWorkOrCommuteSlot = isWorkHoursSlot || (slot.tipoDia === 'trabalho' && slot.momento === 'transicao');
    // `requerFamilia` era um campo morto — declarado no tipo e preenchido em 552 desafios do
    // catálogo, mas nunca lido pelo motor. Mesmo desafios de categoria "segura" pro expediente
    // (ex: aprendizado_curiosidade) podem ser sobre família ("aprenda algo que seu filho gosta"),
    // que não faz sentido — e pode atrapalhar o rendimento — chegar durante o trabalho ou no
    // trajeto de volta pra casa, mesmo que pudesse ser feito em outro horário do dia (mesma ideia
    // de requerTempoLivre).
    if ((challenge.requerTempoLivre || challenge.requerFamilia) && isWorkOrCommuteSlot) return false;
    // `requerFamilia` não está marcado em TODO desafio de família — ex: "Ligue para {pessoa},
    // mesmo que seja rápido." (relationships: ['filho']) não tem o campo, mas claramente não devia
    // tocar durante o expediente/trajeto. `relationships` é um sinal mais completo: nenhum dos
    // tipos existentes (cônjuge, filho, pai, amigo etc. — ver RelationshipType) é "colega de
    // trabalho", então qualquer desafio que amarra a uma pessoa específica é, por definição, vida
    // pessoal, nunca coisa de expediente/trajeto.
    if (challenge.relationships && challenge.relationships.length > 0 && isWorkOrCommuteSlot) return false;
    if (isWorkHoursSlot && !WORK_SAFE_CATEGORIES.includes(challenge.categoria)) return false;
    // `contexto` também era um campo morto — o comentário no tipo já dizia "eixo de filtro duro",
    // mas nada lia. Só aplicamos o lado 'em_casa' (309 desafios): só faz sentido depois que a
    // pessoa chega em casa, nunca durante o expediente nem no trajeto de volta (ex: "Termine um
    // dia de inverno reconhecendo o aconchego de estar em casa" não devia poder cair às 16h, no
    // meio do trabalho). Não aplicamos o lado 'no_trabalho' (19 desafios) como exigência — os
    // dados desse lado são inconsistentes (alguns claramente mal-marcados, ex: desafios de mesa em
    // família tagueados 'no_trabalho'), então travar por esse lado bloquearia desafios legítimos
    // fora do expediente por engano. Fica pra uma limpeza de conteúdo separada.
    if (challenge.contexto.includes('em_casa') && !challenge.contexto.includes('qualquer') && isWorkOrCommuteSlot) {
      return false;
    }

    // Desafio exige uma pessoa específica (relação/idade/presença) — só é candidato se
    // existir alguém cadastrado que bate com esses critérios (ver seção 8: "brinque com
    // seu filho" não faz sentido pra quem não tem filho cadastrado).
    if (challenge.relationships && challenge.relationships.length > 0) {
      const hasMatchingPerson = profile.importantPeople.some((person) => personMatchesChallenge(challenge, person));
      if (!hasMatchingPerson) return false;
    }

    // Desafio "event_specific" só faz sentido dentro da janela de uma data comemorativa
    // (ver seção 15) — fora da janela nem entra como candidato, igual um desafio de
    // aniversário fora do dia. Dentro da janela ele ainda compete normalmente por
    // pontuação com o resto — não é injetado à força (ver eventBonus).
    if (challenge.contentLevel === 'event_specific') {
      const event = ctx.context.event;
      const matchesEvent = event != null && EVENT_SPECIFIC_PHASES.has(event.phase) && (challenge.eventTags ?? []).some((tag) => event.tags.includes(tag));
      if (!matchesEvent) return false;
    }

    // Orçamento diário de minutos (escala com a intensidade — ver DAILY_MINUTE_BUDGET) — não
    // força se já estourou, exceto na primeira escolha do dia.
    if (totalMinutes + resolveTempoEstimado(challenge) > minuteBudget && hasPicks) return false;

    return true;
  });
}

export interface ScoredCandidate {
  challenge: Challenge;
  score: number;
}

/** Pontua e ordena os candidatos de um slot, do melhor pro pior — `pickBest` é só o topo dessa
 * lista. Exportado pra `explainDailySchedule` (Modo Dev) poder mostrar as alternativas
 * consideradas, não só a vencedora — nunca usado pelo fluxo real de geração. */
function rankCandidates(
  candidates: Challenge[],
  slot: DaySlot,
  profile: UserProfile,
  ctx: SelectionContext,
  usedCategoriesToday: Map<ChallengeCategory, number>,
  usedPersonIds: Map<string, number>,
  usedInterestsToday: Map<Interest, number> = new Map(),
): ScoredCandidate[] {
  const profileTags = computeProfileTags(profile);
  return candidates
    .map((challenge) => ({
      challenge,
      score: scoreCandidate(challenge, slot, profile, ctx, usedCategoriesToday, usedPersonIds, usedInterestsToday, profileTags),
    }))
    .sort((a, b) => b.score - a.score);
}

function pickBest(
  candidates: Challenge[],
  slot: DaySlot,
  profile: UserProfile,
  ctx: SelectionContext,
  usedCategoriesToday: Map<ChallengeCategory, number>,
  usedPersonIds: Map<string, number>,
): Challenge {
  return rankCandidates(candidates, slot, profile, ctx, usedCategoriesToday, usedPersonIds)[0].challenge;
}

function scoreCandidate(
  challenge: Challenge,
  slot: DaySlot,
  profile: UserProfile,
  ctx: SelectionContext,
  usedCategoriesToday: Map<ChallengeCategory, number>,
  usedPersonIds: Map<string, number>,
  usedInterestsToday: Map<Interest, number>,
  profileTags: Set<ProfileTag>,
): number {
  return (
    scoreChallenge(challenge, ctx.scoringContext) +
    timeOfDayBonus(challenge, slot) +
    intensityBonus(challenge, profile.challengeIntensity) +
    momentFitBonus(challenge, slot) +
    categoryDiversityPenalty(challenge, usedCategoriesToday) +
    interestDiversityPenalty(challenge, usedInterestsToday) +
    socialShareBonus(challenge, ctx.socialShare, ctx.socialShareCap) +
    interestBonus(challenge, profile, ctx.interestAffinity) +
    profilePreferredBonus(challenge, profileTags) +
    clockPeriodBonus(challenge, slot) +
    personScoreBonus(challenge, profile, ctx, usedPersonIds) +
    weatherBonus(challenge, ctx.context.weather) +
    daytimeBonus(challenge, slot) +
    seasonBonus(challenge, ctx.context.season) +
    eventBonus(challenge, ctx.context.event)
  );
}

/**
 * Penaliza ações outdoor (`weatherTags: ['outdoor']`) fora do horário real de luz do dia/comércio
 * aberto — usa a hora do RELÓGIO no momento em que o slot vai notificar (`slot.start.getHours()`,
 * mesma técnica de `timeOfDayBonus` logo abaixo), nunca a hora subjetiva da rotina de quem recebe.
 * Cobre o caso de rotina noturna sem precisar reclassificar nenhum dos ~2000 desafios: reaproveita
 * a tag `outdoor` que já existe.
 */
function daytimeBonus(challenge: Challenge, slot: DaySlot): number {
  if (!challenge.weatherTags?.includes('outdoor')) return 0;
  const hour = slot.start.getHours();
  const isRealDaytime = hour >= REAL_DAYTIME_START_HOUR && hour < REAL_DAYTIME_END_HOUR;
  return isRealDaytime ? 0 : -OUTDOOR_NIGHT_PENALTY;
}

/**
 * Clima como contexto, nunca como determinação (seção 9): favorece outdoor quando o
 * tempo ajuda, penaliza bastante (sem bloquear) quando chove/tempestade — o suficiente
 * pra uma alternativa indoor normalmente vencer sozinha, via pontuação, sem precisar de
 * um mapeamento explícito "ação X → alternativa Y".
 */
function weatherBonus(challenge: Challenge, weather: AppContext['weather']): number {
  const tags = challenge.weatherTags;
  if (!tags || tags.length === 0 || !weather) return 0;

  let bonus = 0;
  if (tags.includes('outdoor')) {
    if (weather.isRaining) return -WEATHER_OUTDOOR_RAIN_PENALTY;
    if (weather.isVeryHot) bonus -= WEATHER_MISMATCH_PENALTY;
    else if (weather.isGoodForOutdoor) bonus += WEATHER_MATCH_BONUS;
  }
  if (tags.includes('indoor') && (weather.isRaining || weather.isVeryHot || weather.isCold)) bonus += WEATHER_MATCH_BONUS;
  if (tags.includes('rain') && weather.isRaining) bonus += WEATHER_MATCH_BONUS;
  if (tags.includes('sunny') && weather.type === 'sunny') bonus += WEATHER_MATCH_BONUS;
  if (tags.includes('cold') && weather.isCold) bonus += WEATHER_MATCH_BONUS;
  if (tags.includes('hot') && weather.isVeryHot) bonus += WEATHER_MATCH_BONUS;
  if (tags.includes('comfortable') && weather.type === 'comfortable') bonus += WEATHER_MATCH_BONUS;
  return bonus;
}

function seasonBonus(challenge: Challenge, season: AppContext['season']): number {
  if (!challenge.seasonTags || challenge.seasonTags.length === 0) return 0;
  return challenge.seasonTags.includes(season) ? SEASON_MATCH_BONUS : 0;
}

/**
 * Bônus por data comemorativa — cresce quanto mais perto do dia e quanto mais
 * importante a data, mas sempre limitado a EVENT_MATCH_MAX_BONUS (seção 8: datas não
 * podem dominar o app, só priorizar ocasionalmente).
 */
function eventBonus(challenge: Challenge, event: AppContext['event']): number {
  if (!event || !challenge.eventTags || challenge.eventTags.length === 0) return 0;
  const matched = challenge.eventTags.some((tag) => event.tags.includes(tag));
  if (!matched) return 0;

  const phaseWeight = EVENT_PHASE_WEIGHT[event.phase] ?? 0;
  const importanceWeight = EVENT_IMPORTANCE_WEIGHT[event.importance] ?? 0.5;
  return Math.min(EVENT_MATCH_BASE_BONUS + EVENT_MATCH_MAX_BONUS * phaseWeight * importanceWeight, EVENT_MATCH_MAX_BONUS);
}

/** Soma o bônus de `selectPersonForChallenge`, penalizando levemente se a mesma pessoa já
 * foi escolhida em outro slot hoje — incentiva variedade entre as pessoas cadastradas
 * (ver seção 15) sem bloquear quando só existe uma pessoa daquele tipo. */
function personScoreBonus(
  challenge: Challenge,
  profile: UserProfile,
  ctx: SelectionContext,
  usedPersonIds: Map<string, number>,
): number {
  const match = selectPersonForChallenge(challenge, profile, ctx);
  if (!match) return 0;
  const usedCount = usedPersonIds.get(match.person.id) ?? 0;
  return match.bonus - usedCount * SAME_PERSON_PENALTY;
}

function momentFitBonus(challenge: Challenge, slot: DaySlot): number {
  let bonus = 0;
  if (challenge.momentos.includes(slot.momento)) bonus += 5;
  if (challenge.tiposDia.includes(slot.tipoDia)) bonus += 3;
  return bonus;
}

function categoryDiversityPenalty(challenge: Challenge, usedCategoriesToday: Map<ChallengeCategory, number>): number {
  const count = usedCategoriesToday.get(challenge.categoria) ?? 0;
  return -count * SAME_CATEGORY_PENALTY;
}

/** Desincentiva (sem bloquear) desafios 📱 quando a fatia recente já bateu o teto — mantém a surpresa. */
function socialShareBonus(challenge: Challenge, socialShare: number, cap: number): number {
  if (!challenge.socialContext) return 0;
  return socialShare >= cap ? -SOCIAL_SHARE_PENALTY : 0;
}

/**
 * Dá um pequeno empurrão a um desafio que já é elegível (por momento/dia/categoria)
 * quando ele também conecta com algo que a pessoa disse que gosta — nunca o contrário
 * (interesse nunca é filtro duro, só pontuação a mais). O comportamento real pesa mais
 * que a simples seleção no cadastro: se a pessoa ignora/recusa desafios de um interesse
 * repetidamente, `interestAffinity` cai e o bônus cai junto (ver seção 8 do pedido).
 */
function interestBonus(challenge: Challenge, profile: UserProfile, interestAffinity: Partial<Record<Interest, number>>): number {
  // `required` já passou pelo filtro duro (ver filterCandidatesForSlot) — aqui só pontua o que
  // pode variar: `preferred` (bônus soft) e `required` (também recebe bônus, é interesse de
  // verdade batendo, só que garantido em vez de opcional).
  const rules = challenge.interests;
  const candidateInterests = rules ? [...new Set([...rules.required, ...rules.preferred])] : [];
  if (candidateInterests.length === 0) {
    // Sem interesse específico, mas a pessoa ainda está descobrindo o que gosta —
    // desafios marcados como exploração recebem um pequeno empurrão (ver seção 9).
    if (profile.stillDiscoveringInterests && challenge.tags.includes(DISCOVERY_TAG)) return DISCOVERY_EXPLORATION_BONUS;
    return 0;
  }

  const known = new Set<Interest>([...profile.interests, ...profile.discoveredInterests]);
  const matched = candidateInterests.filter((interest) => known.has(interest));
  if (matched.length === 0) {
    return profile.stillDiscoveringInterests ? DISCOVERY_EXPLORATION_BONUS : 0;
  }

  let bonus = 0;
  for (const interest of matched) {
    const rate = interestAffinity[interest];
    bonus += rate == null ? INTEREST_MATCH_BASE_BONUS : INTEREST_MATCH_BASE_BONUS * (0.3 + rate * 1.1);
  }
  return Math.min(bonus, INTEREST_MATCH_MAX_BONUS);
}

/** Bônus/penalidade soft a partir da hora REAL do relógio em que o slot vai notificar, comparada
 * com `timing.preferredPeriods`/`avoidPeriods` (ver ClockPeriod) — mesmo padrão de `daytimeBonus`.
 * Nunca filtro duro: uma ação sem período preferido/evitado simplesmente não pontua aqui. */
function clockPeriodBonus(challenge: Challenge, slot: DaySlot): number {
  const timing = challenge.timing;
  if (!timing) return 0;
  const period = clockPeriodFor(slot.start.getHours());
  if (timing.avoidPeriods.includes(period)) return -CLOCK_PERIOD_PENALTY;
  if (timing.preferredPeriods.includes(period)) return CLOCK_PERIOD_BONUS;
  return 0;
}

function clockPeriodFor(hour: number): import('@/types').ClockPeriod {
  if (hour < 6) return 'early_morning';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  if (hour < 22) return 'evening';
  return 'night';
}

/** Bônus pequeno quando o desafio conecta com um sinal derivado do perfil (ver ProfileTag) que a
 * pessoa marcou como preferido — mesma filosofia de `interestBonus`, nunca filtro duro (isso já
 * é `profile.required`/`excluded`, ver filterCandidatesForSlot). */
function profilePreferredBonus(challenge: Challenge, profileTags: Set<ProfileTag>): number {
  const preferred = challenge.profile?.preferred ?? [];
  if (preferred.length === 0) return 0;
  return preferred.some((tag) => profileTags.has(tag)) ? PROFILE_PREFERRED_BONUS : 0;
}

/** Mesma ideia de `categoryDiversityPenalty`, mas por interesse já usado hoje (ver
 * ALGORITHM_RULES.maxSameInterestInSequence) — desincentiva (sem bloquear) repetir sempre o
 * mesmo interesse dentro do mesmo dia. */
function interestDiversityPenalty(challenge: Challenge, usedInterestsToday: Map<Interest, number>): number {
  const interests = flattenInterests(challenge);
  if (interests.length === 0) return 0;
  const maxUsed = Math.max(0, ...interests.map((i) => usedInterestsToday.get(i) ?? 0));
  return maxUsed >= ALGORITHM_RULES.maxSameInterestInSequence ? -SAME_INTEREST_PENALTY : 0;
}

function personMatchesChallenge(challenge: Challenge, person: ImportantPerson): boolean {
  if (!challenge.relationships?.includes(person.relationship)) return false;
  if (challenge.minAge != null && person.age != null && person.age < challenge.minAge) return false;
  if (challenge.maxAge != null && person.age != null && person.age > challenge.maxAge) return false;
  if (challenge.requiresPresence && person.livesWithUser !== true) return false;
  return true;
}

/**
 * Entre as pessoas cadastradas que batem com o desafio, escolhe qual delas priorizar —
 * favorecendo quem faz mais tempo que não aparece (ver seção 14/15: evitar que uma única
 * pessoa domine) — e calcula o bônus de pontuação, ajustado pelo comportamento real com
 * esse tipo de relação (ver seção 16/17: comportamento pesa mais que a seleção do cadastro).
 * Determinística de propósito: chamada duas vezes pro mesmo desafio (pontuação e depois
 * pra montar a instância) precisa sempre devolver a mesma pessoa.
 */
function selectPersonForChallenge(
  challenge: Challenge,
  profile: UserProfile,
  ctx: SelectionContext,
): { person: ImportantPerson; bonus: number } | null {
  if (!challenge.relationships || challenge.relationships.length === 0) return null;
  const candidates = profile.importantPeople.filter((person) => personMatchesChallenge(challenge, person));
  if (candidates.length === 0) return null;

  const ranked = candidates
    .map((person) => ({
      person,
      daysSince: ctx.personDaysSinceLastUse.get(person.id) ?? Infinity,
    }))
    .sort((a, b) => {
      const noveltyDiff = (b.daysSince === Infinity ? Number.MAX_SAFE_INTEGER : b.daysSince) - (a.daysSince === Infinity ? Number.MAX_SAFE_INTEGER : a.daysSince);
      if (noveltyDiff !== 0) return noveltyDiff;
      return a.person.id.localeCompare(b.person.id); // desempate estável
    });

  const chosen = ranked[0];
  const novelty = Math.min(chosen.daysSince === Infinity ? PERSON_NOVELTY_CAP_DAYS : chosen.daysSince, PERSON_NOVELTY_CAP_DAYS);
  let bonus = PERSON_MATCH_BASE_BONUS + novelty * PERSON_NOVELTY_WEIGHT;

  const affinity = ctx.relationshipAffinity[chosen.person.relationship];
  if (affinity != null) bonus *= 0.3 + affinity * 1.1;

  return { person: chosen.person, bonus: Math.min(bonus, PERSON_MATCH_MAX_BONUS) };
}

/** Resolve o token {pessoa} no texto do desafio — nome às vezes, frase genérica da relação
 * no resto das vezes (ver seção 13: repetir o nome toda hora soa artificial). */
function resolvePersonText(challenge: Challenge, person: ImportantPerson | null): { titulo: string; descricao?: string } {
  if (!person || !challenge.titulo.includes(PERSON_PLACEHOLDER)) {
    return { titulo: challenge.titulo, descricao: challenge.descricao };
  }
  const replacement = person.name && Math.random() < NAME_USE_PROBABILITY ? person.name : RELATIONSHIP_GENERIC_PHRASE[person.relationship];
  return {
    titulo: challenge.titulo.split(PERSON_PLACEHOLDER).join(replacement),
    descricao: challenge.descricao?.split(PERSON_PLACEHOLDER).join(replacement),
  };
}

function buildReasons(challenge: Challenge, slot: DaySlot, profile: UserProfile, ctx: SelectionContext, person: ImportantPerson | null): string[] {
  const reasons: string[] = [];

  reasons.push(`Horário adequado (momento: ${MOMENT_LABELS[slot.momento]})`);
  reasons.push(`Dia de ${DAY_TYPE_LABELS[slot.tipoDia]} compatível`);

  const daysSince = ctx.daysSinceLastUse.get(challenge.id);
  reasons.push(daysSince == null ? 'Nunca recebido antes — traz novidade' : `Sem repetição recente (${daysSince} dia(s) desde a última vez)`);

  const categoryRate = ctx.scoringContext.categoryCompletionRate[challenge.categoria];
  if (categoryRate != null) {
    reasons.push(
      categoryRate >= 0.5
        ? `Você costuma concluir ações de ${CHALLENGE_CATEGORY_LABELS[challenge.categoria]} (${Math.round(categoryRate * 100)}%)`
        : `Categoria pouco concluída até agora (${Math.round(categoryRate * 100)}%) — ainda assim foi a melhor opção disponível`,
    );
  } else {
    reasons.push(`Categoria pouco utilizada recentemente: ${CHALLENGE_CATEGORY_LABELS[challenge.categoria]}`);
  }

  const known = new Set<Interest>([...profile.interests, ...profile.discoveredInterests]);
  const matchedInterests = flattenInterests(challenge).filter((interest) => known.has(interest));
  if (matchedInterests.length > 0) {
    reasons.push(`Interesse compatível: ${matchedInterests.map((interest) => INTEREST_LABELS[interest]).join(', ')}`);
  } else if (profile.stillDiscoveringInterests && challenge.tags.includes(DISCOVERY_TAG)) {
    reasons.push('Ação de exploração — você ainda está descobrindo seus interesses');
  }

  if (ctx.scoringContext.bestRatedChallengeIds.has(challenge.id)) {
    reasons.push('Você reagiu bem a essa ação em ocasiões anteriores');
  }

  const ignoreCount = ctx.scoringContext.recentIgnoreCounts.get(challenge.id) ?? 0;
  if (ignoreCount === 0) reasons.push('Não houve recusa recente a essa ação');

  if (person) {
    // Propositalmente sem o nome aqui (só a relação) — a razão é sobre a lógica do
    // motor, não uma vitrine de dado pessoal (ver seção 19: privacidade no modo dev).
    reasons.push(`Pessoa cadastrada compatível: ${RELATIONSHIP_LABELS[person.relationship]}`);
    if (person.age != null) reasons.push(`${RELATIONSHIP_LABELS[person.relationship]} tem ${person.age} anos`);
    if (person.livesWithUser === true) reasons.push(`${RELATIONSHIP_LABELS[person.relationship]} mora com você`);
    else if (person.livesWithUser === false) reasons.push(`${RELATIONSHIP_LABELS[person.relationship]} não mora com você`);
    const affinity = ctx.relationshipAffinity[person.relationship];
    if (affinity != null && affinity >= 0.5) {
      reasons.push(`Alta afinidade com ações ligadas a ${RELATIONSHIP_LABELS[person.relationship].toLowerCase()}`);
    }
    const personDaysSince = ctx.personDaysSinceLastUse.get(person.id);
    reasons.push(
      personDaysSince == null
        ? `Nenhuma ação anterior ligada a essa pessoa`
        : `Última ação ligada a essa pessoa: ${personDaysSince} dia(s) atrás`,
    );
  }

  const weather = ctx.context.weather;
  if (weather && challenge.weatherTags && challenge.weatherTags.length > 0) {
    reasons.push(`Clima considerado: ${WEATHER_TYPE_LABELS[weather.type]} (${Math.round(weather.temperature)}°C)`);
  }

  if (challenge.seasonTags?.includes(ctx.context.season)) {
    reasons.push(`Combina com a estação atual: ${SEASON_LABELS[ctx.context.season]}`);
  }

  const event = ctx.context.event;
  if (event && challenge.eventTags?.some((tag) => event.tags.includes(tag))) {
    const eventReason =
      event.phase === 'today'
        ? `Hoje é ${event.name}`
        : event.phase === 'after'
          ? `${event.name} foi há ${Math.abs(event.daysUntil)} dia(s)`
          : `${event.name} está chegando (${event.daysUntil} dia(s))`;
    reasons.push(eventReason);
  }

  return reasons;
}

const MOMENT_LABELS: Record<DaySlot['momento'], string> = {
  inicio_dia: 'início do dia',
  durante_dia: 'durante o dia',
  transicao: 'transição pós-trabalho',
  fim_dia: 'fim do dia',
  antes_dormir: 'antes de dormir',
  qualquer: 'qualquer momento',
};

const DAY_TYPE_LABELS: Record<DaySlot['tipoDia'], string> = {
  trabalho: 'trabalho',
  folga: 'folga',
  qualquer: 'qualquer tipo de dia',
};

export function buildInstance(
  challenge: Challenge,
  scheduledFor: Date,
  date: string,
  person: ImportantPerson | null = null,
): ChallengeInstance {
  const { titulo, descricao } = resolvePersonText(challenge, person);
  return {
    id: generateId('inst'),
    challengeId: challenge.id,
    categoria: challenge.categoria,
    titulo,
    descricao,
    tempoEstimado: resolveTempoEstimado(challenge),
    interests: flattenInterests(challenge),
    relatedPersonId: person?.id ?? null,
    date,
    scheduledFor: scheduledFor.toISOString(),
    // Histórico orientado a eventos (ver plano de migração seção 1/4) — só `deliveredAt` é
    // populado, no momento em que a instância é criada/entregue. Os outros três ficam presentes
    // na estrutura, não escritos/lidos ainda.
    deliveredAt: scheduledFor.toISOString(),
    completedAt: null,
    dismissedAt: null,
    skippedAt: null,
    timeToCompleteMs: null,
    notificationId: null,
    // challenge normalmente já vem de allChallenges (timing bakeado, ver src/data/challenges/
    // index.ts) — getChallengeTiming como reforço cobre qualquer Challenge construído à mão fora
    // desse pipeline que não tenha passado por lá.
    timing: challenge.timing ?? { mode: getChallengeTiming(challenge), preferredPeriods: [], avoidPeriods: [] },
    // Ausente na base curada = 'acao' (default seguro, ver tipo Challenge.type).
    type: challenge.type ?? 'acao',
    // Sistema de dificuldade adaptativa DESATIVADO (ver comentário em Challenge.concept) — campos
    // copiados só por compat, sem efeito prático hoje.
    conceptGroup: challenge.conceptGroup,
    progressionGroup: challenge.progressionGroup,
    difficulty: challenge.difficulty,
  };
}

/** Dias desde a última vez que cada desafio apareceu (qualquer instância entregue). Ausente =
 * nunca apareceu. */
function computeDaysSinceLastUse(history: ChallengeInstance[], today: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const instance of history) {
    const days = daysBetween(instance.date, today);
    const existing = map.get(instance.challengeId);
    if (existing == null || days < existing) {
      map.set(instance.challengeId, days);
    }
  }
  return map;
}

/** Igual a computeDaysSinceLastUse, mas por `conceptGroup` em vez de `challengeId` — alimenta o
 * cooldown de similaridade semântica (ver ALGORITHM_RULES.conceptCooldownDays). Só considera
 * instâncias cujo desafio original ainda existe no catálogo e tem conceptGroup preenchido. */
function computeConceptDaysSinceLastUse(history: ChallengeInstance[], today: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const instance of history) {
    const conceptGroup = instance.conceptGroup ?? challengeById[instance.challengeId]?.conceptGroup;
    if (!conceptGroup) continue;
    const days = daysBetween(instance.date, today);
    const existing = map.get(conceptGroup);
    if (existing == null || days < existing) {
      map.set(conceptGroup, days);
    }
  }
  return map;
}

// Sem conclusão/reação (ver plano de migração seção 4), não há mais sinal de "foi ignorado" ou
// "recusado" no histórico — as 4 funções abaixo (ignoreCounts/categoryRates/bestRatedIds/
// interestAffinity/relationshipAffinity) ficam com pontuação mecânica mínima (sempre vazias) até
// o produto decidir um novo sinal de qualidade. `scoreChallenge` (scoring.ts) trata mapas/sets
// vazios como "sem dado", que já é o comportamento neutro de sempre.
function computeRecentIgnoreCounts(): Map<string, number> {
  return new Map();
}

/** Fatia de desafios 📱 recebidos nos últimos `days` dias (qualquer status) — usada pra manter a surpresa. */
function computeRecentSocialShare(history: ChallengeInstance[], today: string, days: number): number {
  let total = 0;
  let social = 0;
  for (const instance of history) {
    if (daysBetween(instance.date, today) > days) continue;
    total += 1;
    if (challengeById[instance.challengeId]?.socialContext) social += 1;
  }
  return total > 0 ? social / total : 0;
}

function computeCategoryCompletionRates(): Partial<Record<ChallengeCategory, number>> {
  return {};
}

function computeInterestCompletionRates(): Partial<Record<Interest, number>> {
  return {};
}

/** Dias desde o último desafio ligado a cada pessoa (qualquer status). Ausente = nunca. */
function computePersonDaysSinceLastUse(history: ChallengeInstance[], today: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const instance of history) {
    if (!instance.relatedPersonId) continue;
    const days = daysBetween(instance.date, today);
    const existing = map.get(instance.relatedPersonId);
    if (existing == null || days < existing) {
      map.set(instance.relatedPersonId, days);
    }
  }
  return map;
}

function computeRelationshipCompletionRates(): Partial<Record<RelationshipType, number>> {
  return {};
}

function computeBestRatedIds(): Set<string> {
  return new Set();
}

function timeOfDayBonus(challenge: Challenge, slot: DaySlot): number {
  if (challenge.horariosIdeais.includes('qualquer')) return 0;
  const hour = slot.start.getHours();
  const currentSlot = hour < 12 ? 'manha' : hour < 18 ? 'tarde' : 'noite';
  return challenge.horariosIdeais.includes(currentSlot) ? 8 : -5;
}

const LEVEL_RANK: Record<ChallengeLevel, number> = { facil: 0, medio: 1, desafiador: 2 };
const INTENSITY_RANK: Record<ChallengeIntensity, number> = { leve: 0, equilibrado: 1, desafiador: 2 };

/** Aproxima o nível do desafio (fácil/médio/desafiador) da intensidade que o usuário pediu no cadastro. */
function intensityBonus(challenge: Challenge, intensity: ChallengeIntensity): number {
  const diff = Math.abs(LEVEL_RANK[resolveNivel(challenge)] - INTENSITY_RANK[intensity]);
  if (diff === 0) return 8;
  if (diff === 1) return 0;
  return -8;
}
