import type { ChallengeCategory, DayOfWeek, WorkContext } from './challenge';
import type { Interest } from './interests';
import type { ImportantPerson } from './importantPeople';
import type { UserLocation } from './location';

export type WorkSchedule = 'fixa' | 'variavel' | 'turnos';

export const WORK_SCHEDULE_LABELS: Record<WorkSchedule, string> = {
  fixa: 'Fixa',
  variavel: 'Variável',
  turnos: 'Turnos',
};

// Padrão cíclico de turnos em dias (ex: 12x36 ≈ 1 dia de trabalho / 1 dia de folga;
// escalas maiores como 4x2, 6x1 também cabem aqui). O motor calcula se qualquer dia
// futuro é de trabalho ou folga a partir da distância em dias até anchorDate.
export interface ShiftPattern {
  workDays: number; // dias de trabalho seguidos no ciclo
  restDays: number; // dias de folga seguidos no ciclo
  anchorDate: string; // "YYYY-MM-DD" — data de referência do ciclo
  anchorIsWorkday: boolean; // true se anchorDate é dia de trabalho
}

// Com que frequência a pessoa usa redes sociais — só um dos dois sinais que
// alimentam a decisão do motor (ver SocialChallengesInterest, que pesa mais).
export type SocialMediaUsage = 'quase_nunca' | 'as_vezes' | 'todos_os_dias' | 'varias_vezes_dia';

export const SOCIAL_MEDIA_USAGE_LABELS: Record<SocialMediaUsage, string> = {
  quase_nunca: '📱 Quase nunca',
  as_vezes: '🙂 Às vezes',
  todos_os_dias: '📲 Todos os dias',
  varias_vezes_dia: '🔥 Várias vezes ao dia',
};

// O sinal que realmente decide se o motor pode usar contexto de redes sociais —
// frequência de uso sozinha não basta (ver ChallengeEngine).
export type SocialChallengesInterest = 'sim' | 'as_vezes' | 'prefiro_nao';

export const SOCIAL_CHALLENGES_INTEREST_LABELS: Record<SocialChallengesInterest, string> = {
  sim: '❤️ Sim, gosto da ideia',
  as_vezes: '🙂 Às vezes',
  prefiro_nao: '🚫 Prefiro que não',
};

export type SocialNetwork = 'instagram' | 'facebook' | 'tiktok' | 'x' | 'linkedin' | 'whatsapp' | 'youtube' | 'outra' | 'nenhuma';

export const SOCIAL_NETWORK_LABELS: Record<SocialNetwork, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  x: 'X',
  linkedin: 'LinkedIn',
  whatsapp: 'WhatsApp',
  youtube: 'YouTube',
  outra: 'Outra',
  nenhuma: 'Não uso redes sociais',
};

// Preferência de intensidade dos desafios — alimenta a pontuação do
// ChallengeEngine para aproximar o nível dos desafios (fácil/médio/desafiador)
// do que o usuário disse que quer.
export type ChallengeIntensity = 'leve' | 'equilibrado' | 'desafiador';

