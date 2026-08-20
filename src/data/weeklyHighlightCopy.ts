import type { ChallengeCategory } from '@/types';

// Tradução categoria → linguagem humana pra "O que você melhorou?" — DORMENTE (ver
// statsService.getWeeklyInsight, que sempre devolve topHighlight null desde a remoção de
// Concluir/Não consegui). Mantido pra reativação futura com outro sinal.
export const WEEKLY_HIGHLIGHT_LABELS: Record<ChallengeCategory, { title: string; icon: string }> = {
  relacionamentos: { title: 'Fortaleceu relacionamentos', icon: '❤️' },
  familia: { title: 'Esteve presente com a família', icon: '👨‍👩‍👧' },
  aprendizado_desenvolvimento: { title: 'Aprendeu coisas novas', icon: '🧠' },
  saude_bemestar: { title: 'Cuidou de si mesmo', icon: '💪' },
  rotina_organizacao: { title: 'Organizou sua rotina', icon: '⏰' },
  trabalho_financas: { title: 'Organizou trabalho e finanças', icon: '💼' },
  criatividade_cultura: { title: 'Explorou a criatividade', icon: '🎨' },
  experiencias_lazer: { title: 'Viveu novas experiências', icon: '🌍' },
  casa_ambiente: { title: 'Cuidou do seu espaço', icon: '🏠' },
  fe_espiritualidade: { title: 'Cultivou sua fé', icon: '🙏' },
};

function actionCountPhrase(count: number): string {
  return count === 1 ? '1 ação concluída' : `${count} ações concluídas`;
}

// Frases pra "✨ Mudança que mais se destacou" — DORMENTE (ver comentário acima).
const TOP_HIGHLIGHT_PHRASE: Record<ChallengeCategory, (count: number) => string> = {
  relacionamentos: (n) => `Você dedicou mais atenção aos seus relacionamentos esta semana, com ${actionCountPhrase(n)}.`,
  familia: (n) => `Você esteve mais presente com a família esta semana, com ${actionCountPhrase(n)}.`,
  aprendizado_desenvolvimento: (n) => `O aprendizado esteve presente na sua semana — você concluiu ${actionCountPhrase(n)} nessa área.`,
  saude_bemestar: (n) => `Você cuidou mais de si mesmo esta semana, com ${actionCountPhrase(n)}.`,
  rotina_organizacao: (n) => `Você organizou melhor sua rotina esta semana, com ${actionCountPhrase(n)}.`,
  trabalho_financas: (n) => `Você organizou melhor trabalho e finanças esta semana, com ${actionCountPhrase(n)}.`,
  criatividade_cultura: (n) => `Você explorou mais sua criatividade esta semana, com ${actionCountPhrase(n)}.`,
  experiencias_lazer: (n) => `Você viveu novas experiências esta semana, com ${actionCountPhrase(n)}.`,
  casa_ambiente: (n) => `Você cuidou mais do seu espaço esta semana, com ${actionCountPhrase(n)}.`,
  fe_espiritualidade: (n) => `Você cultivou sua fé esta semana, com ${actionCountPhrase(n)}.`,
};

export function buildTopHighlightPhrase(categoria: ChallengeCategory, count: number): string {
  return TOP_HIGHLIGHT_PHRASE[categoria](count);
}
