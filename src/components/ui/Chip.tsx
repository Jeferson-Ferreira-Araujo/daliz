import React from 'react';
import { StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { AnimatedPressable } from './AnimatedPressable';
import { radius, spacing, useTheme } from '@/theme';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function Chip({ label, selected, onPress }: ChipProps) {
  const { colors } = useTheme();
  return (
    <AnimatedPressable
      onPress={onPress}
      style={[
        styles.base,
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <AppText variant="body" color={selected ? colors.onPrimary : colors.text}>
        {label}
      </AppText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
});
