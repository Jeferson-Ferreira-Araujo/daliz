import React from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { radius, spacing, useTheme } from '@/theme';

interface DevScreenProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export function DevScreen({ title, children, onClose }: DevScreenProps) {
  const { colors } = useTheme();
  return (
    <Screen padded={false} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onClose ?? (() => router.back())} hitSlop={12}>
          <Ionicons name={onClose ? 'close' : 'chevron-back'} size={22} color={colors.text} />
        </Pressable>
        <AppText variant="title">{title}</AppText>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>{children}</ScrollView>
    </Screen>
  );
}

export function DevSection({ title, children, style }: { title: string; children: React.ReactNode; style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, style]}>
      <AppText variant="caption" color={colors.textMuted} style={styles.sectionTitle}>
        {title.toUpperCase()}
      </AppText>
      <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>{children}</View>
    </View>
  );
}

interface DevRowProps {
  label: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'default' | 'primary' | 'danger';
  onPress: () => void;
  disabled?: boolean;
  last?: boolean;
}

export function DevRow({ label, description, icon, tone = 'default', onPress, disabled, last }: DevRowProps) {
  const { colors } = useTheme();
  const toneColor = tone === 'primary' ? colors.primary : tone === 'danger' ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }, disabled && { opacity: 0.4 }]}
    >
      {icon && <Ionicons name={icon} size={18} color={toneColor} style={styles.rowIcon} />}
      <View style={{ flex: 1 }}>
        <AppText variant="body" color={toneColor}>
          {label}
        </AppText>
        {description && (
          <AppText variant="caption" color={colors.textMuted}>
            {description}
          </AppText>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

export function DevKeyValue({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.kvRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <AppText variant="caption" color={colors.textMuted}>
        {label}
      </AppText>
      <AppText variant="body">{value}</AppText>
    </View>
  );
}

export function DevChipButton({ label, onPress, tone = 'default' }: { label: string; onPress: () => void; tone?: 'default' | 'primary' | 'danger' }) {
  const { colors } = useTheme();
  const bg = tone === 'primary' ? colors.primaryMuted : tone === 'danger' ? colors.dangerBg : colors.surfaceMuted;
  const fg = tone === 'primary' ? colors.primary : tone === 'danger' ? colors.danger : colors.text;
  return (
    <Pressable onPress={onPress} style={[styles.chip, { backgroundColor: bg }]}>
      <AppText variant="pillLabel" color={fg}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function DevBanner({ text, tone = 'default' }: { text: string; tone?: 'default' | 'warning' | 'success' }) {
  const { colors } = useTheme();
  const bg = tone === 'warning' ? colors.warningBg : tone === 'success' ? colors.successBg : colors.primaryMuted;
  const fg = tone === 'warning' ? colors.warning : tone === 'success' ? colors.success : colors.primary;
  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      <AppText variant="caption" color={fg}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  sectionCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowIcon: {
    marginRight: spacing.sm,
  },
  kvRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  banner: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
});
