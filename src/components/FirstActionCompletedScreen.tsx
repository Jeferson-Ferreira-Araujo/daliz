import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { brand } from '@/theme/palette';
import { radius, spacing } from '@/theme';

const WHITE = '#FFFFFF';
const WHITE_MUTED = 'rgba(255, 255, 255, 0.85)';
const CARD_TEXT_MUTED = '#5C6B85'; // mesmo tom de lightColors.textMuted — card é sempre branco aqui, independente do tema

export interface NextActionPreview {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

interface FirstActionCompletedScreenProps {
  completed: boolean;
  nextActionPreview: NextActionPreview;
  onContinue: () => void;
}

/**
 * Tela de transição de um instante, mostrada uma única vez logo depois que a primeira ação é
 * resolvida (ver Estado C em app/(main)/(tabs)/home.tsx). Gradiente + card branco + Button
 * "Continuar". `completed` diferencia a comemoração de quando a pessoa escreveu de verdade
 * (agradece por ter compartilhado) do caso de não ter concluído (tom neutro, sem fingir que ela
 * compartilhou algo). `nextActionPreview` nunca revela horário exato nem conteúdo — só uma
 * categoria qualitativa ("ainda hoje" / "amanhã"), pra manter a surpresa das próximas ações.
 */
export function FirstActionCompletedScreen({ completed, nextActionPreview, onContinue }: FirstActionCompletedScreenProps) {
  return (
    <LinearGradient colors={[brand.calm, brand.confidence]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.duration(350)}>
            <AppText variant="hero" color={WHITE} style={styles.title}>
              {completed ? '✨ Passo dado!' : 'Tudo bem, valeu por tentar!'}
            </AppText>
            <AppText variant="body" color={WHITE_MUTED} style={styles.subtitle}>
              {completed
                ? 'Obrigado por compartilhar isso com a gente. Nosso algoritmo já está preparando tudo para que as próximas ações te ajudem a evoluir todos os dias.'
                : 'Nosso algoritmo já está preparando tudo para que as próximas ações te ajudem a evoluir todos os dias.'}
            </AppText>
          </Animated.View>

          {/* Entra um pouco depois do título/subtítulo (delay), pra dar a sensação de sequência
              em vez de tudo aparecer de uma vez — é o elemento mais importante da tela (a
              expectativa concreta do que vem a seguir), então ganha o próprio momento. */}
          <Animated.View
            entering={FadeInUp.duration(350).delay(150)}
            style={[styles.card, { backgroundColor: WHITE }]}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="notifications-outline" size={20} color={brand.confidence} style={styles.cardIcon} />
              <AppText variant="bodyStrong">O que acontece agora?</AppText>
            </View>
            <AppText variant="body" color={CARD_TEXT_MUTED} style={styles.cardBody}>
              O Daliz vai considerar sua rotina, seu contexto e o seu dia para escolher os
              próximos momentos. As próximas ações chegam automaticamente quando fizer sentido para
              você.
            </AppText>
            <View style={styles.previewRow}>
              <Ionicons name={nextActionPreview.icon} size={18} color={brand.calm} style={styles.previewIcon} />
              <AppText variant="body" style={styles.previewText}>
                {nextActionPreview.text}
              </AppText>
            </View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeIn.duration(400).delay(300)} style={styles.footer}>
          <Button label="Continuar" onPress={onContinue} tone="primary" />
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardIcon: {
    marginRight: spacing.sm,
  },
  cardBody: {
    marginBottom: spacing.md,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIcon: {
    marginRight: spacing.sm,
  },
  previewText: {
    flex: 1,
  },
  footer: {
    paddingBottom: spacing.lg,
  },
});
