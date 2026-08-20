import type { Holiday } from '@/types/holiday';
import { brazilHolidays } from './brazil';

// Agregador único — preparado pra somar outros países depois (ver seção 6), sem
// precisar mexer em quem consome `allHolidays` (holidayService filtra por país ali).
export const allHolidays: Holiday[] = [...brazilHolidays];
