import type { OccupationEntry, WorkContext } from '@/types';

/**
 * Classifica uma profissão (texto livre, igual vem da CBO ou do que a pessoa digitou) num
 * `WorkContext` — usado tanto pra pré-calcular `OCCUPATIONS_FALLBACK` abaixo quanto pelos itens
 * buscados ao vivo da CBO (ver occupationService.ensureFreshOccupations). Por palavra-chave, não
 * por código/grupo da CBO: conferimos o dataset real (datasets-br/cbo) e o "Grande Grupo" mistura
 * profissões bem diferentes entre si (ex: grupo 2 tem tanto "Advogado" quanto "Médico" quanto
 * "Professor" — só o primeiro é claramente mesa/escritório), então classificar pelo texto da
 * própria profissão é mais confiável que pelo prefixo numérico do código.
 *
 * Ordem de prioridade quando mais de uma palavra-chave bate (uma profissão só tem UM
 * `WorkContext`): dirigir é o mais específico/acionável, depois autônomo explícito, depois
 * atendimento/equipe, por último mesa/escritório (o mais genérico dos quatro). Sem nenhuma
 * palavra-chave batendo, `null` — comportamento de hoje, sem liberar nada extra no expediente.
 * `em_equipe`/`sem_equipe` é a classificação mais aproximada das quatro (a CBO não descreve "tem
 * colega por perto"), tratada como heurística, não regra exata.
 */
export function deriveWorkContext(termo: string): WorkContext | null {
  const text = normalize(termo);

  if (DIRIGE_TRANSITO_KEYWORDS.some((keyword) => text.includes(keyword))) return 'dirige_transito';
  if (SEM_EQUIPE_KEYWORDS.some((keyword) => text.includes(keyword))) return 'sem_equipe';
  if (EM_EQUIPE_KEYWORDS.some((keyword) => text.includes(keyword))) return 'em_equipe';
  if (MESA_ESCRITORIO_KEYWORDS.some((keyword) => text.includes(keyword))) return 'mesa_escritorio';
  return null;
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

// Confirmados contra o dataset real da CBO (datasets-br/cbo, data/lista_canonicos.csv) — ex:
// "Motofretista" (5191-10) é o termo oficial pra motoboy, "Mototaxista" (5191-15), "Motorista de
// caminhão"/"...de táxi"/"...de ônibus" (78xx-xx).
const DIRIGE_TRANSITO_KEYWORDS = [
  'motorista',
  'motofretista',
  'mototaxista',
  'motociclista',
  'motoboy',
  'taxista',
  'caminhoneiro',
  'condutor de',
  'entregador',
];

const SEM_EQUIPE_KEYWORDS = ['autonomo', 'freelancer', 'freelance', 'artesao'];

const EM_EQUIPE_KEYWORDS = [
  'atendente',
  'vendedor',
  'recepcionista',
  'balconista',
  'caixa de',
  'telemarketing',
  'garcom',
  'garconete',
  'professor',
  'enfermeiro',
  'enfermeira',
];

const MESA_ESCRITORIO_KEYWORDS = [
  'administrativ',
  'escritorio',
  'secretari',
  'advogado',
  'contador',
  'programador',
  'desenvolvedor',
  'analista',
  'digitador',
  'administrador',
];

/**
 * Lista pequena embutida no app (não a CBO inteira) — só pra `OccupationPicker` nunca ficar sem
 * nenhuma opção antes da primeira busca online dar certo (ver occupationService). A base completa
 * (~2.400 profissões) é buscada em runtime e cacheada, nunca embutida aqui — isso manteria o
 * bundle do app leve.
 */
export const OCCUPATIONS_FALLBACK: OccupationEntry[] = buildFallback([
  ['7823-15', 'Motorista de táxi'],
  ['7825-10', 'Motorista de caminhão'],
  ['7824-10', 'Motorista de ônibus urbano'],
  ['5191-10', 'Motofretista (motoboy)'],
  ['5191-15', 'Mototaxista'],
  ['4152-15', 'Entregador de publicações'],
  ['3547-05', 'Representante comercial autônomo'],
  ['2521-05', 'Administrador'],
  ['2410-05', 'Advogado'],
  ['2522-05', 'Contador'],
  ['2124-05', 'Analista de desenvolvimento de sistemas'],
  ['2123-05', 'Administrador de banco de dados'],
  ['4110-05', 'Assistente administrativo'],
  ['4110-10', 'Auxiliar administrativo'],
  ['4110-15', 'Atendente de judiciário'],
  ['4221-05', 'Recepcionista, em geral'],
  ['4132-10', 'Caixa de banco'],
  ['5211-40', 'Atendente de lojas e mercados'],
  ['5211-05', 'Vendedor de comércio varejista'],
  ['4223-05', 'Operador de telemarketing'],
  ['5134-25', 'Garçom'],
  ['2342-05', 'Professor de ensino fundamental'],
  ['2231-05', 'Enfermeiro'],
  ['5151-10', 'Atendente de enfermagem'],
  ['3546-05', 'Corretor de imóveis autônomo'],
  ['7622-05', 'Costureiro (autônomo)'],
]);

function buildFallback(entries: [string, string][]): OccupationEntry[] {
  return entries.map(([codigo, termo]) => ({ codigo, termo, workContext: deriveWorkContext(termo) }));
}
