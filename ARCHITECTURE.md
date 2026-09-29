# Daliz — Arquitetura

App de micro-ações diárias: todo dia a pessoa recebe algumas ações pequenas e
contextualizadas (baseadas em rotina, clima, pessoas importantes, interesses, datas
comemorativas) que ajudam a "ser um pouco melhor que ontem". Sem rede social, sem feed,
sem gamificação pesada — o produto é a notificação certa, na hora certa, com o texto certo.

> Convenção usada neste documento: nomes de campo/tipo em português (ex: `titulo`,
> `categoria`, `momentos`) refletem literalmente o código — não são erros de tradução.

> **Rebranding "Melhor que Ontem" → "Daliz":** o nome exibido, o mark visual e os textos
> mudaram, mas os **identificadores técnicos ficaram intactos de propósito** — decisão
> explícita pra não invalidar Firebase/AdMob/EAS já configurados e testados: bundle
> id/package `com.melhorqueontem.app`, projeto Firebase `melhorqueontem-83e95`, `slug`
> do Expo/EAS `melhorqueontem`, projeto EAS `@jaraujodevelopers-team/melhorqueontem`.
> `APP_NAME`/`APP_TAGLINE` (`src/constants/app.ts`) são a fonte única do nome/tagline
> exibidos — usar essas constantes em vez de escrever o nome na mão em texto novo.

## Stack

- **Expo SDK 54** (managed workflow) + **TypeScript** + **Expo Router** (`app/`, file-based)
- **React 19** / **React Native 0.81** (New Architecture ativada — `newArchEnabled: true`)
- **AsyncStorage** — único armazenamento, 100% local, sem backend/nuvem
- **expo-notifications** — notificações locais agendadas (nunca push remoto)
- **expo-location** + **Open-Meteo** (API gratuita, sem key) — clima/estação por GPS
- **Firebase Analytics + Crashlytics** (`@react-native-firebase/*`) — métricas de uso e
  relatório de crash
- **AdMob** (`react-native-google-mobile-ads`) — banner fixo acima das tabs
- **EAS Build/Update** — geração de APK/AAB nativo e OTA updates

Antes de mexer em qualquer API do Expo, ver [AGENTS.md](AGENTS.md) — a versão instalada
muda com frequência e a doc "genérica" do Expo costuma estar desatualizada com o projeto.

## Como rodar

```bash
npm install
npx expo start          # abre no Expo Go / preview web — ver "Limite do Expo Go" abaixo
```

Modo Dev tem duas telas, separadas porque cada uma serve um propósito diferente (juntas numa
tela só ficavam compridas demais pra escanear):

- **`/dev/schedule-preview`** ("Prévia do cadastro") — editar um perfil de teste ao vivo e ver a
  lista completa de ações/horários que o motor real enviaria naquele dia (sem pontuação/
  alternativas — só o resultado final), escolher qualquer dia futuro pra simular (ver
  `computeSchedulePreviewForDate` em `src/dev/schedulePreview.ts`, que gera cada dia entre hoje e
  o escolhido em memória, encadeando o histórico, pra respeitar cooldown/repetição igual o app
  faria de verdade), e ajustar o relógio simulado (atalho pra `/dev/clock`).
- **`/dev/notification-tester`** ("Testar notificações") — dispara a notificação real de uma
  ação específica do catálogo por categoria pro perfil salvo (não o rascunho da tela acima), e
  limpa a lista "Suas ações de hoje" da Home pra testar várias seguidas sem acumular cards.

Acessível só em `__DEV__` via 7 toques num ponto específico da tela de perfil (ver
`src/dev/DevTapTrigger.tsx`), que leva pra `/dev/schedule-preview`. Nunca compila em produção —
guard em `app/dev/_layout.tsx`.

## Limite do Expo Go — módulos nativos "preparados, mas inertes"

O projeto tem módulos nativos que **não existem no Expo Go nem no preview web**
(Firebase, AdMob) — só funcionam depois de `expo prebuild`/build nativo (EAS). Como o
desenvolvimento contínua em Expo Go até o build final, todo código que toca esses módulos
segue um padrão: `require()` feito sob demanda (nunca `import` estático), **pulado
inteiramente no Expo Go** (checagem via `expo-constants`), e só então protegido por
`try/catch` como segunda camada pra qualquer outro cenário sem o módulo nativo (web).

