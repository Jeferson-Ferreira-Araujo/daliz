import type { Interest } from './interests';
import type { RelationshipType } from './importantPeople';
import type { Season } from '@/utils/season';

// Taxonomia oficial (ver plano de migração/nova curadoria) — substitui as 9 categorias antigas
// por completo, seguindo os 10 grupos da base curada anexada pelo usuário. `trabalho_financas`
// funde os dois eixos antigos `trabalho_produtividade`/`financas_consumo` num só grupo, igual o
// documento original já apresentava ("Trabalho & Finanças"). Não existe mais `bondade_comunidade`
// — sem grupo correspondente na nova base.
export type ChallengeCategory =
  | 'relacionamentos'
  | 'familia'
  | 'aprendizado_desenvolvimento'
  | 'saude_bemestar'
  | 'rotina_organizacao'
  | 'trabalho_financas'
  | 'criatividade_cultura'
  | 'experiencias_lazer'
  | 'casa_ambiente'
  | 'fe_espiritualidade';

export type ChallengeLevel = 'facil' | 'medio' | 'desafiador';

export type ChallengeType = 'acao' | 'reflexao' | 'contato' | 'habito' | 'organizacao';

// Curadoria: se a ação já passou por revisão e pode ser sorteada de verdade. Ausente = 'approved'
// (todo o catálogo hoje é implicitamente aprovado — este campo só existe pra permitir rascunhos
// futuros na curadoria sem precisar removê-los do arquivo de dados).
export type ChallengeStatus = 'approved' | 'draft' | 'archived';

// Quando a ação deve ser realizada — não é prioridade/urgência (ver TIMING_LABELS em
// src/engine/challengeTiming.ts): 'now' = faz sentido no momento da notificação (pausas,
// autorregulação); 'today' = qualquer hora até o fim do dia; 'contextual' = espera uma situação
// específica acontecer, pode nem acontecer hoje. Resolvido via Challenge.timing.mode (explícito)
// ou classifyTiming (heurística de texto) — ver getChallengeTiming.
export type ChallengeTiming = 'now' | 'today' | 'contextual';

// Período do RELÓGIO real (diferente de `Moment`, que é relativo à rotina — acordar/trabalhar/
// dormir da pessoa) — usado só como preferência soft de horário dentro de `timing.preferredPeriods`/
// `avoidPeriods` (ver clockPeriodBonus em ChallengeEngine.ts). Nunca um filtro duro.
export type ClockPeriod = 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night';

// Config de timing de uma ação — `mode` já existia solto como `Challenge.timing`; os períodos são
// novos. Congelada uma vez no bake de `allChallenges` (ver src/data/challenges/index.ts) e de novo
// na criação da instância (ver buildInstance), mesmo padrão do resto do "congelado na criação".
export interface ChallengeTimingConfig {
  mode: ChallengeTiming;
  // Faz o motor preferir (nunca exigir) que o horário real de envio caia nesses períodos —
  // ver clockPeriodBonus. [] = sem preferência.
  preferredPeriods: ClockPeriod[];
  // Faz o motor evitar (nunca bloquear com certeza absoluta, só penalizar bastante) esses
  // períodos — mesma filosofia de "contexto nunca é filtro duro absoluto" já usada em weatherBonus.
  avoidPeriods: ClockPeriod[];
}

// Camada opcional de assistência — responde "como posso ajudar a pessoa a executar essa ação?",
// um conceito deliberadamente separado de `timing` ("faz sentido lembrá-la disso depois?"). Ver
// ActionSupport.tsx: cada tipo abre uma experiência externa/local específica; 'none' (ou ausente)
// = card continua exatamente como sempre foi, sem nenhum botão novo. Extensível: futuros tipos
// (camera, link, tool, youtube, weather, calculator, calendar) entram aqui sem mexer no
// componente que já existe pra cada tipo atual.
export type ActionSupportType = 'none' | 'search' | 'categories' | 'maps' | 'spotify';

