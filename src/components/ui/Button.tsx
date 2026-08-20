import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { radius, spacing, useTheme } from '@/theme';

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
type Variant = 'solid' | 'soft' | 'outline' | 'ghost';
type Size = 'md' | 'sm';

interface ButtonProps {
  label: string;
  onPress: () => void;
  tone?: Tone;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  tone = 'primary',
  variant = 'solid',
  size = 'md',
  disabled,
  style,
}: ButtonProps) {
  const { colors } = useTheme();

  const toneColor: Record<Tone, string> = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    neutral: colors.text,
  };
  const toneBg: Record<Tone, string> = {
    primary: colors.primaryMuted,
    success: colors.successBg,
    warning: colors.warningBg,
    danger: colors.dangerBg,
    neutral: colors.surfaceMuted,
  };

  const main = toneColor[tone];
  const soft = toneBg[tone];

  const variantStyle: ViewStyle =
    variant === 'solid'
      ? { backgroundColor: main }
      : variant === 'soft'
        ? { backgroundColor: soft }
        : variant === 'outline'
          ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: main }
          : { backgroundColor: 'transparent' };

  const textColor = variant === 'solid' ? (tone === 'primary' ? colors.onPrimary : colors.textInverse) : main;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        variantStyle,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <AppText variant={size === 'sm' ? 'pillLabel' : 'bodyStrong'} color={textColor}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
});
