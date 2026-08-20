import type { Interest } from './interests';
import type { RelationshipType } from './importantPeople';
import type { Season } from '@/utils/season';

export type ChallengeCategory =
  | 'desenvolvimento_pessoal'
  | 'relacionamentos'
  | 'familia_presenca'
  | 'trabalho_produtividade'
  | 'saude_energia'
  | 'financas_consumo'
  | 'aprendizado_curiosidade'
  | 'bondade_comunidade'
  | 'fe_espiritualidade';

export type ChallengeLevel = 'facil' | 'medio' | 'desafiador';

export type ChallengeType = 'acao' | 'reflexao' | 'contato' | 'habito' | 'organizacao';

// Quando a ação deve ser realizada — não é prioridade/urgência (ver TIMING_LABELS em
// src/engine/challengeTiming.ts): 'now' = faz sentido no momento da notificação (pausas,
// autorregulação); 'today' = qualquer hora até o fim do dia; 'contextual' = espera uma situação
// específica acontecer, pode nem acontecer hoje. Resolvido via Challenge.timing (explícito) ou
// classifyTiming (heurística de texto) — ver getChallengeTiming.
export type ChallengeTiming = 'now' | 'today' | 'contextual';

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
  query?: string;
  // 'categories': qual conjunto de categorias mostrar (hoje só 'movies' — filmes por gênero no
  // AdoroCinema; um 'kind' novo no futuro reaproveita o mesmo MovieCategorySupport-like case sem
  // precisar de um supportType novo).
  kind?: 'movies';
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

// 'acao' = tarefa concreta (ganha botões Concluir/Não consegui, entra em estatísticas/streak).
// 'sugestao' = orientação contextual sem conclusão objetiva (ex: "Se perceber que está se
// comparando com outras pessoas hoje..."), exibida como banner avulso na Home — nunca como card,
// nunca conta em Histórico/Insights (ver ChallengeCard/dayCycleService/statsService). Vem
// marcado explicitamente na base curada (tags `[AÇÃO]`/`[DICA]`, ver scripts/sync-challenges-v2.js).
export type ChallengeActionKind = 'acao' | 'sugestao';

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
  // Ausente = 'acao' (default seguro pra desafios ainda não re-sincronizados com a base curada
  // que introduziu essa distinção).
  actionKind?: ChallengeActionKind;
  titulo: string;
  descricao: string;
  tempoEstimado: number; // minutos
  nivel: ChallengeLevel;
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
  requerFamilia?: boolean;
  requerTempoLivre?: boolean; // não cabe num intervalo curto durante o expediente
  cooldownDias?: number; // dias mínimos antes de poder repetir (default no ChallengeEngine)
  // Interesses/hobbies com que esse desafio conecta naturalmente — sinal de
  // personalização, não filtro duro. Ausente ou [] = desafio sem interesse
  // específico, continua totalmente válido (ver UserProfile.interests).
  interests?: Interest[];
  // Pessoas importantes com que esse desafio conecta — ao contrário de `interests`,
  // isso É um filtro duro (ver ChallengeEngine.filterCandidatesForSlot): não faz
  // sentido sugerir "brinque com seu filho" pra quem não tem filho cadastrado.
  // Ausente/[] = desafio não é sobre uma pessoa específica, continua válido pra todos.
  relationships?: RelationshipType[];
  minAge?: number; // faixa etária da pessoa — sinal de contexto, não regra rígida
  maxAge?: number;
  // true = só faz sentido com alguém que mora com o usuário (ação física/presencial).
  // Ausente/false = funciona com qualquer convivência (ex: ligar, mandar mensagem).
  requiresPresence?: boolean;
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
  // Termo de busca no Spotify, só presente nos desafios que envolvem ouvir/enviar música — a
  // presença do campo já identifica "isso é uma ação de música" (ver ChallengeCard.tsx), sem
  // precisar de heurística de texto. Não é um gênero real extraído do texto (a maioria dos
  // desafios de música não especifica um) — é escolhido na autoria pra cada desafio.
  musicQuery?: string;
  // Termo de busca de versículo, só presente nos desafios de leitura bíblica — mesmo
  // espírito do musicQuery: a presença do campo já identifica "isso é uma ação de leitura
  // bíblica" (ver ChallengeCard.tsx). Escolhido na autoria priorizando referências/temas
  // encorajadores (esperança, paz, força, gratidão) — não é extraído do texto do desafio.
  bibleQuery?: string;
  // true só nos desafios que pedem pra tirar uma foto nova, na hora (não "escolha uma foto
  // antiga"/"reveja fotos") — mostra o botão "Tirar foto agora" que abre a câmera direto (ver
  // ChallengeCard.tsx). Escolhido na autoria: o texto de "foto" sozinho não distingue tirar uma
  // foto nova de mexer em fotos já existentes.
  opensCamera?: boolean;
  // Explícito > heurística: se ausente, getChallengeTiming classifica pelo texto do desafio
  // (ver classifyTiming em src/engine/challengeTiming.ts). Preenchido à mão só quando a
  // classificação automática precisaria ser sobrescrita (ex: src/data/firstActionChallenge.ts).
  timing?: ChallengeTiming;
  // Ausente/'none' = sem assistência, card se comporta exatamente como hoje (ver ActionSupport.tsx
  // e ChallengeCard.tsx). Escolhido na autoria só quando a assistência remove uma dificuldade real
  // — não é gerado por palavra-chave, é uma decisão de propósito por desafio (ver seção 10 do
  // pedido: "não marque tudo").
  supportType?: ActionSupportType;
  // Texto do botão. Ausente = usa o label padrão do supportType (ver DEFAULT_SUPPORT_LABEL).
  supportLabel?: string;
  supportData?: ActionSupportData;
  // Sistema de dificuldade adaptativa (ver src/engine/progression.ts e progressionService.ts) —
  // conceito deliberadamente separado de `timing`/`supportType`: responde "isso pode evoluir pra
  // uma versão um pouco mais desafiadora?", nunca "quando"/"como ajudar a fazer". Ausente em
  // praticamente todo o catálogo — só um pequeno grupo de ações com progressão natural (seção 2/5
  // do pedido) recebe esses campos; todo o resto do app se comporta exatamente como hoje.
  //
  // Agrupador temático solto (ex: 'squat') — não precisa ser único por progressionGroup, só serve
  // pra reconhecer "isso é sobre o mesmo tipo de coisa" (seção 3). Pode existir em ações que nem
  // são `progressive` (útil pro futuro "nível de conforto" da seção 16), mas hoje só é preenchido
  // junto com progressionGroup.
  concept?: string;
  // 1 (muito leve) a 5 (avançada) — nível dessa ação especificamente, não uma prioridade/urgência.
  difficulty?: 1 | 2 | 3 | 4 | 5;
  // true = essa ação pertence a uma cadeia de progressão (progressionGroup) e pode ser substituída
  // por um nível seguinte quando a pessoa demonstrar consistência (ver isSupersededByProgression).
  // false/ausente = ação nunca é escalada — a maioria do catálogo continua assim de propósito
  // (seção 5 do pedido: nem toda ação precisa/deve virar progressiva).
  progressive?: boolean;
  // Cadeia específica de progressão (ex: 'squat_repeticoes') — várias ações podem compartilhar o
  // mesmo `concept` sem pertencer à mesma cadeia (ex: alongamento por repetição vs. por duração).
  progressionGroup?: string;
  progressionType?: ProgressionType;
  progression?: ChallengeProgression;
}

