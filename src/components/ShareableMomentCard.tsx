import React from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { radius, spacing, useTheme } from '@/theme';
import { buildShareableCardText, buildShareableMessage } from '@/data/shareableMomentCopy';
import type { ChallengeInstance } from '@/types';

interface ShareableMomentCardProps {
  instance: ChallengeInstance;
}

/** Um momento do dia que valeu a pena guardar (ver isShareableMoment em shareableMomentCopy.ts) —
 * visual deliberadamente mais "quente" que o ChallengeCard normal (fundo primário suave, sem
 * timing/botões de ação), porque aqui a instância já foi reagida com "Fez muito bem", é só
 * celebração. */
export function ShareableMomentCard({ instance }: ShareableMomentCardProps) {
  const { colors } = useTheme();

  async function handleShare() {
    try {
      await Share.share({ message: buildShareableMessage(instance) });
    } catch {
      // pessoa cancelou ou a plataforma não suporta — sem problema
    }
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.primaryMuted }]}>
      <AppText variant="body" style={styles.text}>
        {buildShareableCardText(instance)}
      </AppText>
      <Button label="Compartilhar" variant="outline" size="sm" onPress={handleShare} style={styles.shareButton} />
    </View>
  );
}

// Largura fixa pensada pro carrossel horizontal (ver home.tsx) — grande o suficiente pra ler o
// texto confortavelmente, mas deixa uma "espiadinha" do próximo card na borda da tela.
const CARD_WIDTH = 280;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  text: {
    marginBottom: spacing.md,
  },
  shareButton: {
    alignSelf: 'flex-start',
  },
});
