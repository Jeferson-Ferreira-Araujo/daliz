// Pessoas importantes são metadados de personalização — igual interesses/hobbies,
// NÃO viram uma categoria de desafio nova. Ajudam o motor a escolher, entre os
// desafios já elegíveis, um que conecte com alguém real na vida da pessoa.
export type RelationshipType =
  | 'companheiro'
  | 'conjuge'
  | 'namorado'
  | 'noivo'
  | 'filho'
  | 'pai'
  | 'mae'
  | 'irmao'
  | 'avo'
  | 'neto'
  | 'sobrinho'
  | 'amigo'
  | 'outro';

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  companheiro: 'Companheiro(a)',
  conjuge: 'Cônjuge',
  namorado: 'Namorado(a)',
  noivo: 'Noivo(a)',
  filho: 'Filho(a)',
  pai: 'Pai',
  mae: 'Mãe',
  irmao: 'Irmão/Irmã',
  avo: 'Avô/Avó',
  neto: 'Neto(a)',
  sobrinho: 'Sobrinho(a)',
  amigo: 'Amigo(a)',
  outro: 'Outro',
};

// Usada quando o texto do desafio referencia a pessoa sem repetir o nome dela
// toda vez (ver seção 13: nome demais soa artificial) — ver resolvePersonText
// em src/engine/ChallengeEngine.ts.
export const RELATIONSHIP_GENERIC_PHRASE: Record<RelationshipType, string> = {
  companheiro: 'seu(sua) companheiro(a)',
  conjuge: 'seu(sua) cônjuge',
  namorado: 'seu(sua) namorado(a)',
  noivo: 'seu(sua) noivo(a)',
  filho: 'seu filho ou filha',
  pai: 'seu pai',
  mae: 'sua mãe',
  irmao: 'seu irmão ou irmã',
  avo: 'seu avô ou avó',
  neto: 'seu neto ou neta',
  sobrinho: 'seu sobrinho ou sobrinha',
  amigo: 'aquele(a) amigo(a)',
  outro: 'alguém importante pra você',
};

export const ALL_RELATIONSHIPS: RelationshipType[] = Object.keys(RELATIONSHIP_LABELS) as RelationshipType[];

// "Mora com você?" — três estados, não dois: a pessoa pode legitimamente preferir
// não informar, sem que isso vire um "não" (ver seção 3 do pedido).
export type LivesWithUser = boolean | null;

export interface ImportantPerson {
  id: string;
  name: string | null; // opcional — sem nome, o motor usa a frase genérica da relação
  relationship: RelationshipType;
  age: number | null; // opcional
  birthDate: string | null; // opcional, "YYYY-MM-DD" — pessoas cadastradas antes desse campo existir simplesmente não têm ele
  livesWithUser: LivesWithUser; // null = "prefiro não informar"
}