export interface ActionSupportData {
  // 'search': termo pesquisado no Google. 'maps': tipo de lugar pesquisado no Maps.
  // 'spotify': termo de busca opcional (ausente = abre o Spotify sem busca específica).
  // Pode conter o placeholder `{{data}}`, resolvido em runtime pela data de nascimento
  // por extenso do perfil (ver ChallengeCard.tsx) antes de chegar em ActionSupport.
  query?: string;
  // 'categories': qual conjunto de categorias mostrar (hoje só 'movies' — filmes por gênero no
  // AdoroCinema; um 'kind' novo no futuro reaproveita o mesmo MovieCategorySupport-like case sem
  // precisar de um supportType novo).
  kind?: 'movies';
}

// Recurso externo/local que uma ação pode envolver — presença em `resources.required` ainda NÃO é
// um filtro duro de verdade (ver 2.1 do plano de migração): o app não tem hoje um inventário real
// do que está disponível pra cada pessoa, então isso serve por enquanto só como metadado/sinal pra
// acionar `supportType`, dívida técnica documentada. `resources.optional` nunca bloqueia.
export type ResourceTag = 'google_search' | 'maps' | 'spotify' | 'camera' | 'photos' | 'internal' | 'external_link';

export type LocationRequirementType = 'none' | 'city' | 'region' | 'country' | 'nearby';

// Situação relativa à rotina/calendário — se sobrepõe por design com `DayType`/`Moment` já
// existentes (ver bakeSituations em src/data/challenges/index.ts, que deriva tiposDia/momentos a
// partir disso quando eles estiverem ausentes, evitando duas fontes de verdade divergentes).
export type SituationTag = 'workday' | 'day_off' | 'weekend' | 'after_waking' | 'before_sleep' | 'after_meal';

// Contexto de trabalho da pessoa — derivado automaticamente da profissão informada no cadastro
// (ver src/services/occupationService.ts), nunca perguntado diretamente. Usado só pra liberar
// ações específicas durante o expediente que a categoria sozinha bloquearia por padrão (ver
// Challenge.workHoursContexts abaixo e WORK_SAFE_CATEGORIES em ChallengeEngine.ts) — ex: um
// motoboy pode receber "faça uma gentileza a um estranho" (categoria relacionamentos, normalmente
// fora do expediente) porque isso faz sentido pro contexto dele. `em_equipe`/`sem_equipe` é uma
// aproximação editorial (a CBO não classifica ocupações por "tem colega por perto"), menos
// confiável que mesa/dirige.
export type WorkContext = 'mesa_escritorio' | 'dirige_transito' | 'em_equipe' | 'sem_equipe';

// Sinal derivado do perfil do usuário (ver computeProfileTags em src/engine/profileTags.ts) —
// generaliza os filtros pontuais antigos (requerFamilia/requerTempoLivre/relationships/minAge/
// maxAge/requiresPresence, mantidos como fallback enquanto o catálogo legado ainda existir).
export type ProfileTag = 'has_children' | 'has_partner' | 'works' | 'works_from_home' | 'has_car' | 'uses_social_media';

export type EffortTime = 'instant' | 'short' | 'medium' | 'long';
export type EffortLevel = 'low' | 'medium' | 'high';

export interface ChallengeEffort {
  time: EffortTime;
  mental: EffortLevel;
  physical: EffortLevel;
  emotional: EffortLevel;
}

export interface ChallengeRepetition {
  // false = a ação (ou qualquer título em `variants`) nunca pode repetir, depois da primeira vez
  // que apareceu no histórico (não só "hoje" — pra sempre). Resolve ações naturalmente únicas
  // (ex: "descubra o que aconteceu no mundo no dia em que você nasceu").
  allowed: boolean;
  // Substitui `cooldownDias` — dias mínimos antes de poder repetir. null = usa DEFAULT_COOLDOWN_DAYS.
  minIntervalDays: number | null;
  // Fora do v1 — sempre null por enquanto (ver plano de migração).
  maxUsesPerPeriod?: number | null;
}

export interface ChallengeInterestRules {
  required: Interest[];
  preferred: Interest[];
  excluded: Interest[];
}

