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
import { WeeklyImprovementCard } from '@/components/insights/WeeklyImprovementCard';
import { radius, spacing, useTheme } from '@/theme';
import { statsService } from '@/services/statsService';
import { analyticsService } from '@/services/analyticsService';
import { preferencesRepository } from '@/storage/repositories/preferencesRepository';
import type { AggregatedStats, WeeklyInsight } from '@/types';

export default function InsightsScreen() {
  const { colors } = useTheme();
  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [weeklyInsight, setWeeklyInsight] = useState<WeeklyInsight | null>(null);
  // null enquanto carrega — evita piscar a mensagem errada antes de saber se é a primeira visita.
  const [showIntro, setShowIntro] = useState<boolean | null>(null);

  // useFocusEffect (não useEffect) porque as abas ficam montadas em memória — sem isso,
  // sair e voltar pra essa tela não recarrega os dados nem reavalia a introdução.
  useFocusEffect(
    useCallback(() => {
      Promise.all([statsService.getAggregatedStats(), statsService.getWeeklyInsight(), preferencesRepository.get()]).then(
        ([aggregated, weekly, prefs]) => {
          setStats(aggregated);
          setWeeklyInsight(weekly);
          // "O que você melhorou?" (seção 19 do pedido) — só regista quando há algo pra ver,
          // mesmo sistema de log já usado pelo reminderService (console.log em dev por enquanto,
          // sem SDK de Analytics instalado no projeto).
          if (weekly.currentWeek.totalCompleted > 0) {
            analyticsService.log('weekly_insight_viewed', {
              completed_actions: weekly.currentWeek.totalCompleted,
              top_category: weekly.currentWeek.topHighlight?.categoria ?? null,
              top_category_count: weekly.currentWeek.topHighlight?.count ?? 0,
            });
          }
          // Só mostra a explicação detalhada na primeira vez que a pessoa vê a tela sem
          // nenhum desafio concluído ainda — nas próximas, é só "aguardando dados".
          if (aggregated.totalCompleted === 0 && !prefs.hasSeenInsightsIntro) {
            setShowIntro(true);
            preferencesRepository.save({ ...prefs, hasSeenInsightsIntro: true });
          } else {
            setShowIntro(false);
          }
        },
      );
    }, []),
  );

  if (!stats || !weeklyInsight || showIntro === null) return <Screen edges={['top']} />;

  // "Recebido" inclui desafios do dia ainda pendentes de confirmação — não é uma métrica
  // confiável pra decidir se já há dados o bastante pra mostrar. Só a conclusão conta.
  const hasData = stats.totalCompleted > 0;

  return (
    <Screen padded={false} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TabHeaderIcons />
        <AppText variant="title" style={styles.title}>
          Insights
        </AppText>
        <AppText variant="body" color={colors.textMuted} style={styles.subtitle}>
          Padrões sobre suas ações e hábitos.
        </AppText>

        <WeeklyImprovementCard week={weeklyInsight.currentWeek} />

        {!hasData ? (
          showIntro ? (
            <EmptyState
              emoji="📊"
              title="Seus insights aparecem aqui"
              description="Assim que você concluir sua primeira ação, esta tela passa a mostrar sua taxa de conclusão, as categorias com que você mais se identifica, os horários em que você rende melhor e as ações que mais gostou. Por enquanto, ainda não há dados suficientes."
            />
          ) : (
            <EmptyState
              emoji="⏳"
              title="Aguardando dados"
              description="Ainda não há nenhuma ação concluída — assim que você concluir a primeira, seus insights aparecem aqui."
            />
          )
        ) : (
          <>
            <StreakBanner currentStreak={stats.currentStreak} bestStreak={stats.bestStreak} />

            <View style={styles.statsRow}>
              <StatTile label="Recebidos" value={String(stats.totalReceived)} />
              <StatTile label="Concluídos" value={String(stats.totalCompleted)} />
              <StatTile label="Taxa" value={`${Math.round(stats.completionRate * 100)}%`} />
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <WeeklyActivityChart days={stats.dailyActivity} />
            </View>

            {stats.categoryBreakdown.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <AppText variant="bodyStrong" style={styles.cardTitle}>
                  Suas categorias
                </AppText>
                <CategoryBreakdownChart entries={stats.categoryBreakdown} />
              </View>
            )}

            {stats.hourlyDistribution.some((count) => count > 0) && (
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <HourlyBarChart hours={stats.hourlyDistribution} />
              </View>
            )}

            {stats.bestRatedChallengeIds.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <AppText variant="bodyStrong" style={styles.cardTitle}>
                  Ações que você mais gostou
                </AppText>
                {stats.bestRatedChallengeIds.slice(0, 5).map(({ challengeId, titulo }) => (
                  <AppText key={challengeId} variant="body" color={colors.textMuted} style={styles.listItem}>
                    ❤️ {titulo}
                  </AppText>
                ))}
              </View>
            )}
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
      <AppText variant="caption" color={colors.textMuted}>
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
    alignItems: 'center',
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    marginBottom: spacing.xs,
  },
  listItem: {
    marginTop: spacing.xs,
  },
});
