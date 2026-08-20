import React from 'react';
import { StyleSheet, View } from 'react-native';
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
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emoji: {
    fontSize: 40,
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
