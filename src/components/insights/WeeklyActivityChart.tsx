import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { radius, spacing, useTheme } from '@/theme';
import { DAY_OF_WEEK_LABELS, type DailyPresence } from '@/types';
import { dayOfWeekFor, parseISODate, toISODate } from '@/utils/date';
import { getCurrentDate } from '@/utils/now';

interface WeeklyActivityChartProps {
  days: DailyPresence[];
}

const CHART_HEIGHT = 90;
const MIN_BAR_HEIGHT = 6;

/** Barras dos últimos 7 dias — quantas ações chegaram por dia (presença, não conclusão). Um
 * único tom, sem distinção de resultado. Toca numa barra pra ver o valor exato. */
export function WeeklyActivityChart({ days }: WeeklyActivityChartProps) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);

  const max = Math.max(1, ...days.map((d) => d.total));
  const today = toISODate(getCurrentDate());
  const active = days.find((d) => d.date === selected) ?? days.find((d) => d.date === today) ?? days[days.length - 1];

  return (
    <View>
      <View style={styles.headerRow}>
        <AppText variant="bodyStrong">Atividade da semana</AppText>
        {active && (
          <AppText variant="caption" color={colors.textMuted}>
            {active.date === today ? 'Hoje' : formatDayLabel(active.date)} · {active.total}{' '}
            {active.total === 1 ? 'ação' : 'ações'}
          </AppText>
        )}
      </View>

      <View style={styles.barsRow}>
        {days.map((day) => {
          const isToday = day.date === today;
          const isActive = day.date === (selected ?? today);
          const barHeight = day.total === 0 ? MIN_BAR_HEIGHT : Math.max(MIN_BAR_HEIGHT, (day.total / max) * CHART_HEIGHT);
          return (
            <Pressable key={day.date} style={styles.barColumn} onPress={() => setSelected(day.date)}>
              <View style={[styles.track, { height: CHART_HEIGHT, backgroundColor: colors.surfaceMuted }]}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: isActive ? colors.primary : colors.primaryMuted,
                    },
                  ]}
                />
              </View>
              <AppText
                variant="caption"
                color={isToday ? colors.primary : colors.textMuted}
                style={isToday ? styles.todayLabel : undefined}
              >
                {formatDayLabel(day.date)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function formatDayLabel(dateISO: string): string {
  return DAY_OF_WEEK_LABELS[dayOfWeekFor(parseISODate(dateISO))];
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  track: {
    width: 22,
    borderRadius: radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  bar: {
    width: '100%',
    borderRadius: radius.sm,
  },
  todayLabel: {
    fontWeight: '700',
  },
});
