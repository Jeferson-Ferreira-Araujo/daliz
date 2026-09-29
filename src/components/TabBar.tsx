import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { AppText } from '@/components/ui/AppText';
// Único import necessário pro banner — AdBannerSlot decide sozinho entre o anúncio real e o
// placeholder dependendo do ambiente (build EAS, Expo Go ou web), ver comentário lá.
import { AdBannerSlot } from '@/components/AdBannerSlot';
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

// Componente próprio (não inline dentro do .map de TabBar) só porque hooks (useSharedValue etc.)
// não podem ser chamados dentro de um callback de array — precisa ser uma função-componente de
// verdade. Escala discreta ao focar a aba (sem spring — nada de balançar/ultrapassar o tamanho
// final), só o suficiente pra dar um toque de resposta em vez da troca seca de ícone/cor de antes.
function TabIcon({ name, focused, color }: { name: keyof typeof Ionicons.glyphMap; focused: boolean; color: string }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withTiming(focused ? 1.05 : 1, { duration: 140, easing: Easing.out(Easing.quad) });
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={name} size={22} color={color} />
    </Animated.View>
  );
}

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, spacing.sm) }}>
      <AdBannerSlot />
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
              <TabIcon name={focused ? icon.active : icon.inactive} focused={focused} color={focused ? colors.text : colors.tabInactive} />
              <AppText
                variant="caption"
                color={focused ? colors.text : colors.tabInactive}
                style={styles.label}
              >
                {label}
              </AppText>
              {focused && (
                <Animated.View
                  entering={FadeIn.duration(150)}
                  style={[styles.indicator, { backgroundColor: colors.tabIndicator }]}
                />
              )}
              {!focused && <View style={styles.indicator} />}
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
