import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useTheme } from '@/theme';

/**
 * Guarda de produção do Modo Desenvolvedor. Protege TODAS as telas
 * aninhadas em app/dev/*, mesmo se alguém tentar chegar aqui por um deep
 * link direto (ex: daliz://dev) — não depende só do toque
 * secreto estar escondido na UI.
 */
export default function DevLayout() {
  const { colors } = useTheme();

  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