// Formas de evolução (seção 6 do pedido) — dificuldade não é só "mais repetições": pode ser
// duração, complexidade, frequência ou profundidade de uma reflexão. Hoje só `repetitions` e
// `duration` têm ações reais cadastradas (ver seção "Ações classificadas como progressivas" no
// resumo da entrega); os demais já existem no tipo pra não travar cadeias futuras.
export type ProgressionType = 'repetitions' | 'duration' | 'complexity' | 'frequency' | 'depth';

export interface ChallengeProgression {
  // Id do próximo nível dentro do mesmo progressionGroup. Ausente = topo da cadeia (ver seção 18:
  // o limite máximo de dificuldade de um grupo é, na prática, "onde a cadeia de nextActionId
  // termina" — não existe um `maxDifficulty` solto pra manter sincronizado à parte).
  nextActionId?: string;
}

// Tags de contexto climático que uma ação pode ter — não é o WeatherType bruto (ver
// src/types/weather.ts), é só "essa ação combina com..." (ver seção 10 do pedido).
export type WeatherTag = 'outdoor' | 'indoor' | 'rain' | 'sunny' | 'cold' | 'hot' | 'comfortable';

export const CHALLENGE_CATEGORY_LABELS: Record<ChallengeCategory, string> = {
  desenvolvimento_pessoal: 'Desenvolvimento pessoal',
  relacionamentos: 'Relacionamentos',
  familia_presenca: 'Família e presença',
  trabalho_produtividade: 'Trabalho e produtividade',
  saude_energia: 'Saúde e energia',
  financas_consumo: 'Finanças e consumo',
  aprendizado_curiosidade: 'Aprendizado e curiosidade',
  bondade_comunidade: 'Bondade, comunidade e vida prática',
  fe_espiritualidade: 'Fé e espiritualidade',
};

export const CHALLENGE_CATEGORY_ICONS: Record<ChallengeCategory, string> = {
  desenvolvimento_pessoal: '🧠',
  relacionamentos: '❤️',
  familia_presenca: '👨‍👩‍👧',
  trabalho_produtividade: '💼',
  saude_energia: '🏃',
  financas_consumo: '💰',
  aprendizado_curiosidade: '📚',
  bondade_comunidade: '🌎',
  fe_espiritualidade: '🌿',
};

// Resumo exibido na escolha de categorias no cadastro — dá exemplos concretos do
// que a pessoa vai receber escolhendo aquela opção, pra decisão ser informada.
export const CHALLENGE_CATEGORY_DESCRIPTIONS: Record<ChallengeCategory, string> = {
  desenvolvimento_pessoal: 'Autoconhecimento, metas pequenas, superar inseguranças e sair da zona de conforto.',
  relacionamentos: 'Ligar ou mandar mensagem pra alguém, elogios sinceros, ouvir de verdade, fortalecer laços.',
  familia_presenca: 'Momentos com quem mora com você — brincar, ajudar em casa, conversar sem celular na mesa.',
  trabalho_produtividade: 'Organizar tarefas, priorizar o dia, reduzir distração e destravar pendências no trabalho.',
  saude_energia: 'Exercícios físicos leves, alongamento, água, alimentação e pausas pra mexer o corpo.',
  financas_consumo: 'Olhar gastos, cortar assinaturas paradas, guardar um valor pequeno, consumir com mais consciência.',
  aprendizado_curiosidade: 'Aprender uma palavra, ler algo curto, descobrir uma curiosidade em poucos minutos.',
  bondade_comunidade: 'Gentilezas com estranhos, ajudar um vizinho, doar algo parado, deixar um lugar melhor.',
  fe_espiritualidade: 'Leitura bíblica curta e reflexão espiritual — só aparece se você escolher esta categoria.',
};
