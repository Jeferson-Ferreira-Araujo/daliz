import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DevScreen, DevSection, DevBanner, DevChipButton, DevKeyValue } from '@/dev/DevUI';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { radius, spacing, useTheme } from '@/theme';
import { profileService } from '@/services/profileService';
import { devService } from '@/dev/devService';
import { devClock, useDevClockState } from '@/dev/devClock';
import { useDevContextState } from '@/dev/devContext';
import { SEASON_LABELS } from '@/utils/season';
import { WEATHER_TYPE_LABELS } from '@/types';
import type { ChallengeExplanation } from '@/engine/ChallengeEngine';
import type { AppContext, EventPhaseInfo, ImportantPerson, NormalizedWeather, UserProfile } from '@/types';

/** Move o relógio simulado pro próximo dia da semana pedido, na hora informada. weekday: 0=domingo. */
function jumpToNextWeekday(weekday: number, hour: number, minute: number) {
  const base = devClock.getSimulatedAt();
  const next = new Date(base);
  const diff = (weekday - next.getDay() + 7) % 7 || 7;
  next.setDate(next.getDate() + diff);
  next.setHours(hour, minute, 0, 0);
  devClock.setSimulatedAt(next);
}

function weather(overrides: Partial<NormalizedWeather>): NormalizedWeather {
  return {
    type: 'comfortable',
    temperature: 22,
    feelsLike: 22,
    precipitationProbability: 0,
    isGoodForOutdoor: true,
    isGoodForIndoor: true,
    isRaining: false,
    isVeryHot: false,
    isCold: false,
    isDay: true,
    ...overrides,
  };
}

function event(overrides: Partial<EventPhaseInfo>): EventPhaseInfo {
  return {
    holidayId: 'sim',
    name: 'Evento simulado',
    occurrenceDate: '2026-01-01',
    daysUntil: 0,
    phase: 'today',
    importance: 'high',
    category: 'family',
    tags: [],
    ...overrides,
  };
}

interface Scenario {
  key: string;
  label: string;
  description: string;
  /** Alguns cenários (seção 26) também mexem em `importantPeople` — por isso `apply`
   * recebe o perfil atual e pode ser assíncrono (setTestPeople persiste no storage). */
  apply: (profile: UserProfile | null) => void | Promise<void>;
}

function child(overrides?: Partial<ImportantPerson>): ImportantPerson {
  return { id: 'sim_filho', name: null, relationship: 'filho', age: 8, birthDate: null, livesWithUser: true, ...overrides };
}

function partner(overrides?: Partial<ImportantPerson>): ImportantPerson {
  return { id: 'sim_conjuge', name: null, relationship: 'conjuge', age: 30, birthDate: null, livesWithUser: true, ...overrides };
}

