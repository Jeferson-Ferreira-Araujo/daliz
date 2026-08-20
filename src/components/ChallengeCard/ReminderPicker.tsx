import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TimeField } from '@/components/ui/TimeField';
import { spacing, useTheme } from '@/theme';
import { getCurrentDate } from '@/utils/now';
import { timeToMinutes } from '@/utils/time';
import type { ReminderType } from '@/types';

interface ReminderPickerProps {
  // Quando já existe um lembrete ativo, o menu inicial vira "Alterar horário"/"Cancelar
  // lembrete" em vez das opções rápidas (ver seção 20 do pedido).
  activeReminderLabel?: string | null;
  onSchedule: (scheduledFor: Date, reminderType: ReminderType) => void;
  onCancelReminder: () => void;
  onClose: () => void;
}

// Só a próxima ocorrência de HH:mm a partir de agora — a UI já garante que não é hoje no
// passado (ver validação abaixo), então "amanhã" nunca é necessário aqui.
function nextOccurrenceOf(hhmm: string, now: Date): Date {
  const target = new Date(now);
  const minutes = timeToMinutes(hhmm);
  target.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return target;
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// Mesmo padrão visual/interativo do AbandonReasonPicker/MovieGenrePicker — lista de opções
// dentro do próprio card, sem tela ou modal nova.
export function ReminderPicker({ activeReminderLabel, onSchedule, onCancelReminder, onClose }: ReminderPickerProps) {
  const { colors } = useTheme();
  const [mode, setMode] = useState<'menu' | 'time'>('menu');
  const [timeValue, setTimeValue] = useState(() => formatTime(new Date(getCurrentDate().getTime() + 60 * 60 * 1000)));
  const [error, setError] = useState<string | null>(null);

  function handleQuickOption(hours: number, reminderType: ReminderType) {
    const now = getCurrentDate();
    onSchedule(new Date(now.getTime() + hours * 60 * 60 * 1000), reminderType);
  }

  function handleConfirmTime() {
    const now = getCurrentDate();
    const target = nextOccurrenceOf(timeValue, now);
    // Margem de 1 minuto: cobre tanto "horário já passou hoje" quanto o caso da seção 7
    // (horário praticamente no passado pelo tempo que levou até confirmar).
    if (target.getTime() <= now.getTime() + 60 * 1000) {
      setError('Esse horário já passou hoje. Escolha outro horário para receber o lembrete.');
      return;
    }
    setError(null);
    onSchedule(target, 'custom');
  }

  if (mode === 'time') {
    return (
      <View style={styles.container}>
        <AppText variant="bodyStrong" style={styles.question}>
          Escolher horário
        </AppText>
        <TimeField label="Lembrar às" value={timeValue} onChange={(value) => { setTimeValue(value); setError(null); }} />
        {error && (
          <AppText variant="caption" color={colors.danger} style={styles.error}>
            {error}
          </AppText>
        )}
        <View style={styles.row}>
          <Button label={`Lembrar às ${timeValue}`} size="sm" onPress={handleConfirmTime} />
          <Pressable onPress={() => setMode('menu')} style={styles.linkButton} hitSlop={8}>
            <AppText variant="caption" color={colors.textMuted}>
              Voltar
            </AppText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppText variant="bodyStrong" style={styles.question}>
        {activeReminderLabel ? `Lembrete às ${activeReminderLabel}` : 'Quando você quer ser lembrado?'}
      </AppText>
      <View>
        {activeReminderLabel && (
          <Pressable onPress={onCancelReminder} style={[styles.option, { borderColor: colors.border }]}>
            <AppText variant="body">Cancelar lembrete</AppText>
          </Pressable>
        )}
        <Pressable onPress={() => handleQuickOption(1, '1_hour')} style={[styles.option, { borderColor: colors.border }]}>
          <AppText variant="body">⏰ Em 1 hora</AppText>
        </Pressable>
        <Pressable onPress={() => handleQuickOption(3, '3_hours')} style={[styles.option, { borderColor: colors.border }]}>
          <AppText variant="body">⏰ Em 3 horas</AppText>
        </Pressable>
        <Pressable onPress={() => setMode('time')} style={[styles.option, { borderColor: colors.border }]}>
          <AppText variant="body">🕐 Escolher horário</AppText>
        </Pressable>
      </View>
      <Pressable onPress={onClose} style={styles.linkButton} hitSlop={8}>
        <AppText variant="caption" color={colors.textMuted}>
          Cancelar
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  question: {
    marginBottom: spacing.sm,
  },
  option: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  linkButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  error: {
    marginTop: spacing.xs,
  },
});