```ts
// src/services/analyticsService.ts / crashService.ts — mesmo padrão nos dois
import Constants, { ExecutionEnvironment } from 'expo-constants';
const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let cached: X | null | undefined;
function getInstance() {
  if (cached !== undefined) return cached;
  if (IS_EXPO_GO) { cached = null; return null; } // nunca tenta o require aqui — ver por quê abaixo
  try {
    const mod = require('@react-native-firebase/analytics');
    cached = mod.getAnalytics();
  } catch {
    cached = null; // web (ou qualquer outro cenário sem o nativo) — vira no-op
  }
  return cached ?? null;
}
```

**Por que só `try/catch` não basta:** o Metro reporta como **erro fatal global** qualquer
módulo que falhe na sua primeira avaliação (`guardedLoadModule`) — isso acontece mesmo com
o `require()` dentro de um `try/catch`, porque o report é disparado pelo próprio mecanismo
de carregamento de módulo do Metro, não pela exceção JS que o `try/catch` intercepta. Bug
real já visto em produção: `require('@react-native-firebase/analytics')` no Expo Go
derrubava o app com `Native module NativeRNFBTurboApp is not registered`, apesar do
`try/catch` — silencioso no preview web (onde esse mecanismo do Metro não se aplica), só
aparecia rodando de verdade no Expo Go. Por isso o `require` nem é tentado ali.

Isso permite continuar testando em Expo Go a qualquer momento (ver [AGENTS.md](AGENTS.md))
sem nenhum call site precisar saber se está rodando em dev ou produção. O AdMob real
(`src/components/AdBannerNative.tsx`) segue uma variante mais estrita: fica num arquivo
**nunca importado** por nenhuma tela até o momento de trocar pelo placeholder
(`AdBanner.tsx`) na hora do build final — ver comentário em `TabBar.tsx`.

## Estrutura de pastas

