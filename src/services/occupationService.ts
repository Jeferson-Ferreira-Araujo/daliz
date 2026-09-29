import { occupationRepository } from '@/storage/repositories/occupationRepository';
import { OCCUPATIONS_FALLBACK, deriveWorkContext } from '@/data/occupations';
import type { OccupationEntry } from '@/types';

// A CBO muda raríssimo (última atualização oficial foi um punhado de profissões novas por ano) —
// um cache de 90 dias evita bater na rede toda hora sem risco real de ficar desatualizado.
const CACHE_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;

// Dataset aberto da comunidade (não é uma API oficial — a CBO não tem uma mantida) — arquivo CSV
// estático servido via GitHub raw, sem autenticação/limite de uso. Ver plano: ~3.800 linhas,
// ~150-200KB, não entra no bundle do app (buscado em runtime e cacheado, ver ensureFreshOccupations).
const CBO_DATASET_URL = 'https://raw.githubusercontent.com/datasets-br/cbo/master/data/lista_canonicos.csv';

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/** Parser simples de `codigo,termo` — corta só no primeiro `,` (o termo nunca deveria ter vírgula
 * nos dados reais, mas cortar no primeiro em vez de fazer split(',') evita quebrar caso apareça). */
function parseCsv(raw: string): OccupationEntry[] {
  const lines = raw.split('\n');
  const entries: OccupationEntry[] = [];
  for (const line of lines.slice(1)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const separatorIndex = trimmed.indexOf(',');
    if (separatorIndex === -1) continue;
    const codigo = trimmed.slice(0, separatorIndex).trim();
    const termo = trimmed.slice(separatorIndex + 1).trim().replace(/^"|"$/g, '');
    if (!codigo || !termo) continue;
    entries.push({ codigo, termo, workContext: deriveWorkContext(termo) });
  }
  return entries;
}

function isCacheFresh(fetchedAt: string, now: Date, maxAgeMs: number): boolean {
  return now.getTime() - new Date(fetchedAt).getTime() < maxAgeMs;
}

function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export const occupationService = {
  /**
   * Busca a lista completa da CBO só se o cache estiver vencido ou ausente — chamado sob demanda
   * (ao abrir o `OccupationPicker`), nunca bloqueia o cadastro. Nunca lança: sem rede/timeout/
   * resposta inválida, mantém o cache anterior (ou nada, se nunca buscou com sucesso) — mesmo
   * padrão de `weatherService.ensureFreshWeather`, offline-first.
   */
  async ensureFreshOccupations(now: Date = new Date()): Promise<void> {
    const cached = await occupationRepository.get();
    if (cached && isCacheFresh(cached.fetchedAt, now, CACHE_MAX_AGE_MS)) return;

    try {
      const response = await fetchWithTimeout(CBO_DATASET_URL, FETCH_TIMEOUT_MS);
      if (!response.ok) throw new Error(`CBO dataset respondeu ${response.status}`);
      const raw = await response.text();
      const entries = parseCsv(raw);
      if (entries.length === 0) throw new Error('CBO dataset veio vazio');
      await occupationRepository.save({ fetchedAt: now.toISOString(), entries });
    } catch {
      // Sem internet, dataset fora do ar, ou formato mudou — mantém o cache anterior (pode ser
      // nada, e nesse caso searchOccupations cai pro fallback embutido).
    }
  },

  /** Busca local (cache atual, ou o fallback embutido se nunca buscou com sucesso) — nunca bate
   * rede (quem quer dado fresco chama `ensureFreshOccupations` antes, ver OccupationPicker). */
  async searchOccupations(query: string): Promise<OccupationEntry[]> {
    const cached = await occupationRepository.get();
    const pool = cached?.entries ?? OCCUPATIONS_FALLBACK;
    const normalizedQuery = normalizeForSearch(query.trim());
    if (!normalizedQuery) return pool.slice(0, 30);
    return pool.filter((entry) => normalizeForSearch(entry.termo).includes(normalizedQuery)).slice(0, 30);
  },
};
