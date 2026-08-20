import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing, useTheme } from '@/theme';
import { shareProgress } from '@/utils/shareProgress';

/**
 * Linha de ícones do topo, igual em todas as abas principais (Hoje, Histórico, Insights,
 * Perfil): menu (abre o menu lateral — marca, sobre o app, redes sociais, contato) à
 * esquerda, compartilhar + configurações (ajustes de fato) à direita. Informação e ajuste
 * são conceitos separados de propósito — ver menu.tsx vs settings.tsx.
 */
export function TabHeaderIcons() {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Pressable onPress={() => router.push('/(main)/menu')} hitSlop={12}>
        <Ionicons name="menu" size={24} color={colors.text} />
      </Pressable>
      <View style={styles.icons}>
        <Pressable onPress={shareProgress} hitSlop={12}>
          <Ionicons name="share-social-outline" size={22} color={colors.text} />
        </Pressable>
        <Pressable onPress={() => router.push('/(main)/settings')} hitSlop={12}>
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});
