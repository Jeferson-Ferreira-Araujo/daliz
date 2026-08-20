// Regra de data extensível — fixa, "enésimo dia da semana do mês" (ex: 2º domingo de
// maio) ou relativa à Páscoa (ex: Carnaval = Páscoa - 47 dias). Nada de calcular data
// móvel espalhado pelo código: tudo passa por resolveDateForYear (ver src/utils/holidays.ts).
export type DateRule =
  | { type: 'fixed'; month: number; day: number }
  | { type: 'nth-weekday'; month: number; weekday: number; nth: number } // weekday: 0=domingo
  | { type: 'easter-offset'; offsetDays: number }; // dias em relação ao Domingo de Páscoa

export type HolidayCategory = 'family' | 'romantic' | 'celebration' | 'reflection' | 'gratitude' | 'national';
export type HolidayImportance = 'high' | 'medium' | 'low';

export interface Holiday {
  id: string;
  name: string;
  country: string; // "BR" — preparado pra outros países no futuro (ver seção 6)
  category: HolidayCategory;
  importance: HolidayImportance;
  dateRule: DateRule;
  // Quantos dias antes já entra na fase "approaching"/"near" — não é UM número só de
  // janela, são dois raios (ver seção 7: "7 dias antes: reflexão", "3 dias antes:
  // relacionamento", "1 dia antes: preparação" — simplificado em duas fases graduais).
  preparationWindowDays: number; // até aqui = "approaching"
  nearWindowDays: number; // até aqui (dentro de preparationWindowDays) = "near"
  influenceWindowDaysAfter: number; // dias depois que ainda contam como "after"
  tags: string[]; // casam com Challenge.eventTags
}

export type EventPhase = 'approaching' | 'near' | 'today' | 'after' | 'none';

export interface EventPhaseInfo {
  holidayId: string;
  name: string;
  occurrenceDate: string; // "YYYY-MM-DD" da ocorrência mais relevante (esse ano ou o ano vizinho)
  daysUntil: number; // negativo = já passou
  phase: EventPhase;
  importance: HolidayImportance;
  category: HolidayCategory;
  tags: string[];
}
