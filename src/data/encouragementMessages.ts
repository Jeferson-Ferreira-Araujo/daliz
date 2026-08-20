import type { ChallengeCategory, ChallengeReaction } from '@/types';

const POSITIVE_BY_CATEGORY: Record<ChallengeCategory, string[]> = {
  desenvolvimento_pessoal: ['Um passo pequeno, um cuidado real com você mesmo.'],
  relacionamentos: ['Que ótimo! Continue cultivando boas conexões.'],
  familia_presenca: ['Presença vale mais do que parece no momento.'],
  trabalho_produtividade: ['Uma pendência a menos pesando na cabeça.'],
  saude_energia: ['Seu corpo agradece esses pequenos cuidados.'],
  financas_consumo: ['Cada decisão consciente soma no fim do mês.'],
  aprendizado_curiosidade: ['Curiosidade é combustível pra crescer.'],
  bondade_comunidade: ['Pequenos gestos mudam o dia de alguém.'],
  fe_espiritualidade: ['Cuidar da sua fé também é cuidar de você.'],
};

const NEUTRAL_MESSAGES = ['Tudo bem. O que importa é ter tentado.', 'Nem toda ação precisa ser perfeita — só feita.'];

/** Mensagem de incentivo mostrada após concluir um desafio, com base na categoria e reação. */
export function getEncouragementMessage(categoria: ChallengeCategory, reaction: ChallengeReaction): string {
  if (reaction === 'fez_muito_bem' || reaction === 'foi_bom') {
    const options = POSITIVE_BY_CATEGORY[categoria];
    return options[Math.floor(Math.random() * options.length)];
  }
  return NEUTRAL_MESSAGES[Math.floor(Math.random() * NEUTRAL_MESSAGES.length)];
}