```
app/                              # Expo Router — cada arquivo é uma rota
  _layout.tsx                     # Root layout: fontes, ErrorBoundary, tema, tracking de tela
  index.tsx                       # Decide onboarding vs app principal vs primeira-ação pendente
  onboarding/
    welcome.tsx                   # 1. boas-vindas
    concept.tsx                   # 2. as 3 funcionalidades principais
    profile.tsx                   # 3. cadastro (wizard de 9 passos numa única rota)
    notifications.tsx             # 4. pedido de permissão de notificação
    first-action.tsx              # 5. "Receber minha primeira ação" (ver Conceito: Primeira Ação)
  (main)/
    _layout.tsx
    (tabs)/
      home.tsx                    # tela principal — ações do dia
      history.tsx                 # histórico por dia
      insights.tsx                # gráficos/estatísticas agregadas
      profile.tsx                 # perfil resumido (link pra editar)
    edit-profile.tsx              # reaproveita os blocos do onboarding/profile.tsx
    settings.tsx
    privacy-policy.tsx
  dev/                            # Modo Dev — 100% fora do build de produção
    schedule-preview.tsx          # "Prévia do cadastro" (ver seção acima)
    notification-tester.tsx       # "Testar notificações" (ver seção acima)
    clock.tsx                     # ajustar o relógio simulado
    clock.tsx                     # relógio simulado, aberto a partir da tela acima

src/
  components/
    ChallengeCard/                # card de ação — o componente mais usado do app
      ChallengeCard.tsx
      ReactionPicker.tsx          # "como você se sentiu?" — opcional, a qualquer momento (sem Concluir/Não consegui)
      ReminderPicker.tsx          # "lembrar mais tarde"
      NoteField.tsx               # campo de anotação (ações que pedem escrita)
      MovieGenrePicker.tsx        # suporte de ação: escolher gênero de filme
      ActionSupport.tsx           # botões de assistência (Spotify/Maps/busca/filmes)
    history/DayCard.tsx
    insights/                     # gráficos (categoria, semana, hora, sequência)
    ui/                           # AppText, Button, Chip, TextField, DateField, TimeField,
                                   # SelectableCard, Screen — design system mínimo
    brand/                        # logo, wordmark
    CollapsibleSection.tsx        # usado pros blocos "Concluídas"/"Não realizadas" na Home
    CurrentWeatherWidget.tsx
    CurrentLocationField.tsx      # GPS-only, sem busca por nome de cidade
    ImportantPeopleEditor.tsx
    ShareableMomentCard.tsx       # "momentos que valem compartilhar"
    FirstActionCompletedScreen.tsx
    AdBanner.tsx                  # placeholder visual (ativo hoje)
    AdBannerNative.tsx            # banner real do AdMob (pronto, não importado ainda)
    ErrorBoundary.tsx             # ver "Conceito: ErrorBoundary" abaixo

  engine/                         # lógica pura de seleção — sem I/O, fácil de testar
    ChallengeEngine.ts            # selectDailyChallenges, explainNextChallenge, buildInstance
    dayModel.ts                   # computeDaySlots — janelas do dia a partir da rotina
    scheduling.ts                 # distribuição de horários dentro de um slot
    scoring.ts                    # pontuação de candidatos (cooldown, ausência, etc.)
    challengeTiming.ts            # classifica now/today/contextual (ver Conceito: Timing)
    progression.ts                # regras da dificuldade adaptativa (ver Conceito: Progressão)

  services/                       # orquestração — chamam repositories + engine
    dayCycleService.ts            # gera/expira ações (ver Conceito: Geração contínua de ações)
    challengeActionsService.ts    # concluir/abandonar/salvar nota/resetar uma instância
    profileService.ts             # CRUD de perfil + marcos do fluxo de primeira ação
    notificationService.ts        # agenda/cancela notificações locais
    reminderService.ts            # "lembrar mais tarde"
    contextService.ts             # monta o AppContext do dia (clima+estação+evento+pessoa)
    weatherService.ts / weatherModel.ts
    holidayService.ts             # datas comemorativas (ver src/data/holidays)
    currentLocationService.ts     # GPS + reverse geocoding (BigDataCloud)
    progressionService.ts         # grava desempenho, decide quando propor o próximo nível
    progressResetService.ts
    journalService.ts             # resumo/diário do dia
    weeklyRecapService.ts         # notificação semanal "o que você melhorou"
    onboardingDraft.ts            # estado transitório do wizard de cadastro
    analyticsService.ts           # ver "Módulos nativos" acima
    crashService.ts               # ver "Módulos nativos" acima

  storage/
    storageClient.ts              # wrapper fino sobre AsyncStorage
    keys.ts                       # todas as chaves de storage centralizadas
    repositories/                 # 1 repo por entidade — único lugar que fala com storageClient
      profileRepository.ts        # inclui normalizeProfile (defaults pra campos legados)
      challengeInstanceRepository.ts
      dayRepository.ts
      journalRepository.ts
      preferencesRepository.ts
      actionPerformanceRepository.ts
      weatherRepository.ts        # cache de 30 min

  data/
    challenges/                   # ~2000 desafios estáticos, por categoria/contexto
      index.ts                    # agrega tudo, calcula timing, expõe challengeById
      development.ts, relationships.ts, family.ts, work.ts, health.ts, finance.ts,
      learning.ts, community.ts, faith.ts, childrenChallenges.ts, parentsChallenges.ts,
      partnerChallenges.ts, friendsChallenges.ts, familyExpansion.ts, personCombos.ts,
      interestCombos.ts, eventCombos.ts, holidayExpansion.ts,
      sunnyChallenges.ts / rainChallenges.ts / stormChallenges.ts / coldChallenges.ts /
      hotChallenges.ts / pleasantWeatherChallenges.ts,   # clima
      indoorChallenges.ts / outdoorChallenges.ts, seasonChallenges.ts
    holidays/brazil.ts            # datas comemorativas + tags
    firstActionChallenge.ts       # ação fixa da tela de primeira ação (fora do catálogo)
    motivationalPhrases.ts, encouragementMessages.ts, weatherPhrases.ts,
    shareableMomentCopy.ts, movieGenres.ts

  types/                          # só tipos + labels/constantes derivadas — sem lógica
    profile.ts, challenge.ts, challengeInstance.ts, context.ts, importantPeople.ts,
    interests.ts, location.ts, holiday.ts, journal.ts, preferences.ts, progression.ts,
    stats.ts, weather.ts, index.ts (barrel)

  dev/                            # infra do Modo Dev (não confundir com app/dev/*)
    devService.ts                 # dispara notificação de uma ação específica (reaproveita services/repos reais)
    devClock.ts                   # relógio "falso" — getCurrentDate() lê daqui se setado
    schedulePreview.ts            # motor real rodado sobre um perfil em edição, sem persistir
    onboardingAutofill.ts, DevUI.tsx, DevTapTrigger.tsx

  theme/                          # ThemeContext, palette (light/dark), tokens de tipografia
  utils/                          # date.ts, time.ts, id.ts, now.ts (getCurrentDate), season.ts

scripts/                          # scripts Node de geração/QA da base de desafios + marca
  generate-challenges.js, generate-challenge-expansion.js, sync-challenges-v2.js,
  challengeHeuristics.js (heurísticas compartilhadas), check-duplicates.js,
  check-timing-rules.js             # roda depois de adicionar/editar desafios, ver abaixo
  classify-action-support.js, tag-interests.js, tag-relationships.js, tag-weather.js,
  list-all-challenges.js
  generate-daliz-brand.js           # ver "Identidade visual" abaixo
```

