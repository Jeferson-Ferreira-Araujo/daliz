import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TIMING_DESCRIPTIONS, TIMING_LABELS } from '@/engine/challengeTiming';
import { spacing, radius, useTheme } from '@/theme';
import type { ChallengeTiming } from '@/types';

type Point = {
  image: ImageSourcePropType;
  title: string;
  description: string;
  /** Só o 1º ponto: detalha os 3 tipos de timing como lista, não como texto corrido. */
  timingBreakdown?: boolean;
};

const TIMING_ORDER: ChallengeTiming[] = ['now', 'today', 'contextual'];

const POINTS: Point[] = [
  {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('../../assets/brand/icon-notificacao.png'),
    title: 'Pequenas ações, no momento certo',
    description:
      'Ao longo do dia, você recebe pequenas ações — nada de grandes mudanças, só coisas simples que, juntas, transformam seus dias. Cada uma chega classificada num destes 3 tipos:',
    timingBreakdown: true,
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('../../assets/brand/icon-progresso.png'),
    title: 'Feito sob medida, todo dia',
    description:
      'Nada de lista fixa: as ações mudam com sua rotina, seus interesses e até o clima do dia — sempre pensadas pra fazer sentido naquele momento.',
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('../../assets/brand/icon-novo-dia.png'),
    title: 'Do seu jeito, todos os dias',
    description:
      'As ações continuam chegando ao longo do dia, na sua rotina — de manhã, à tarde ou de madrugada. A gente só respeita seu horário de dormir (e o de trabalho, se você preferir) pra nunca notificar na hora errada.',
  },
];

export default function ConceptScreen() {
  const { colors } = useTheme();

  function handleNext() {
    router.push('/onboarding/profile');
  }

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {POINTS.map((point, index) => (
          <View key={index} style={styles.pointRow}>
            <Image source={point.image} style={styles.pointImage} resizeMode="contain" />
            <View style={styles.pointText}>
              <AppText variant="title">{point.title}</AppText>
              <AppText variant="body" color={colors.textMuted} style={styles.pointDescription}>
                {point.description}
              </AppText>
              {point.timingBreakdown && (
                <View style={styles.timingList}>
                  {TIMING_ORDER.map((timing) => (
                    <View
                      key={timing}
                      style={[styles.timingItem, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
                    >
                      <AppText variant="bodyStrong">{TIMING_LABELS[timing]}</AppText>
                      <AppText variant="caption" color={colors.textMuted} style={styles.timingDescription}>
                        {TIMING_DESCRIPTIONS[timing]}
                      </AppText>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Vamos lá" onPress={handleNext} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  pointImage: {
    width: 56,
    height: 56,
  },
  pointText: {
    flex: 1,
  },
  pointDescription: {
    marginTop: spacing.xs,
  },
  timingList: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  timingItem: {
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  timingDescription: {
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
