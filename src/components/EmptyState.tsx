import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { spacing, useTheme } from '@/theme';

interface EmptyStateProps {
  emoji?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji, icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      {emoji && <AppText style={styles.emoji}>{emoji}</AppText>}
      {icon && <Ionicons name={icon} size={36} color={colors.primary} style={styles.icon} />}
      <AppText variant="subtitle" style={styles.title}>
        {title}
      </AppText>
      {description && (
        <AppText variant="body" color={colors.textMuted} style={styles.description}>
          {description}
        </AppText>
      )}
      {actionLabel && onAction && (
        <Button label={actionLabel} variant="outline" size="sm" onPress={onAction} style={styles.action} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emoji: {
    fontSize: 40,
    // `lineHeight` explícito — sem isso, herda o da variante padrão ('body', 22), bem menor que
    // o `fontSize` de 40, e o emoji fica cortado em cima/embaixo (a caixa de linha do texto é
    // menor que o glifo colorido do emoji).
    lineHeight: 48,
    marginBottom: spacing.md,
  },
  icon: {
    marginBottom: spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.md,
  },
});
