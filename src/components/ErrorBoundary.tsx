import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { crashService } from '@/services/crashService';

interface ErrorBoundaryState {
  hasError: boolean;
}

// Cores fixas e componentes nativos puros (Text/Pressable, não AppText/Button) de propósito: o
// fallback abaixo substitui a árvore inteira, ThemeProvider incluso (ver app/_layout.tsx, onde
// ErrorBoundary envolve ThemeProvider por fora) — qualquer componente que dependa de useTheme()
// aqui dentro quebraria de novo, sem nenhum boundary por cima pra pegar esse segundo erro.
const COLORS = { background: '#FCFCFD', text: '#0B1B3A', textMuted: '#64748B', primary: '#3577FF' };

/**
 * Único ponto de captura de erros de render de toda a árvore (ver app/_layout.tsx) — sem isso,
 * qualquer erro não tratado em um componente derruba o app inteiro pra uma tela branca, sem
 * nenhum relato chegando no Crashlytics. `componentDidCatch` só existe como classe (React não
 * tem hook equivalente).
 */
export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    crashService.recordError(error, `render_error: ${info.componentStack?.slice(0, 200) ?? ''}`);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={[styles.container, { backgroundColor: COLORS.background }]}>
        <Text style={[styles.title, { color: COLORS.text }]}>Ops, algo deu errado 🌱</Text>
        <Text style={[styles.body, { color: COLORS.textMuted }]}>
          Já registramos o problema. Tente continuar de novo.
        </Text>
        <Pressable style={[styles.button, { backgroundColor: COLORS.primary }]} onPress={this.handleReset}>
          <Text style={styles.buttonLabel}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