export interface ChallengeResourceRules {
  required: ResourceTag[];
  optional: ResourceTag[];
}

export interface ChallengeLocationRules {
  required: boolean;
  type: LocationRequirementType | null;
}

export interface ChallengeProfileRules {
  required: ProfileTag[];
  preferred: ProfileTag[];
  excluded: ProfileTag[];
}

export type IdealTimeOfDay = 'manha' | 'tarde' | 'noite' | 'qualquer';

export type DayOfWeek = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  seg: 'Seg',
  ter: 'Ter',
  qua: 'Qua',
  qui: 'Qui',
  sex: 'Sex',
  sab: 'Sáb',
  dom: 'Dom',
};

// Momento do dia relativo à rotina da pessoa (não uma hora fixa) — resolvido todo dia
// pelo ChallengeEngine/dayModel a partir de acordar/trabalhar/dormir do perfil.
export type Moment = 'inicio_dia' | 'durante_dia' | 'transicao' | 'fim_dia' | 'antes_dormir' | 'qualquer';

// Se o desafio combina com um dia de trabalho, um dia de folga, ou os dois.
export type DayType = 'trabalho' | 'folga' | 'qualquer';

// Pista de onde a pessoa provavelmente está — usada como bônus de pontuação,
// nunca como filtro duro (o app não sabe a localização real do usuário).
export type ContextType = 'em_casa' | 'no_trabalho' | 'qualquer';

// 'sugestao' (orientação contextual sem conclusão objetiva, ex: "Se perceber que está se
// comparando com outras pessoas hoje...") existiu no catálogo antigo e foi removida na
// reestruturação de ações (Fase 2) — nenhum desafio do catálogo atual usa mais esse tipo. Mantido
// como união de um único valor (em vez de apagar `type`/`getInstanceActionKind` de todo lugar que
// já lê isso) pra não forçar um refactor maior sem necessidade real hoje.
export type ChallengeActionKind = 'acao';

// Filosofia dos desafios com contexto de redes sociais: não é "use menos o
// celular", é "faça algo melhor com o tempo que você já passa nele".
export type SocialActionType = 'conectar' | 'reconhecer' | 'incentivar' | 'usar_melhor';

export const SOCIAL_ACTION_TYPE_LABELS: Record<SocialActionType, string> = {
  conectar: '🤝 Conectar',
  reconhecer: '❤️ Reconhecer',
  incentivar: '🚀 Incentivar',
  usar_melhor: '🧠 Usar melhor',
};