const SCENARIOS: Scenario[] = [
  {
    key: '1',
    label: 'Cenário 1',
    description: '30°C, sol, Dia dos Pais em 3 dias, domingo, folga',
    apply: () => {
      devService.setSimulatedWeather(weather({ type: 'sunny', temperature: 30, isGoodForOutdoor: true }));
      devService.setSimulatedEvent(event({ name: 'Dia dos Pais', daysUntil: 3, phase: 'near', tags: ['family', 'gratitude', 'relationship'] }));
      jumpToNextWeekday(0, 10, 0);
    },
  },
  {
    key: '2',
    label: 'Cenário 2',
    description: '15°C, chuva, Dia dos Pais hoje, domingo, folga',
    apply: () => {
      devService.setSimulatedWeather(weather({ type: 'rain', temperature: 15, isRaining: true, isGoodForOutdoor: false }));
      devService.setSimulatedEvent(event({ name: 'Dia dos Pais', daysUntil: 0, phase: 'today', tags: ['family', 'gratitude', 'relationship'] }));
      jumpToNextWeekday(0, 10, 0);
    },
  },
  {
    key: '3',
    label: 'Cenário 3',
    description: '32°C, calor extremo, nenhuma data especial, terça, trabalho',
    apply: () => {
      devService.setSimulatedWeather(weather({ type: 'hot', temperature: 32, isVeryHot: true, isGoodForOutdoor: false }));
      devService.setSimulatedEvent(null);
      jumpToNextWeekday(2, 14, 0);
    },
  },
  {
    key: '4',
    label: 'Cenário 4',
    description: '20°C, tempo agradável, Dia dos Namorados amanhã, sexta',
    apply: () => {
      devService.setSimulatedWeather(weather({ type: 'comfortable', temperature: 20, isGoodForOutdoor: true }));
      devService.setSimulatedEvent(event({ name: 'Dia dos Namorados', daysUntil: 1, phase: 'near', tags: ['romantic', 'relationship', 'gratitude'] }));
      jumpToNextWeekday(5, 18, 30);
    },
  },
  {
    key: '5',
    label: 'Cenário 5',
    description: 'Sem internet / sem clima disponível',
    apply: () => {
      devService.setSimulatedWeather(null);
      devService.setSimulatedEvent(null);
    },
  },
  // Cenários A-G (seção 26 do pedido de expansão da biblioteca) — testam a combinação
  // de clima + evento + presença/ausência de filhos ou parceiro no perfil.
  {
    key: 'A',
    label: 'Cenário A',
    description: 'Com filhos, domingo, folga, 22°C, clima agradável',
    apply: async (profile) => {
      if (profile) await devService.setTestPeople(profile, [child()]);
      devService.setSimulatedWeather(weather({ type: 'comfortable', temperature: 22, isGoodForOutdoor: true }));
      devService.setSimulatedEvent(null);
      jumpToNextWeekday(0, 10, 0);
    },
  },
  {
    key: 'B',
    label: 'Cenário B',
    description: 'Com filhos, domingo, chuva forte',
    apply: async (profile) => {
      if (profile) await devService.setTestPeople(profile, [child()]);
      devService.setSimulatedWeather(weather({ type: 'storm', temperature: 19, isRaining: true, isGoodForOutdoor: false }));
      devService.setSimulatedEvent(null);
      jumpToNextWeekday(0, 10, 0);
    },
  },
  {
    key: 'C',
    label: 'Cenário C',
    description: 'Sem filhos, Dia dos Pais próximo',
    apply: async (profile) => {
      if (profile) await devService.setTestPeople(profile, []);
      devService.setSimulatedWeather(null);
      devService.setSimulatedEvent(event({ name: 'Dia dos Pais', daysUntil: 4, phase: 'near', tags: ['family', 'gratitude', 'relationship'] }));
    },
  },
  {
    key: 'D',
    label: 'Cenário D',
    description: 'Com parceiro, Dia dos Namorados amanhã, chuva',
    apply: async (profile) => {
      if (profile) await devService.setTestPeople(profile, [partner()]);
      devService.setSimulatedWeather(weather({ type: 'rain', temperature: 18, isRaining: true, isGoodForOutdoor: false }));
      devService.setSimulatedEvent(event({ name: 'Dia dos Namorados', daysUntil: 1, phase: 'near', tags: ['romantic', 'relationship', 'gratitude'] }));
    },
  },
  {
    key: 'E',
    label: 'Cenário E',
    description: 'Sem parceiro, Dia dos Namorados',
    apply: async (profile) => {
      if (profile) await devService.setTestPeople(profile, []);
      devService.setSimulatedWeather(null);
      devService.setSimulatedEvent(event({ name: 'Dia dos Namorados', daysUntil: 0, phase: 'today', tags: ['romantic', 'relationship', 'gratitude'] }));
    },
  },
  {
    key: 'F',
    label: 'Cenário F',
    description: '32°C, calor extremo',
    apply: () => {
      devService.setSimulatedWeather(weather({ type: 'hot', temperature: 32, isVeryHot: true, isGoodForOutdoor: false }));
      devService.setSimulatedEvent(null);
    },
  },
  {
    key: 'G',
    label: 'Cenário G',
    description: '20°C, clima agradável, sábado',
    apply: () => {
      devService.setSimulatedWeather(weather({ type: 'comfortable', temperature: 20, isGoodForOutdoor: true }));
      devService.setSimulatedEvent(null);
      jumpToNextWeekday(6, 11, 0);
    },
  },
];

