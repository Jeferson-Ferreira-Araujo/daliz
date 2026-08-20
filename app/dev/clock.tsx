import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { DevScreen, DevSection, DevKeyValue, DevChipButton } from '@/dev/DevUI';
import { devClock, useDevClockState } from '@/dev/devClock';
import { AppText } from '@/components/ui/AppText';
import { spacing, useTheme } from '@/theme';

const TIME_PRESETS: [number, number][] = [
  [0, 0],
  [1, 0],
  [6, 0],
  [9, 0],
  [12, 0],
  [18, 0],
  [21, 0],
  [23, 59],
];

export default function DevClockScreen() {
  const { colors } = useTheme();
  const clock = useDevClockState();
  const [realNow, setRealNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setRealNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DevScreen title="Relógio Simulado">
      <DevSection title="Data e hora">
        <DevKeyValue label="Data real" value={formatDate(realNow)} />
        <DevKeyValue label="Hora real" value={formatTime(realNow)} last />
      </DevSection>

      <DevSection title="Relógio simulado">
        <View style={styles.switchRow}>
          <AppText variant="body" style={{ flex: 1 }}>
            Ativar relógio simulado
          </AppText>
          <Switch
            value={clock.enabled}
            onValueChange={(value) => (value ? devClock.setEnabled(true) : devClock.reset())}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
        {clock.enabled && <DevKeyValue label="Data simulada" value={formatDate(clock.simulatedAt)} last />}
      </DevSection>

      {clock.enabled && (
        <>
          <DevSection title="Horário simulado">
            <View style={styles.chipWrap}>
              {TIME_PRESETS.map(([h, m]) => (
                <DevChipButton
                  key={`${h}:${m}`}
                  label={`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`}
                  onPress={() => devClock.setTimeOfDay(h, m)}
                />
              ))}
              <DevChipButton label="Agora" tone="primary" onPress={() => devClock.syncToRealNow()} />
            </View>
          </DevSection>

          <DevSection title="Ajustes rápidos">
            <View style={styles.chipWrap}>
              <DevChipButton label="-1 dia" onPress={() => devClock.adjust(-24 * 60 * 60 * 1000)} />
              <DevChipButton label="+1 dia" onPress={() => devClock.adjust(24 * 60 * 60 * 1000)} />
              <DevChipButton label="-1 hora" onPress={() => devClock.adjust(-60 * 60 * 1000)} />
              <DevChipButton label="+1 hora" onPress={() => devClock.adjust(60 * 60 * 1000)} />
              <DevChipButton label="-10 min" onPress={() => devClock.adjust(-10 * 60 * 1000)} />
              <DevChipButton label="+10 min" onPress={() => devClock.adjust(10 * 60 * 1000)} />
            </View>
            <AppText variant="caption" color={colors.textMuted} style={styles.hint}>
              Depois de mudar o relógio, volte pra tela Hoje — ela recalcula as ações (expira pendências de
              períodos já dormidos, gera as próximas) ao ganhar foco, usando a mesma regra real do app.
            </AppText>
          </DevSection>
        </>
      )}
    </DevScreen>
  );
}

function formatDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} (${WEEKDAYS[date.getDay()]})`;
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

const styles = StyleSheet.create({
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
  },
  hint: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
});
