import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/EmptyState';
import { TabHeaderIcons } from '@/components/TabHeaderIcons';
import { StreakBanner } from '@/components/insights/StreakBanner';
import { WeeklyActivityChart } from '@/components/insights/WeeklyActivityChart';
import { CategoryBreakdownChart } from '@/components/insights/CategoryBreakdownChart';
import { HourlyBarChart } from '@/components/insights/HourlyBarChart';
import { ReactionBreakdownChart } from '@/components/insights/ReactionBreakdownChart';
import { RecentNotesCard } from '@/components/insights/RecentNotesCard';
import { radius, spacing, useTheme } from '@/theme';
import { statsService } from '@/services/statsService';
import type { PresenceSummary } from '@/types';

/**
 * Sem Concluir/Não consegui obrigatório (ver plano de migração "Novo modelo de ações"), esta tela
 * mostra sobretudo PRESENÇA: quantas ações chegaram, com que frequência, em quais categorias e o
 * que a pessoa escreveu nas anotações. A seção "Como você tem se sentido" é a exceção: desde que o
 * ReactionPicker voltou (ver ChallengeCard), marcar uma reação é sinal voluntário de "feito" — só
 * aparece quando há pelo menos uma reação marcada, nunca cobra a pessoa por não ter marcado. Como
 * a primeira ação já é entregue durante o onboarding (ver dayCycleService.requestFirstAction),
 * praticamente todo mundo que chega aqui já tem algum dado — o empty-state existe só pro caso raro
 * de zero ações entregues.
 */
export default function InsightsScreen() {
  const { colors } = useTheme();
  const [stats, setStats] = useState<PresenceSummary | null>(null);

  // useFocusEffect (não useEffect) porque as abas ficam montadas em memória — sem isso,
  // sair e voltar pra essa tela não recarrega os dados.
  useFocusEffect(
    useCallback(() => {
      statsService.getPresenceSummary().then(setStats);
    }, []),
  );

  if (!stats) return <Screen edges={['top']} />;

  const hasData = stats.totalDelivered > 0;

  return (
    <Screen padded={false} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TabHeaderIcons />
        <AppText variant="title" style={styles.title}>
          Insights
        </AppText>
        <AppText variant="body" color={colors.textMuted} style={styles.subtitle}>
          Como as ações têm chegado até você.
        </AppText>

        {!hasData ? (
          <EmptyState
            emoji="📊"
            title="Seus insights aparecem aqui"
            description="Assim que suas primeiras ações chegarem, esta tela passa a mostrar sua frequência, as categorias mais presentes e os horários em que elas costumam chegar."
          />
        ) : (
          <>
            <StreakBanner currentStreak={stats.currentStreak} bestStreak={stats.bestStreak} />

            <View style={styles.statsRow}>
              <StatTile label="Ações recebidas essa semana" value={String(stats.deliveredThisWeek)} />
              <StatTile label="Dias ativos essa semana" value={String(stats.daysActiveThisWeek)} />
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <WeeklyActivityChart days={stats.dailyActivity} />
            </View>

            {stats.categoryBreakdown.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <AppText variant="bodyStrong" style={styles.cardTitle}>
                  Suas categorias (últimos 30 dias)
                </AppText>
                <CategoryBreakdownChart entries={stats.categoryBreakdown} />
              </View>
            )}

            {stats.hourlyDistribution.some((count) => count > 0) && (
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <HourlyBarChart hours={stats.hourlyDistribution} />
              </View>
            )}

            {stats.reactionBreakdown.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <AppText variant="bodyStrong" style={styles.cardTitle}>
                  Como você tem se sentido · {stats.completedCount} {stats.completedCount === 1 ? 'ação marcada' : 'ações marcadas'}
                </AppText>
                <ReactionBreakdownChart entries={stats.reactionBreakdown} />
              </View>
            )}

            {stats.recentNotes.length > 0 && <RecentNotesCard notes={stats.recentNotes} />}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statTile, { backgroundColor: colors.surface }]}>
      <AppText variant="title">{value}</AppText>
      <AppText variant="caption" color={colors.textMuted} style={styles.statLabel}>
        {label}
      </AppText>
    </View>
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
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  statTile: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  statLabel: {
    textAlign: 'center',
    marginTop: 2,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    marginBottom: spacing.xs,
  },
});