export interface Challenge {
  id: string;
  categoria: ChallengeCategory;
  // Ausente = 'approved' (curadoria — ver ChallengeStatus).
  status?: ChallengeStatus;
  // Ausente = 'acao' (default seguro). Renomeado de `actionKind` — ocupa o papel do `type` do
  // documento de especificação (que não previa sugestões).
  type?: ChallengeActionKind;
  titulo: string;
  descricao?: string;
  tempoEstimado?: number; // minutos — ausente = deriva de effort.time (ver EFFORT_TIME_MINUTES)
  nivel?: ChallengeLevel; // mantido por compat de exibição — deriva de `difficulty` quando ausente
  tipo: ChallengeType;
  horariosIdeais: IdealTimeOfDay[];
  diasIdeais: DayOfWeek[] | 'qualquer';
  tags: string[];
  // true para ações com contexto de redes sociais (marcadas com 📱 na base oficial) — o
  // motor limita a fatia desses desafios no histórico recente (ver ChallengeEngine).
  socialContext?: boolean;
  socialActionType?: SocialActionType; // só presente quando socialContext é true
  // Eixos de filtro duro do motor de contexto (ver src/engine/dayModel.ts e ChallengeEngine).
  momentos: Moment[];
  tiposDia: DayType[];
  contexto: ContextType[];
  // Situação relativa à rotina/calendário (ver SituationTag) — quando presente e momentos/tiposDia
  // ausentes/genéricos, o bake em src/data/challenges/index.ts deriva momentos/tiposDia a partir
  // disso, pra nunca ter duas fontes de verdade divergentes sobre a mesma coisa.
  situations?: SituationTag[];
  // Campos legados de filtro por perfil — mantidos como fallback enquanto o catálogo legado (as
  // ~1686 ações antigas) ainda estiver bakeado no shape novo. Ver `profile` abaixo, que os
  // generaliza; `computeProfileTags` (src/engine/profileTags.ts) só é consultado quando
  // `profile.required`/`profile.excluded` estiverem vazios.
  requerFamilia?: boolean;
  requerTempoLivre?: boolean; // não cabe num intervalo curto durante o expediente
  // Libera esse desafio no slot de expediente mesmo com `categoria` fora de WORK_SAFE_CATEGORIES
  // (ver ChallengeEngine.filterCandidatesForSlot), só pra quem tem um desses WorkContext no
  // perfil (ver UserProfile.workContext). Deliberadamente SEPARADO de `profile.required`: esse
  // campo só é lido dentro do filtro de horário de trabalho — fora do expediente o desafio segue
  // com sua elegibilidade normal (categoria/momento/etc.), sem ficar restrito só a esse contexto
  // o dia inteiro. Ausente/[] = desafio não tem nenhuma liberação especial de expediente.
  workHoursContexts?: WorkContext[];
  cooldownDias?: number; // legado — ver `repetition.minIntervalDays`, que tem prioridade quando presente
  // Interesses/hobbies com que esse desafio conecta — ver ChallengeInterestRules. Ausente =
  // `{ required: [], preferred: [], excluded: [] }` (sem nenhuma restrição/bônus).
  interests?: ChallengeInterestRules;
  // Pessoas importantes com que esse desafio conecta — filtro duro legado (ver
  // ChallengeEngine.filterCandidatesForSlot): não faz sentido sugerir "brinque com seu filho" pra
  // quem não tem filho cadastrado. Ausente/[] = desafio não é sobre uma pessoa específica.
  relationships?: RelationshipType[];
  minAge?: number; // faixa etária da pessoa — sinal de contexto, não regra rígida
  maxAge?: number;
  // true = só faz sentido com alguém que mora com o usuário (ação física/presencial).
  requiresPresence?: boolean;
  // Recursos externos/locais envolvidos (ver ChallengeResourceRules) — `required` não é filtro
  // duro de verdade no v1 (ver comentário em ResourceTag), só sinal/metadado. Ausente =
  // `{ required: [], optional: [] }`.
  resources?: ChallengeResourceRules;
  // Requisito de localização (ver ChallengeLocationRules) — `required: true` só bloqueia se
  // `profile.location` for null. Ausente = `{ required: false, type: null }`.
  location?: ChallengeLocationRules;
  // Sinal derivado do perfil (ver ChallengeProfileRules/ProfileTag/computeProfileTags). Ausente =
  // `{ required: [], preferred: [], excluded: [] }` — cai nos campos legados acima como fallback.
  profile?: ChallengeProfileRules;
  // Regras de repetição (ver ChallengeRepetition). Ausente = `{ allowed: true, minIntervalDays:
  // null }` — usa `cooldownDias`/DEFAULT_COOLDOWN_DAYS como sempre.
  repetition?: ChallengeRepetition;
  // Carga da ação em 4 eixos (ver ChallengeEffort). Ausente = deriva um default neutro
  // (`{ time: 'short', mental: 'medium', physical: 'low', emotional: 'medium' }`).
  effort?: ChallengeEffort;
  // Sinal de prioridade pro motor (1 baixa .. 5 especial) — nunca uma garantia de entrega, só mais
  // um termo pequeno na pontuação. Ausente = 3 (normal).
  priority?: 1 | 2 | 3 | 4 | 5;
  // Textos alternativos pro MESMO conceito/oportunidade — nunca contam como repetição nova entre
  // si (ver filtro de repetição no motor). Ausente/[] = sem variantes.
  variants?: string[];
  // Clima/estação/data comemorativa — mesma filosofia de `interests`: sinal de pontuação,
  // não filtro duro (com uma exceção leve: ver WEATHER_BLOCK_TYPES no ChallengeEngine,
  // que só reduz bastante a prioridade de uma ação outdoor em clima ruim, nunca a esconde
  // por completo). Ausente/[] = desafio sem relação com esses eixos, continua válido.
  weatherTags?: WeatherTag[];
  seasonTags?: Season[];
  eventTags?: string[]; // casa com Holiday.tags (ver src/types/holiday.ts)
  // 'event_specific' só faz sentido dentro da janela de uma data comemorativa —
  // ver EVENT_SPECIFIC_MIN_PHASE no ChallengeEngine. Ausente = 'normal'.
  contentLevel?: 'normal' | 'contextual' | 'event_specific';
  // Termo de busca de versículo, só presente nos desafios de leitura bíblica — a presença do
  // campo já identifica "isso é uma ação de leitura bíblica" (ver ChallengeCard.tsx), sem
  // precisar de heurística de texto. Escolhido na autoria priorizando referências/temas
  // encorajadores (esperança, paz, força, gratidão) — não é extraído do texto do desafio.
  // (Não existe mais o equivalente `musicQuery` pra Spotify — botão de música hoje é só
  // `supportType: 'spotify'`/`supportData.query`, ver ActionSupport.tsx. Os dois coexistindo no
  // mesmo desafio foi o que causava o botão duplicado do Spotify.)
  bibleQuery?: string;
  // true só nos desafios que pedem pra tirar uma foto nova, na hora (não "escolha uma foto
  // antiga"/"reveja fotos") — mostra o botão "Tirar foto agora" que abre a câmera direto (ver
  // ChallengeCard.tsx). Escolhido na autoria: o texto de "foto" sozinho não distingue tirar uma
  // foto nova de mexer em fotos já existentes.
  opensCamera?: boolean;
  // Config de timing (ver ChallengeTimingConfig) — explícito > heurística: se `mode` ausente,
  // getChallengeTiming classifica pelo texto do desafio (ver classifyTiming em
  // src/engine/challengeTiming.ts). `preferredPeriods`/`avoidPeriods` sempre explícitos, nunca
  // inferidos por heurística.
  timing?: ChallengeTimingConfig;
  // Ausente/'none' = sem assistência, card se comporta exatamente como hoje (ver ActionSupport.tsx
  // e ChallengeCard.tsx). Escolhido na autoria só quando a assistência remove uma dificuldade real
  // — não é gerado por palavra-chave, é uma decisão de propósito por desafio.
  supportType?: ActionSupportType;
  // Texto do botão. Ausente = usa o label padrão do supportType (ver DEFAULT_SUPPORT_LABEL).
  supportLabel?: string;
  supportData?: ActionSupportData;
  // Sistema de dificuldade adaptativa (ver src/engine/progression.ts e progressionService.ts) —
  // DESATIVADO (nada popula actionPerformanceRepository desde a remoção de Concluir/Não consegui,
  // ver plano de migração seção 4/6) — os campos ficam no tipo pra facilitar reativação futura com
  // outro sinal, mas não têm efeito prático hoje (isSupersededByProgression sempre recebe mapa vazio).
  //
  // Agrupador temático solto (ex: 'squat') — renomeado conceitualmente pra `conceptGroup` abaixo
  // no uso geral do motor (cooldown de similaridade), mas mantido aqui pro sistema de progressão.
  concept?: string;
  // Agrupador de similaridade semântica pro cooldown de conceito (ver ALGORITHM_RULES.conceptCooldownDays
  // em src/engine/algorithmRules.ts) — duas ações de textos diferentes mas do mesmo `conceptGroup`
  // (ex: "ligar pra alguém" e "mandar mensagem", ambas `strengthen_connection`) compartilham
  // cooldown, evitando repetição semântica mesmo com ids diferentes. Ausente = sem cooldown de
  // conceito pra essa ação (só o cooldown normal de `repetition`/`cooldownDias` se aplica).
  conceptGroup?: string;
  // 1 (muito leve) a 5 (avançada) — nível dessa ação especificamente, não uma prioridade/urgência.
  // Ausente = 2.
  difficulty?: 1 | 2 | 3 | 4 | 5;
  // true = essa ação pertence a uma cadeia de progressão (progressionGroup) — ver nota de
  // "DESATIVADO" acima.
  progressive?: boolean;
  progressionGroup?: string;
  progressionType?: ProgressionType;
  progression?: ChallengeProgression;
}