### QA de conteúdo — `node scripts/check-timing-rules.js`

Roda em segundos sobre o catálogo inteiro (regex sobre o código-fonte, mesmo padrão de
`check-duplicates.js` — não precisa compilar TS) e pega a classe de bug "notificação chegou
na hora errada" antes de virar reclamação real. Rodar sempre que adicionar ou editar desafios.
Três checagens:

1. **Texto promete um momento específico, `momentos` não restringe** — ex: título começa com
   "Termine o dia..." mas `momentos: ['qualquer']`, então o motor podia mandar isso às 10h da
   manhã. Achado real: 6 desafios de variante climática/estação ("Termine um dia de chuva/frio/
   sol/inverno/agradável/dentro de casa...") tinham exatamente esse problema — corrigidos pra
   `momentos: ['fim_dia', 'antes_dormir']`.
2. **`familia_presenca` sem nenhum sinal de bloqueio pro expediente/trajeto** — todo desafio
   dessa categoria precisa ter `requerFamilia`, `relationships`, `requerTempoLivre` ou
   `contexto: ['em_casa']`, senão pode ser escolhido durante o trabalho.
3. **Duração ≥15min sem `requerTempoLivre`** — dificilmente cabe num intervalo curto de
   trabalho/trajeto sem esse sinal.

Ver `ChallengeEngine.filterCandidatesForSlot` pra como esses sinais são lidos de fato (seção
abaixo) — o script confere se o DADO está consistente com o que o MOTOR espera, não duplica a
lógica de seleção.

## Modelos de dados (resumo)

- **`Challenge`** (`src/types/challenge.ts`) — definição estática de uma ação (vem de
  `data/challenges/*`). Campos-chave: `categoria`, `tipo`, `nivel`, `tempoEstimado`,
  `momentos`/`tiposDia` (filtros duros de quando pode aparecer), `contexto` (filtro duro só
  pro lado `'em_casa'` — o lado `'no_trabalho'` existe no tipo mas não é lido, dados
  inconsistentes demais pra confiar como exigência, ver `check-timing-rules.js`),
  `requerFamilia`/`requerTempoLivre` (filtros duros que tiram o desafio do expediente e do
  trajeto logo depois, momento `transicao` — ver `WORK_SAFE_CATEGORIES`/
  `isWorkOrCommuteSlot` em `ChallengeEngine.filterCandidatesForSlot`),
  `workHoursContexts` (o inverso: LIBERA o desafio no expediente mesmo com `categoria` fora de
  `WORK_SAFE_CATEGORIES`, só pra quem tem aquele `UserProfile.workContext` — ver
  `src/services/occupationService.ts`, que deriva o contexto de trabalho da profissão
  escolhida no `OccupationPicker`, nunca perguntado à parte. Deliberadamente fora de
  `profile.required`: só vale dentro do slot de expediente, não restringe o desafio no resto
  do dia pra quem não tem esse contexto),
  `weatherTags`/`seasonTags`/`eventTags` (bônus de contexto, não filtro),
  `relationships` (filtro duro — só aparece se a pessoa tem esse tipo de relação
  cadastrado, e também tira o desafio do expediente/trajeto: nenhum tipo de relação é "colega
  de trabalho"), `interests` (bônus), `timing`, `supportType`, campos de progressão.
- **`ChallengeInstance`** (`src/types/challengeInstance.ts`) — um `Challenge` atribuído a
  um dia/horário específico, com todo o ciclo de vida: `pendente → concluido |
  nao_concluido → ignorado` (se sobrar pendente depois do horário de dormir, ver Conceito:
  Geração contínua de ações). Congela cópias de campos do Challenge original (`timing`,
  `concept`, `difficulty`) — histórico não muda se o catálogo mudar depois.
- **`UserProfile`** (`src/types/profile.ts`) — cadastro completo: rotina (acordar/dormir/
  trabalho), categorias escolhidas, intensidade, interesses, pessoas importantes,
  localização, preferências de rede social, estado do fluxo de primeira ação, `occupation` +
  `workContext` (profissão escolhida no `OccupationPicker` e o contexto de trabalho derivado
  dela — ver `Challenge.workHoursContexts` acima).
- **`ImportantPerson`** (`src/types/importantPeople.ts`) — nome opcional, tipo de relação,
  idade opcional, data de nascimento opcional, se mora com o usuário.
- **`AppContext`** (`src/types/context.ts`) — clima, estação, evento/data comemorativa do
  dia, montado uma vez por dia por `contextService.buildTodayContext`.

## Armazenamento local

Tudo em AsyncStorage via `StorageClient` (get/set/remove) + um repositório por entidade
(`src/storage/repositories/*`) — nenhum outro código do app fala com AsyncStorage
diretamente. Chaves centralizadas em `src/storage/keys.ts`:

| Chave | Conteúdo |
|---|---|
| `profile` | `UserProfile` |
| `challengeInstances` | `Record<id, ChallengeInstance>` |
| `preferences` | tema, etc. |
| `journal` | resumo/diário por dia |
| `actionPerformance` | desempenho por `concept` (sistema de progressão) |
| `weatherCache` | cache de 30 min do clima |

**Padrão de campo legado:** campos novos em tipos existentes são sempre opcionais, e a
migração acontece de duas formas conforme o caso — `profileRepository.normalizeProfile`
aplica default na leitura (para campos que todo perfil deveria ter um valor sensato), ou o
código consumidor trata a ausência com `?? default` no ponto de uso (para campos onde
"nunca existiu" é um valor válido, ex: `ChallengeInstance.note`). Nunca existe um sistema
de migração à parte rodando em batch.

## `getCurrentDate()` — abstração central de tempo

Todo o app lê a hora atual via `src/utils/now.ts#getCurrentDate()`, nunca `new Date()`
direto. Em `__DEV__`, se o Modo Dev tiver um relógio simulado ativo
(`src/dev/devClock.ts`), essa função devolve a hora simulada — é isso que permite testar
"o que acontece à noite"/"amanhã de manhã" sem esperar o relógio de verdade.

---

# Conceitos

## Geração contínua de ações (`dayCycleService.ensureUpcomingActions`)

Não existe nenhum registro de "ciclo do dia" que abre e fecha — de propósito: cada pessoa
tem uma noção de "dia" diferente (quem trabalha de madrugada e dorme de manhã não vira o
dia à meia-noite feito todo mundo), e um registro único que precisa ser aberto/fechado no
momento certo pra cada perfil era fonte de bugs. Em vez disso, tudo é derivado do próprio
dado, sem estado à parte:

- **"Que data é a ativa agora"** (`resolveActiveDate`, função pura de `profile`/`now`,
  sem storage): normalmente hoje (`logicalDateFor(now)`); só é ontem se `now` ainda está
  antes do horário de dormir de ontem (`dayModel.sleepDeadlineFor`) — cobre rotina que
  atravessa a meia-noite.
- **"Gerar ou reaproveitar"**: idempotente por dado — se já existem instâncias salvas pra
  a data ativa, reaproveita; senão gera um lote novo (mesmo pipeline de sempre:
  `syncRegisteredLocationForToday`, monta `AppContext`, `ChallengeEngine.selectDailyChallenges`,
  agenda notificações, agenda lembrete de reflexão, checa recap semanal).
- **Expiração de pendências** (`expireStalePending`, chamada a cada `ensureUpcomingActions`):
  varre por instâncias `pendente` de qualquer data diferente da ativa cujo horário de
  dormir já passou (`sleepDeadlineFor`) e marca como `ignorado` — sem precisar de nenhum
  registro que diga "isso foi fechado". Cobre também quem some por vários dias (varre tudo
  de uma vez).

`ensureUpcomingActions` é chamado toda vez que a Home carrega — silencioso quando não há
nada novo a fazer.

## Motor de seleção (`ChallengeEngine.selectDailyChallenges`)

1. **`dayModel.computeDaySlots`** corta o dia em janelas (`início do dia`, `durante o
   dia`, `transição`, `fim do dia`, `antes de dormir`) a partir de acordar/trabalho/dormir
   do perfil — pula o expediente inteiro se `receiveDuringWorkHours` for `false`.
2. Cada slot recebe uma **capacidade** (quantas ações cabem, respeitando um espaçamento
   mínimo entre notificações) e a quantidade real por slot é sorteada dentro da faixa da
   intensidade escolhida (`leve` 3–6/dia, `equilibrado` 5–7/dia, `desafiador` 7–10/dia) —
   mais de uma ação pode cair no mesmo slot, espaçadas dentro da própria janela.
3. Para cada tentativa, filtra candidatos por filtros duros (categoria selecionada,
   momento/tipo de dia/contexto do slot, relação com pessoa se aplicável, cooldown por
   `challengeId`, orçamento de minutos do dia) e pontua os que sobraram (`scoring.ts`):
   afinidade por interesse, bônus de clima/estação/evento, penalidade por categoria
   repetida no mesmo dia, bônus de ausência (não aparece há muito tempo).
4. `buildInstance` congela o `Challenge` escolhido numa `ChallengeInstance` real.

`explainNextChallenge` reaproveita o mesmo pipeline pra alimentar o "Modo Dev → Testar
seleção", mostrando o raciocínio passo a passo sem gerar uma instância de verdade.

## Timing: now / today / contextual

Toda ação tem um `timing` (explícito no `Challenge.timing` ou resolvido por heurística de
texto em `classifyTiming`, `src/engine/challengeTiming.ts`) — não é prioridade, é "quando
faz sentido fazer":

- **`now`** — pausas/autorregulação, só faz sentido no momento da notificação. Único
  timing que pode ficar "Atrasado" na Home (calculado, nunca persistido em `status`).
  Some da tela quando outra ação vira a atual — mas continua no Histórico.
- **`today`** — qualquer hora até o fim do dia. Fica na lista de "Suas ações de hoje" da
  Home, mais recente primeiro, junto de todas as outras já entregues no dia.
- **`contextual`** — espera uma situação específica ("quando perceber que...") — pode
  nem acontecer no dia. Mesmo tratamento visual de `today`.

Ao passar do horário de dormir (`dayCycleService.expireStalePending`), pendentes de
qualquer timing viram `ignorado` — não existe um mecanismo de expiração separado.

## Primeira ação (`app/onboarding/first-action.tsx` + `dayCycleService.requestFirstAction`)

Problema resolvido: terminar o cadastro e cair numa Home vazia (nenhuma ação ainda
`scheduledFor <= agora`) não dá nenhum contato real com o motor. Fluxo:

1. Tela dedicada com botão "Receber minha primeira ação".
2. `requestFirstAction` gera o dia inteiro normalmente (mesmo motor), com um bônus de
   pontuação (`biasFirstSlotToEasy`) que inclina — nunca força — a primeira ação pra algo
   fácil e rápido.
3. Dispara a notificação de verdade na hora (`notificationService.sendNow`), se permitido.
4. Marca `profile.firstActionState = 'available'` — Home mostra essa instância em
   destaque até a pessoa resolver.
5. Ao concluir/abandonar essa instância, `FirstActionCompletedScreen` explica (sem revelar
   horário nem conteúdo) quando a próxima ação chega.

`app/index.tsx` redireciona pra essa tela sempre que `firstActionState === 'not_requested'`
— cobre o caso de fechar o app entre o cadastro e o toque no botão. Perfis salvos antes
dessa feature existir são normalizados como `'completed'` (nunca redirecionados por engano).

## Progressão adaptativa (`progressionService.ts` + `engine/progression.ts`)

Só um grupo pequeno de ações (`Challenge.progressive: true`) participa. Cada uma pertence
a um `progressionGroup` (cadeia, ex: `squat_repeticoes`) com uma `difficulty` (1–5) e um
`ProgressionType` (`repetitions` | `duration` | `complexity` | `frequency` | `depth`).
`actionPerformanceRepository` guarda, por `concept`, a dificuldade atual e um contador de
conclusões consecutivas nesse nível; ao atingir o limiar, o motor passa a oferecer o
`nextActionId` da cadeia. Completar um nível novo reinicia a contagem — não pula vários
níveis de uma vez.

## Contexto: clima, estação, datas comemorativas, pessoas

`contextService.buildTodayContext` roda uma vez por dia e alimenta o motor com:

- **Clima** — `weatherService` (Open-Meteo, sem key) + `weatherModel.ts` classificam em
  tags (`WeatherTag`: chuva, sol, frio, calor, agradável) usadas como bônus/leve penalidade
  em ações outdoor (nunca esconde a ação por completo, só reduz prioridade).
- **Estação** — calculada localmente (`src/utils/season.ts`), sem API.
- **Datas comemorativas** — `holidayService` + `src/data/holidays/brazil.ts`; ações com
  `contentLevel: 'event_specific'` só entram dentro da janela da data.
- **Pessoas importantes** — ações com `relationships` só entram se a pessoa tem alguém
  daquele tipo cadastrado (filtro duro); o motor evita repetir a mesma pessoa toda hora.

## Redes sociais — filosofia

Não é "use menos o celular", é "faça algo melhor com o tempo que você já passa nele"
(`SocialActionType`: conectar / reconhecer / incentivar / usar melhor). Duas perguntas no
cadastro decidem a fatia desse conteúdo: `socialMediaUsage` (frequência) e
`socialChallengesInterest` (o sinal que realmente importa — quem marca "prefiro que não"
nunca recebe esse tipo de ação, mesmo usando redes o dia todo).

## Assistência de ação (`ActionSupportType` + `ActionSupport.tsx`)

Camada opcional e deliberadamente separada de `timing`: responde "como ajudar a executar
essa ação?", não "quando". Hoje: `search` (Google), `maps` (tipo de lugar), `spotify`
(abre com busca pronta), `categories` (ex: filmes por gênero no AdoroCinema). Preenchido
na autoria só quando remove uma dificuldade real — a maioria do catálogo não tem nenhum.

## Notificações locais

Só locais (`expo-notifications`), nunca push remoto — não existe backend pra disparar.
`notificationService` agenda uma por instância no momento da geração do dia, cancela ao
concluir/abandonar, e trata falha de agendamento sem derrubar o fluxo (a ação continua
existindo e visível na tela mesmo se a notificação falhar). Título muda por `timing`
(`TIMING_NOTIFICATION_PREFIX`), corpo é sempre o texto real da ação.

## ErrorBoundary + Crashlytics

`app/_layout.tsx` envolve o app inteiro num `ErrorBoundary` (`src/components/
ErrorBoundary.tsx`) — sem isso, qualquer erro de render não tratado derruba o app pra uma
tela branca sem nenhum relato. Regra importante, já violada e corrigida uma vez: **o
fallback do ErrorBoundary não pode depender de nenhum contexto React** (`useTheme`,
etc.), porque o `ErrorBoundary` fica fora do `ThemeProvider` na árvore — quando o
fallback substitui `children`, o `ThemeProvider` some junto. O fallback usa só
`Text`/`Pressable` puros do React Native com cores hardcoded. Um handler global
(`ErrorUtils.setGlobalHandler`) complementa cobrindo erros fora do ciclo de render
(promise sem `.catch`, listener de evento). Ambos reportam via `crashService.recordError`.

## Analytics — eventos e propriedades

`analyticsService.log(evento, params)` é o ponto único de log (ver "Módulos nativos"
acima). Screen view é automático (hook em `app/_layout.tsx`, via `usePathname`). Eventos
customizados hoje: `onboarding_step_viewed`, `onboarding_completed`,
`first_action_generated`, `action_completed`, `action_not_completed`,
`action_difficulty_increased`, `action_progression_detected`,
`action_reminder_requested`/`scheduled`, `banner_ad_loaded`/`clicked`/`failed`.
Propriedades de usuário persistentes (`challenge_intensity`, `notifications_enabled`,
`is_working`, `social_media_usage`, `important_people_count`) são reenviadas a cada
abertura do app (dentro de `ensureCurrentCycle`) pra refletir mudanças feitas depois em
Editar Perfil.

## Modo Dev

Acesso: 7 toques num ponto específico da tela de perfil (`DevTapTrigger.tsx`), só existe
com `__DEV__` true — nunca compila em produção (`app/dev/_layout.tsx` também guarda por
segurança redundante). Permite: simular relógio/data, aplicar cenários prontos (usuário
novo, engajado, baixa adesão, final do dia, ação pendente), gerar/enviar ações
específicas, adicionar pessoas de teste, simular clima/evento, inspecionar storage bruto,
fechar o dia sob demanda. `devService.ts` reaproveita os mesmos repositórios/services de
produção — nunca duplica lógica de negócio.

## Identidade visual

Paleta (`src/theme/palette.ts` → `brand`): energia laranja `#F2994A`, otimismo dourado
`#F7C948`, calma teal `#2F9E8F`, confiança navy `#16233F`, equilíbrio roxo `#8B7FE8`.
Tipografia Nunito Sans (já era, sem mudança).

O mark ("D" em fita gradiente + figura de pessoa + rastro-cometa terminando numa
estrela) é **gerado, não desenhado no Figma/importado de arte real** — não existe fonte
vetorial/fotográfica oficial da marca "Daliz" enviada ao projeto ainda (diferente da
identidade anterior, que tinha arte real em `identidade/`, processada por chroma-key em
`scripts/import-brand-assets.js`). `scripts/generate-daliz-brand.js` desenha o mark em
SVG e usa `sharp` pra rasterizar todos os tamanhos: `assets/icon.png`,
`assets/favicon.png`, `assets/android-icon-{foreground,background,monochrome}.png`,
`assets/splash-background.png` (fundo gradiente abstrato, sem foto/paisagem — a
paisagem antiga era da identidade anterior), `assets/brand/logo-mark.png` (glifo
transparente usado por `LogoMark.tsx` dentro do app) e `assets/brand/
background-welcome.png`. Rodar `node scripts/generate-daliz-brand.js` de novo sempre
que o mark for ajustado — os PNGs em `assets/` são gerados, não editados à mão.

Quando existir arte oficial de verdade (Figma/ilustrador), o caminho é o mesmo do
rebranding anterior: colocar os arquivos em `identidade/`, adaptar
`scripts/import-brand-assets.js` (chroma-key) em vez do gerador SVG, e trocar
`LogoMark.tsx` pra apontar pro novo `logo-mark.png` resultante — o componente já é
agnóstico à origem do PNG.

## Build nativo (EAS) e distribuição

- `eas.json` — perfis `development` (dev client), `preview` (APK interno, pra testar em
  aparelho real sem loja) e `production` (AAB, autoincrementa versão).
- `app.json` → `extra.eas.projectId` e `updates.url` apontam pro projeto vinculado no EAS
  (`@jaraujodevelopers-team/melhorqueontem`).
- `runtimeVersion.policy: "appVersion"` — cada versão nativa tem seu próprio runtime;
  atualizações OTA (`expo-updates`) só valem dentro da mesma versão.
- Config nativo (Firebase, AdMob, permissões) inteiramente via `app.json` → `plugins`
  (não existe pasta `android/`/`ios/` commitada — CNG puro).

### Pegadinha resolvida: Kotlin do AdMob

`react-native-google-mobile-ads@16.4.0` puxa `play-services-ads@25.4.0`, compilado com
metadata Kotlin novo demais pro compilador padrão do projeto — build falhava em
`compileReleaseKotlin` com "incompatible version of Kotlin". Tentar forçar a versão do
Kotlin via `expo-build-properties` não resolve (o módulo declara seu próprio
`buildscript`, ignora o override, e ainda quebra o KSP de outras libs). **Fix real:**
manter `react-native-google-mobile-ads` fixado em `16.3.4` (usa `play-services-ads@25.0.0`,
compatível). Reavaliar antes de atualizar essa dependência no futuro.

### Pegadinha resolvida: notificações agendadas chegando com horas de atraso (ou só ao abrir o app)

`Notifications.scheduleNotificationAsync` (usado por `notificationService.
scheduleForInstances`/`scheduleReminder`) depende do `AlarmManager` do Android por baixo
dos panos. No Android 12+ (`ExpoSchedulingDelegate.kt`, dentro do próprio
`expo-notifications`), ele só usa o alarme **exato** (`setExactAndAllowWhileIdle`) se
`AlarmManager.canScheduleExactAlarms()` for `true` — que exige a permissão
`SCHEDULE_EXACT_ALARM` **declarada no AndroidManifest.xml** (não é algo que
`expo-notifications` adiciona sozinho; confirmado no changelog da própria lib). Sem essa
permissão, todo agendamento cai silenciosamente no alarme **inexato**
(`setAndAllowWhileIdle`), que o Doze/battery manager do Android pode adiar por horas —
pior ainda em fabricantes com gerenciamento de bateria mais agressivo (Motorola, Xiaomi,
Samsung...). Sintoma real visto em teste: ações só apareciam quando a pessoa abria o app
manualmente, não no horário agendado. **Fix:** `app.json` → `android.permissions:
["SCHEDULE_EXACT_ALARM"]` (vira `<uses-permission
android:name="android.permission.SCHEDULE_EXACT_ALARM">` via Expo Config Plugins —
prefixo automático, não precisa escrever o nome completo). Exige gerar um novo build EAS
pra valer (é mudança de manifest nativo, não passa por Expo Go/preview web). Em Android
13+ o sistema pode ainda assim exigir que a pessoa confirme manualmente em Configurações
→ Apps → Daliz → Permissões especiais → Alarmes e lembretes — a permissão no manifest só
torna essa opção **visível**, não a concede automaticamente em todo aparelho. Vale também
orientar quem tiver o problema a desativar a otimização de bateria do app (Configurações
→ Bateria → Daliz → Sem restrições), independente da permissão de alarme exato.
