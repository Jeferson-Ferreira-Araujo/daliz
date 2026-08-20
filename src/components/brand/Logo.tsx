import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LogoMark } from './LogoMark';
import { AppText } from '@/components/ui/AppText';
import { spacing, useTheme } from '@/theme';
import { APP_NAME, APP_TAGLINE } from '@/constants/app';

type Layout = 'horizontal' | 'stacked' | 'icon-only';

interface LogoProps {
  size?: number;
  layout?: Layout;
  showTagline?: boolean;
}

/** Lockup completo da marca: ícone + "Daliz" (+ tagline opcional). */
export function Logo({ size = 56, layout = 'horizontal', showTagline = false }: LogoProps) {
  const { colors } = useTheme();

  if (layout === 'icon-only') return <LogoMark size={size} />;

  const textBlock = (
    <View style={layout === 'stacked' ? styles.stackedText : undefined}>
      <AppText variant="title" color={colors.text} style={layout === 'stacked' ? styles.centerText : undefined}>
        {APP_NAME}
      </AppText>
      {showTagline && (
        <AppText variant="caption" color={colors.textMuted} style={layout === 'stacked' ? styles.centerText : undefined}>
          {APP_TAGLINE}
        </AppText>
      )}
    </View>
  );

  if (layout === 'stacked') {
    return (
      <View style={styles.stackedContainer}>
        <LogoMark size={size} />
        {textBlock}
      </View>
    );
  }

  return (
    <View style={styles.horizontalContainer}>
      <LogoMark size={size} />
      {textBlock}
    </View>
  );
}

const styles = StyleSheet.create({
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stackedContainer: {
    alignItems: 'center',
  },
  stackedText: {
    marginTop: spacing.sm,
  },
  centerText: {
    textAlign: 'center',
  },
});
