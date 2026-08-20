import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/theme';

export default function MainLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="menu"
        options={{ animation: 'slide_from_left', presentation: 'transparentModal', contentStyle: { backgroundColor: 'transparent' } }}
      />
      <Stack.Screen name="settings" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="privacy-policy" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
