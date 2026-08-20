import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { radius, spacing, useTheme } from '@/theme';

interface SelectableCardProps {
  icon: string;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}

/** Cartão de seleção com título + resumo do que a opção representa — usado quando
 * um Chip simples não dá contexto suficiente pra uma decisão informada. */
export function SelectableCard({ icon, title, description, selected, onPress }: SelectableCardProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.base,
        {
          backgroundColor: selected ? colors.primaryMuted : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <AppText variant="title" style={styles.icon}>
        {icon}
      </AppText>
      <View style={styles.textBlock}>
        <AppText variant="bodyStrong" color={colors.text}>
          {title}
        </AppText>
        <AppText variant="caption" color={colors.textMuted} style={styles.description}>
          {description}
        </AppText>
      </View>
      <View
        style={[
          styles.check,
          { backgroundColor: selected ? colors.primary : 'transparent', borderColor: selected ? colors.primary : colors.border },
        ]}
      >
        {selected && <Ionicons name="checkmark" size={14} color={colors.onPrimary} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  icon: {
    lineHeight: 24,
  },
  textBlock: {
    flex: 1,
  },
  description: {
    marginTop: 2,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
});
