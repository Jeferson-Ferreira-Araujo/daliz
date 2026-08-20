import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { radius, spacing, useTheme } from '@/theme';
import { ABANDON_REASON_LABELS, type AbandonReason } from '@/types';

const ORDER: { reason: AbandonReason; icon: keyof typeof Ionicons.glyphMap }[] = [
  { reason: 'sem_tempo', icon: 'time-outline' },
  { reason: 'momento_inadequado', icon: 'alarm-outline' },
  { reason: 'esqueci', icon: 'notifications-outline' },
  { reason: 'nao_gostei', icon: 'thumbs-down-outline' },
  { reason: 'foi_dificil', icon: 'trending-up-outline' },
  { reason: 'nao_fez_sentido', icon: 'help-circle-outline' },
  { reason: 'outro', icon: 'create-outline' },
];

interface AbandonReasonPickerProps {
  onSelect: (reason: AbandonReason, detail?: string) => void;
}

export function AbandonReasonPicker({ onSelect }: AbandonReasonPickerProps) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<AbandonReason | null>(null);
  const [otherText, setOtherText] = useState('');

  function handlePress(reason: AbandonReason) {
    setSelected(reason);
    if (reason !== 'outro') {
      onSelect(reason);
    }
  }

  return (
    <View style={styles.container}>
      <AppText variant="bodyStrong" style={styles.question}>
        Por que você não conseguiu?
      </AppText>
      <View>
        {ORDER.map(({ reason, icon }) => (
          <Pressable
            key={reason}
            onPress={() => handlePress(reason)}
            style={[styles.row, { borderColor: colors.border }]}
          >
            <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.rowIcon} />
            <AppText variant="body" style={styles.rowLabel}>
              {ABANDON_REASON_LABELS[reason]}
            </AppText>
            <View
              style={[
                styles.radio,
                { borderColor: selected === reason ? colors.danger : colors.border },
                selected === reason && { backgroundColor: colors.danger },
              ]}
            />
          </Pressable>
        ))}
      </View>
      {selected === 'outro' && (
        <View style={styles.otherRow}>
          <TextInput
            style={[styles.otherInput, { borderColor: colors.border, color: colors.text }]}
            placeholder="Conta rapidinho..."
            placeholderTextColor={colors.textMuted}
            value={otherText}
            onChangeText={setOtherText}
            onSubmitEditing={() => onSelect('outro', otherText.trim())}
          />
          <Pressable style={styles.otherSend} onPress={() => onSelect('outro', otherText.trim())}>
            <AppText variant="bodyStrong" color={colors.primary}>
              OK
            </AppText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
  question: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    marginRight: spacing.sm,
  },
  rowLabel: {
    flex: 1,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  otherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  otherInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  otherSend: {
    paddingHorizontal: spacing.sm,
  },
});