export default function DevContextScreen() {
  const { colors } = useTheme();
  const clock = useDevClockState();
  const contextOverride = useDevContextState();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [context, setContext] = useState<AppContext | null>(null);
  const [result, setResult] = useState<ChallengeExplanation | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const current = await profileService.getProfile();
    setProfile(current);
    if (current) setContext(await devService.getEffectiveContext(current));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function refreshContext() {
    if (!profile) return;
    setContext(await devService.getEffectiveContext(profile));
  }

  async function handleRefreshWeather() {
    if (!profile) return;
    setBusy(true);
    try {
      await devService.refreshWeatherNow(profile);
      await refreshContext();
    } finally {
      setBusy(false);
    }
  }

  async function handleClearOverrides() {
    devService.clearContextOverrides();
    await refreshContext();
  }

  async function handleTest() {
    if (!profile) return;
    setBusy(true);
    try {
      setResult(await devService.explainNextChallenge(profile));
    } finally {
      setBusy(false);
    }
  }

  return (
    <DevScreen title="Contexto Inteligente">
      {!profile && (
        <DevBanner tone="warning" text="Nenhum perfil encontrado. Use Cenários de Teste → Usuário Engajado para criar um perfil de teste primeiro." />
      )}

      {profile && context && (
        <>
          <DevSection title="Usuário">
            <DevKeyValue label="Cidade" value={profile.location ? `${profile.location.city}, ${profile.location.state}` : '—'} />
            <DevKeyValue label="País" value={profile.location?.country ?? '—'} />
            <DevKeyValue label="Localização disponível" value={profile.location ? 'Sim' : 'Não'} />
            <DevKeyValue label="Estação" value={SEASON_LABELS[context.season]} last />
          </DevSection>

          <DevSection title="Clima">
            {context.weather ? (
              <>
                <DevKeyValue label="Temperatura" value={`${Math.round(context.weather.temperature)}°C`} />
                <DevKeyValue label="Sensação térmica" value={context.weather.feelsLike != null ? `${Math.round(context.weather.feelsLike)}°C` : '—'} />
                <DevKeyValue label="Condição" value={WEATHER_TYPE_LABELS[context.weather.type]} />
                <DevKeyValue label="Chuva" value={`${context.weather.precipitationProbability}%`} last />
              </>
            ) : (
              <View style={styles.emptyBox}>
                <AppText variant="caption" color={colors.textMuted}>
                  Sem clima disponível — o motor ignora esse fator (algoritmo normal).
                </AppText>
              </View>
            )}
          </DevSection>

          <DevSection title="Calendário">
            {context.event ? (
              <>
                <DevKeyValue label="Data comemorativa" value={context.event.name} />
                <DevKeyValue label="Dias até o evento" value={String(context.event.daysUntil)} />
                <DevKeyValue label="Fase" value={context.event.phase} last />
              </>
            ) : (
              <View style={styles.emptyBox}>
                <AppText variant="caption" color={colors.textMuted}>
                  Nenhuma data comemorativa relevante agora.
                </AppText>
              </View>
            )}
          </DevSection>

          <DevSection title="Ações">
            <View style={styles.sectionBody}>
              <View style={styles.chipsRow}>
                <DevChipButton label="🔄 Buscar clima real agora" onPress={handleRefreshWeather} />
                <DevChipButton label="🧹 Limpar simulação" tone="danger" onPress={handleClearOverrides} />
              </View>
              {contextOverride.enabled && (
                <AppText variant="caption" color={colors.warning} style={styles.overrideHint}>
                  Contexto simulado ativo — os valores acima não vêm da API real.
                </AppText>
              )}
            </View>
          </DevSection>

          <DevSection title="Cenários de teste (seção 27)">
            <View style={styles.sectionBody}>
              {SCENARIOS.map((scenario) => (
                <View key={scenario.key} style={[styles.scenarioRow, { borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyStrong">{scenario.label}</AppText>
                    <AppText variant="caption" color={colors.textMuted}>
                      {scenario.description}
                    </AppText>
                  </View>
                  <Button
                    label="Aplicar"
                    size="sm"
                    variant="outline"
                    onPress={async () => {
                      await scenario.apply(profile);
                      await load();
                    }}
                  />
                </View>
              ))}
            </View>
          </DevSection>

          <DevSection title="Testar seleção">
            <View style={styles.sectionBody}>
              <AppText variant="caption" color={colors.textMuted} style={styles.contextHint}>
                Relógio: {formatDateTime(clock.simulatedAt)}
              </AppText>
              <Button label="Testar seleção" onPress={handleTest} disabled={busy} />
            </View>
          </DevSection>

          {result && (
            <DevSection title="Resultado">
              <View style={styles.sectionBody}>
                {result.instance ? (
                  <View style={[styles.resultCard, { backgroundColor: colors.surface }]}>
                    <AppText variant="bodyStrong">{result.instance.titulo}</AppText>
                    <AppText variant="caption" color={colors.textMuted} style={styles.resultMeta}>
                      {result.candidateCount} candidato(s) elegível(is) neste momento
                    </AppText>
                    <View style={styles.reasonsList}>
                      {result.reasons.map((reason, index) => (
                        <View key={index} style={styles.reasonRow}>
                          <Ionicons name="checkmark-circle" size={16} color={colors.success} style={styles.reasonIcon} />
                          <AppText variant="body" style={{ flex: 1 }}>
                            {reason}
                          </AppText>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <DevBanner text={result.reasons[0] ?? 'Nenhuma ação elegível agora.'} />
                )}
              </View>
            </DevSection>
          )}
        </>
      )}
    </DevScreen>
  );
}

function formatDateTime(date: Date): string {
  const d = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  const t = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return `${d} ${t}`;
}

const styles = StyleSheet.create({
  sectionBody: {
    padding: spacing.md,
  },
  emptyBox: {
    padding: spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  overrideHint: {
    marginTop: spacing.sm,
  },
  scenarioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  contextHint: {
    marginBottom: spacing.sm,
  },
  resultCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  resultMeta: {
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  reasonsList: {
    gap: spacing.xs,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reasonIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
});
