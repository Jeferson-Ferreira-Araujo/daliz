import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { spacing, useTheme } from '@/theme';

interface HourlyBarChartProps {
  hours: number[]; // 24 posições, índice = hora do dia
}

// Duas fileiras de 12h (madrugada+manhã / tarde+noite) em vez de uma única fileira de 24 —
// barras duas vezes mais largas (mais fáceis de ver/tocar) e cada fileira rotula seu próprio
// início e meio (0h/6h na primeira, 12h/18h na segunda), sempre na coluna certa.
const ROW_RANGES: { start: number; labeled: Set<number> }[] = [
  { start: 0, labeled: new Set([0, 6]) },
  { start: 12, labeled: new Set([12, 18]) },
];
const ROW_SIZE = 12;
const BAR_MAX_HEIGHT = 40;
const BAR_MIN_HEIGHT = 3;
const LABEL_ROW_HEIGHT = 16; // altura fixa reservada pro texto do rótulo — sem isso, o texto
// (position: absolute) não empurra nenhuma altura pro layout, e a fileira seguinte fica colada.

/**
 * Distribuição de HORÁRIOS DE ENTREGA (não de conclusão, que não existe mais) por hora do dia,
 * em duas fileiras de 12 barras (0h–11h e 12h–23h) — versão anterior (1 fileira de 24) ficava
 * pequena demais pra ler os rótulos num ecrã real. Antes dessa, era uma grade 12×2 com só 1
 * fileira de rótulos embaixo de tudo: como a grade quebrava em duas linhas, "12h" não ficava
 * embaixo da barra que representava 12h de verdade (essa estava na 2ª linha). Aqui cada fileira
 * tem seus próprios rótulos, sempre na coluna certa. Altura (não opacidade) codifica a
 * magnitude. Toque numa barra pra ver a hora e a contagem exatas no cabeçalho.
 */
export function HourlyBarChart({ hours }: HourlyBarChartProps) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<number | null>(null);

  const max = Math.max(1, ...hours);
  const activeHour = selected ?? hours.indexOf(max);
  const activeCount = hours[activeHour] ?? 0;

  return (
    <View>
      <View style={styles.headerRow}>
        <AppText variant="bodyStrong">Horários em que suas ações chegam</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {String(activeHour).padStart(2, '0')}h · {activeCount} {activeCount === 1 ? 'vez' : 'vezes'}
        </AppText>
      </View>

      {ROW_RANGES.map(({ start, labeled }) => (
        <View key={start} style={styles.row}>
          <View style={styles.chart}>
            {hours.slice(start, start + ROW_SIZE).map((count, offset) => {
              const hour = start + offset;
              const height = count === 0 ? BAR_MIN_HEIGHT : BAR_MIN_HEIGHT + (count / max) * (BAR_MAX_HEIGHT - BAR_MIN_HEIGHT);
              const isActive = hour === activeHour;
              return (
                <Pressable key={hour} onPress={() => setSelected(hour)} style={styles.barSlot} hitSlop={2}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height,
                        backgroundColor: count === 0 ? colors.surfaceMuted : colors.primary,
                        opacity: isActive || count === 0 ? 1 : 0.5,
                      },
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>

          <View style={styles.labelsRow}>
            {Array.from({ length: ROW_SIZE }, (_, offset) => start + offset).map((hour) => (
              <View key={hour} style={styles.labelSlot}>
                {labeled.has(hour) && (
                  <AppText variant="caption" color={colors.textMuted} numberOfLines={1} style={styles.labelText}>
                    {String(hour).padStart(2, '0')}h
                  </AppText>
                )}
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  row: {
    marginBottom: spacing.lg,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: BAR_MAX_HEIGHT,
  },
  barSlot: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 2,
  },
  bar: {
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  labelsRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    height: LABEL_ROW_HEIGHT,
  },
  labelSlot: {
    flex: 1,
    position: 'relative',
  },
  labelText: {
    position: 'absolute',
    top: 0,
    left: 2,
  },
});
