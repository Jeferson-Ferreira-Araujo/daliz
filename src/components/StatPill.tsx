import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { radius, spacing, useTheme } from '@/theme';

interface StatPillProps {
  icon: keyof typeof Ionicons.glyphMap;
  tone: string;
  toneBg: string;
  value: string;
  label: string;
}

export function StatPill({ icon, tone, toneBg, value, label }: StatPillProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: toneBg }]}>
        <Ionicons name={icon} size={18} color={tone} />
      </View>
      <AppText variant="statNumber" style={styles.value}>
        {value}
      </AppText>
      <AppText variant="caption" color={colors.textMuted}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  value: {
    marginBottom: 1,
  },
});
