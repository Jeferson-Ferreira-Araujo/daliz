// Interesses/hobbies são metadados de personalização — NÃO uma categoria de desafio
// e NÃO uma pergunta de "quero receber desafios disso". O usuário só diz o que gosta;
// o ChallengeEngine decide, a cada momento, se algum desafio já elegível também
// conecta com um desses interesses (ver interestBonus em src/engine/ChallengeEngine.ts).
export type Interest =
  | 'music'
  | 'instruments'
  | 'gaming'
  | 'sports'
  | 'fitness'
  | 'reading'
  | 'movies_series'
  | 'art'
  | 'photography'
  | 'cooking'
  | 'gardening'
  | 'nature'
  | 'travel'
  | 'cars'
  | 'diy'
  | 'technology'
  | 'content_creation'
  | 'animals'
  | 'puzzles'
  | 'writing'
  | 'family'
  | 'spirituality'
  | 'learning'
  | 'other';

export const INTEREST_LABELS: Record<Interest, string> = {
  music: '🎵 Música',
  instruments: '🎸 Tocar instrumentos',
  gaming: '🎮 Jogos',
  sports: '⚽ Esportes',
  fitness: '🏃 Atividade física',
  reading: '📚 Leitura',
  movies_series: '🎬 Filmes e séries',
  art: '🎨 Arte e desenho',
  photography: '📷 Fotografia',
  cooking: '🍳 Cozinhar',
  gardening: '🌱 Jardinagem',
  nature: '🌳 Natureza',
  travel: '✈️ Viagens',
  cars: '🚗 Carros',
  diy: '🔧 Fazer e consertar coisas',
  technology: '💻 Tecnologia',
  content_creation: '📱 Criar conteúdo',
  animals: '🐶 Animais',
  puzzles: '🧩 Jogos de raciocínio',
  writing: '✍️ Escrever',
  family: '👨‍👩‍👧 Tempo com a família',
  spirituality: '🙏 Espiritualidade',
  learning: '🎯 Aprender coisas novas',
  other: '✨ Outro',
};

export const ALL_INTERESTS: Interest[] = Object.keys(INTEREST_LABELS) as Interest[];