// Formas de evolução — dificuldade não é só "mais repetições": pode ser duração, complexidade,
// frequência ou profundidade de uma reflexão. Sistema de progressão desativado (ver comentário em
// `Challenge.concept`) — tipo mantido pra reativação futura.
export type ProgressionType = 'repetitions' | 'duration' | 'complexity' | 'frequency' | 'depth';

export interface ChallengeProgression {
  // Id do próximo nível dentro do mesmo progressionGroup. Ausente = topo da cadeia.
  nextActionId?: string;
}

// Tags de contexto climático que uma ação pode ter — não é o WeatherType bruto (ver
// src/types/weather.ts), é só "essa ação combina com...".
export type WeatherTag = 'outdoor' | 'indoor' | 'rain' | 'sunny' | 'cold' | 'hot' | 'comfortable';

export const CHALLENGE_CATEGORY_LABELS: Record<ChallengeCategory, string> = {
  relacionamentos: 'Relacionamentos',
  familia: 'Família',
  aprendizado_desenvolvimento: 'Aprendizado e desenvolvimento',
  saude_bemestar: 'Saúde e bem-estar',
  rotina_organizacao: 'Rotina e organização',
  trabalho_financas: 'Trabalho e finanças',
  criatividade_cultura: 'Criatividade e cultura',
  experiencias_lazer: 'Experiências e lazer',
  casa_ambiente: 'Casa e ambiente',
  fe_espiritualidade: 'Fé e espiritualidade',
};

