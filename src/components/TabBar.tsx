import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { AppText } from '@/components/ui/AppText';
// Placeholder do banner AdMob — trocar por
// `import { AdBannerNative as AdBanner } from '@/components/AdBannerNative'` só na hora do build
// final de produção (ver comentário em AdBanner.tsx pro porquê).
import { AdBanner } from '@/components/AdBanner';
import { spacing, useTheme } from '@/theme';

const ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  home: { active: 'home', inactive: 'home-outline' },
  history: { active: 'time', inactive: 'time-outline' },
  insights: { active: 'stats-chart', inactive: 'stats-chart-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};

const LABELS: Record<string, string> = {
  home: 'Hoje',
  history: 'Histórico',
  insights: 'Insights',
  profile: 'Perfil',
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, spacing.sm) }}>
      <AdBanner />
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const icon = ICONS[route.name] ?? ICONS.home;
          const label = LABELS[route.name] ?? route.name;

          function handlePress() {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          }

          return (
            <Pressable key={route.key} onPress={handlePress} style={styles.tab} hitSlop={8}>
              <Ionicons
                name={focused ? icon.active : icon.inactive}
                size={22}
                color={focused ? colors.text : colors.tabInactive}
              />
              <AppText
                variant="caption"
                color={focused ? colors.text : colors.tabInactive}
                style={styles.label}
              >
                {label}
              </AppText>
              <View style={[styles.indicator, { backgroundColor: focused ? colors.tabIndicator : 'transparent' }]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  label: {
    fontSize: 11,
  },
  indicator: {
    marginTop: spacing.xs,
    width: 18,
    height: 3,
    borderRadius: 2,
  },
});
