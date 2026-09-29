import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/EmptyState';
import { DayCard } from '@/components/history/DayCard';
import { TabHeaderIcons } from '@/components/TabHeaderIcons';
import { spacing, useTheme } from '@/theme';
import { challengeInstanceRepository } from '@/storage/repositories/challengeInstanceRepository';
import { dayCycleService } from '@/services/dayCycleService';
import { profileService } from '@/services/profileService';
import type { DaySummary, UserProfile } from '@/types';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { focusToday } = useLocalSearchParams<{ focusToday?: string }>();
  const [summaries, setSummaries] = useState<DaySummary[] | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // useFocusEffect (não useEffect) porque as abas ficam montadas em memória — sem isso,
  // sair e voltar pra essa tela não recarrega os dados.
  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  async function load() {
    // As datas vêm direto dos desafios de verdade (challengeInstanceRepository.date) — não
    // existe nenhum registro de "dia" à parte (ver dayCycleService).
    const currentProfile = await profileService.getProfile();
    setProfile(currentProfile);
    const allInstances = await challengeInstanceRepository.getAll();
    const dates = [...new Set(allInstances.map((i) => i.date))].sort().reverse();
    const results = await Promise.all(dates.map((date) => dayCycleService.getSummaryForDate(date, currentProfile)));
    setSummaries(results);
  }

  if (!summaries) return <Screen edges={['top']} />;

  return (
    <Screen padded={false} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TabHeaderIcons />
        <AppText variant="title" style={styles.title}>
          Histórico
        </AppText>
        <AppText variant="body" color={colors.textMuted} style={styles.subtitle}>
          Seu progresso diário. Toque em um dia para ver detalhes e registrar como você se sentiu.
        </AppText>

        {summaries.length === 0 ? (
          <EmptyState emoji="📅" title="Sem dias registrados ainda" description="Volte amanhã para começar a construir sua sequência." />
        ) : (
          summaries.map((summary, index) => (
            // `focusToday` só faz sentido pro card mais recente (índice 0, já que `summaries` vem
            // ordenado por data decrescente) — ver notificationService.scheduleDayReflectionReminder.
            <DayCard key={summary.date} summary={summary} profile={profile} autoExpand={index === 0 && focusToday === '1'} />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.lg,
  },
});