export const CHALLENGE_CATEGORY_ICONS: Record<ChallengeCategory, string> = {
  relacionamentos: '❤️',
  familia: '👨‍👩‍👧',
  aprendizado_desenvolvimento: '🧠',
  saude_bemestar: '💪',
  rotina_organizacao: '⏰',
  trabalho_financas: '💼',
  criatividade_cultura: '🎨',
  experiencias_lazer: '🌍',
  casa_ambiente: '🏠',
  fe_espiritualidade: '🙏',
};

// Resumo exibido na escolha de categorias no cadastro — dá exemplos concretos do
// que a pessoa vai receber escolhendo aquela opção, pra decisão ser informada.
export const CHALLENGE_CATEGORY_DESCRIPTIONS: Record<ChallengeCategory, string> = {
  relacionamentos: 'Ligar ou mandar mensagem pra alguém, elogios sinceros, ouvir de verdade, fortalecer laços.',
  familia: 'Momentos com quem mora com você — brincar, ajudar em casa, conversar sem celular na mesa.',
  aprendizado_desenvolvimento: 'Pesquisar curiosidades, aprender algo novo, descobrir lugares e ideias, autoconhecimento.',
  saude_bemestar: 'Exercícios físicos leves, alongamento, água, alimentação, sono e pausas pra mexer o corpo.',
  rotina_organizacao: 'Organizar tarefas, priorizar o dia, arrumar o que está pendente, simplificar a rotina.',
  trabalho_financas: 'Organizar pendências do trabalho, olhar gastos, cortar assinaturas paradas, guardar um valor pequeno.',
  criatividade_cultura: 'Escrever, criar, pesquisar arte e cultura, ouvir música nova, explorar algo criativo.',
  experiencias_lazer: 'Conhecer um lugar novo, sair da rotina, fazer algo só por prazer, pequenos passeios.',
  casa_ambiente: 'Organizar e limpar espaços, cuidar do ambiente onde você vive, pequenos consertos.',
  fe_espiritualidade: 'Leitura, oração e reflexão espiritual — só aparece se você escolher esta categoria.',
};
