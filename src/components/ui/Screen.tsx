import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { spacing, useTheme } from '@/theme';

interface ScreenProps extends ViewProps {
  padded?: boolean;
  edges?: Edge[];
}

// KeyboardAvoidingView aqui garante que todo Screen (todas as telas do app, incluindo as com
// TextField) empurre o conteúdo pra cima quando o teclado abre — sem isso, campos perto do fim
// da tela ficam escondidos atrás do teclado. Sem efeito quando o teclado está fechado, então é
// seguro em telas sem nenhum input.
export function Screen({ style, padded = true, edges = ['top', 'bottom'], children, ...rest }: ScreenProps) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={edges}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.container, padded && styles.padded, style]} {...rest}>
          {children}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
});
