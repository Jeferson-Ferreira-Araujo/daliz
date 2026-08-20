import type { ChallengeCategory } from '@/types';

// Tradução categoria → linguagem humana pra "O que você melhorou?" (ver seção 5/6 do pedido:
// não mostrar o nome técnico da categoria — "Relacionamentos: 6" — e sim algo que soe como
// alguém contando o que fez, não um relatório). Mesmo padrão de src/data/encouragementMessages.ts
// (dicionário indexado por ChallengeCategory, sem inventar categorias novas).
export const WEEKLY_HIGHLIGHT_LABELS: Record<ChallengeCategory, { title: string; icon: string }> = {
  desenvolvimento_pessoal: { title: 'Investiu em você mesmo', icon: '🧠' },
  relacionamentos: { title: 'Fortaleceu relacionamentos', icon: '❤️' },
  familia_presenca: { title: 'Esteve presente com a família', icon: '👨‍👩‍👧' },
  trabalho_produtividade: { title: 'Organizou seu trabalho', icon: '💼' },
  saude_energia: { title: 'Cuidou da sua rotina', icon: '🌱' },
  financas_consumo: { title: 'Cuidou das suas finanças', icon: '💰' },
  aprendizado_curiosidade: { title: 'Aprendeu coisas novas', icon: '📚' },
  bondade_comunidade: { title: 'Espalhou gentileza', icon: '🌎' },
  fe_espiritualidade: { title: 'Cultivou sua fé', icon: '🌿' },
};

function actionCountPhrase(count: number): string {
  return count === 1 ? '1 ação concluída' : `${count} ações concluídas`;
}

// Frases pra "✨ Mudança que mais se destacou" — deliberadamente evitam afirmar uma mudança real
// (ver seção 10 do pedido: "não sabemos isso apenas pela conclusão de ações"). Descrevem o que a
// pessoa fez, não o que "melhorou".
const TOP_HIGHLIGHT_PHRASE: Record<ChallengeCategory, (count: number) => string> = {
  desenvolvimento_pessoal: (n) => `Você investiu em você mesmo esta semana, com ${actionCountPhrase(n)}.`,
  relacionamentos: (n) => `Você dedicou mais atenção aos seus relacionamentos esta semana, com ${actionCountPhrase(n)}.`,
  familia_presenca: (n) => `Você esteve mais presente com a família esta semana, com ${actionCountPhrase(n)}.`,
  trabalho_produtividade: (n) => `Você organizou melhor o seu trabalho esta semana, com ${actionCountPhrase(n)}.`,
  saude_energia: (n) => `Você cuidou mais da sua rotina esta semana, com ${actionCountPhrase(n)}.`,
  financas_consumo: (n) => `Você prestou mais atenção às suas finanças esta semana, com ${actionCountPhrase(n)}.`,
  aprendizado_curiosidade: (n) => `O aprendizado esteve presente na sua semana — você concluiu ${actionCountPhrase(n)} nessa área.`,
  bondade_comunidade: (n) => `Você espalhou mais gentileza ao seu redor esta semana, com ${actionCountPhrase(n)}.`,
  fe_espiritualidade: (n) => `Você cultivou sua fé esta semana, com ${actionCountPhrase(n)}.`,
};

export function buildTopHighlightPhrase(categoria: ChallengeCategory, count: number): string {
  return TOP_HIGHLIGHT_PHRASE[categoria](count);
}