export interface UserProfile {
  name: string;
  birthDate: string; // "YYYY-MM-DD"
  occupation: string;
  // Derivado automaticamente da profissão escolhida no OccupationPicker (ver
  // src/services/occupationService.ts) — nunca perguntado à parte. null = profissão digitada
  // livre/não reconhecida, ou perfil salvo antes dessa feature existir; nesse caso o expediente
  // continua com o comportamento de sempre (só WORK_SAFE_CATEGORIES).
  workContext: WorkContext | null;
  photoUri: string | null;
  isWorking: boolean;
  workStartTime: string | null; // "HH:mm" — null quando isWorking é false
  workEndTime: string | null; // "HH:mm" — null quando isWorking é false
  workSchedule: WorkSchedule; // só relevante quando isWorking é true
  workDays: DayOfWeek[]; // usado quando workSchedule === 'fixa'
  shiftPattern: ShiftPattern | null; // usado quando workSchedule === 'turnos'
  // Só relevante quando isWorking é true. false = nenhum desafio é agendado dentro do
  // expediente (o motor pula o slot "durante_dia" de trabalho — ver dayModel.ts); os
  // desafios voltam a chegar normalmente assim que o horário de trabalho termina.
  receiveDuringWorkHours: boolean;
  wakeTime: string; // "HH:mm"
  sleepTime: string; // "HH:mm"
  // Categorias que o usuário escolheu receber — direto, sem camada intermediária de
  // "objetivos": o que não está aqui não entra na seleção de desafios (ver ChallengeEngine).
  selectedCategories: ChallengeCategory[];
  challengeIntensity: ChallengeIntensity;
  socialMediaUsage: SocialMediaUsage;
  socialChallengesInterest: SocialChallengesInterest; // decide se o motor pode usar contexto de redes sociais
  socialNetworks: SocialNetwork[]; // opcional — onde a pessoa costuma estar
  // Interesses/hobbies — NÃO é uma categoria de desafio nem uma pergunta de "quero
  // receber desafios disso". É só mais um sinal de personalização: o ChallengeEngine
  // pode dar um pequeno bônus a um desafio já elegível (pelo momento/dia/categoria)
  // quando ele também conecta com algo que a pessoa gosta (ver interestBonus).
  interests: Interest[];
  // Texto livre digitado quando a pessoa marca o interesse 'other' (✨ Outro) e descreve algo que
  // gosta de fazer fora da lista fixa (ver app/onboarding/profile.tsx). Não alimenta o motor —
  // é só coletado pra entender o que falta no catálogo de interesses e considerar expandir a
  // lista no futuro. null = nunca preencheu (não marcou 'other', ou marcou e deixou em branco).
  otherInterestText: string | null;
  // true quando a pessoa marcou "ainda estou descobrindo meus interesses" no cadastro —
  // não devemos assumir que todo mundo já sabe seus hobbies. Nesse caso o motor pode,
  // ocasionalmente, dar um pequeno empurrão a desafios de exploração (ver ChallengeEngine).
  stillDiscoveringInterests: boolean;
  // Interesses aprendidos pelo comportamento real (concluiu + reagiu bem a um desafio
  // de um interesse que a pessoa não tinha marcado) — sinal secundário, mais fraco que
  // `interests`, nunca sobrescreve a escolha original do cadastro (ver profileService).
  discoveredInterests: Interest[];
  // Pessoas importantes na vida do usuário — opcional, nunca obrigatório (ver
  // onboarding). Metadado de personalização, igual `interests`: ajuda o motor a
  // escolher ações mais pessoais, nunca vira uma categoria de desafio própria.
  importantPeople: ImportantPerson[];
  // Cidade aproximada (nunca endereço) — opcional, usada só pra clima/estação (ver
  // weatherService/contextService). null = pessoa não informou ou pulou a etapa.
  location: UserLocation | null;
  notificationsEnabled: boolean;
  onboardingCompletedAt: string; // ISO datetime
  createdAt: string; // ISO datetime
  // Quando a pessoa marcou a checkbox "Li e aceito os Termos de Uso e a Política de Privacidade"
  // na tela de boas-vindas (ver app/onboarding/welcome.tsx) — gravado só ao concluir o cadastro de
  // verdade (profileService.completeOnboarding), já que ninguém chega lá sem ter marcado a
  // checkbox. Perfis salvos antes dessa tela existir recebem um fallback em normalizeProfile.
  termsAcceptedAt: string; // ISO datetime
  // Estado do fluxo de primeira ação (ver app/onboarding/first-action.tsx). Opcional pra não
  // quebrar perfis salvos antes dessa feature existir — `normalizeProfile` (profileRepository.ts)
  // trata a ausência do campo como `'completed'`, nunca redirecionando quem já usa o app.
  firstActionState?: 'not_requested' | 'available' | 'completed' | 'not_completed';
  firstActionInstanceId?: string | null;
}

export const CHALLENGE_INTENSITY_LABELS: Record<ChallengeIntensity, string> = {
  leve: 'Prefiro começar leve',
  equilibrado: 'Equilibrado',
  desafiador: 'Pode me desafiar',
};
