import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { radius, spacing, useTheme } from '@/theme';
import { CHALLENGE_REACTION_LABELS, type ChallengeReaction } from '@/types';

export const REACTION_EMOJI: Record<ChallengeReaction, string> = {
  fez_muito_bem: '❤️',
  foi_bom: '🙂',
  foi_normal: '😐',
  nao_fez_diferenca: '😕',
  foi_dificil: '😣',
};

const ORDER: ChallengeReaction[] = ['fez_muito_bem', 'foi_bom', 'foi_normal', 'nao_fez_diferenca', 'foi_dificil'];

interface ReactionPickerProps {
  selected?: ChallengeReaction | null;
  onSelect: (reaction: ChallengeReaction) => void;
}

export function ReactionPicker({ selected, onSelect }: ReactionPickerProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <AppText variant="bodyStrong" style={styles.question}>
        Como essa ação fez você se sentir?
      </AppText>
      <View style={styles.options}>
        {ORDER.map((reaction) => {
          const isSelected = reaction === selected;
          return (
            <Pressable key={reaction} onPress={() => onSelect(reaction)} style={styles.option}>
              <View
                style={[
                  styles.emojiCircle,
                  { backgroundColor: colors.surface, borderColor: isSelected ? colors.primary : colors.border },
                  isSelected && { borderWidth: 2 },
                ]}
              >
                <AppText style={styles.emoji}>{REACTION_EMOJI[reaction]}</AppText>
              </View>
              <AppText variant="caption" color={colors.textMuted} style={styles.optionLabel}>
                {CHALLENGE_REACTION_LABELS[reaction]}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
  question: {
    marginBottom: spacing.md,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  option: {
    alignItems: 'center',
    width: '19%',
    minWidth: 58,
    marginBottom: spacing.sm,
  },
  emojiCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emoji: {
    fontSize: 22,
    // `lineHeight` explícito, maior que o `fontSize` — sem isso, herda o da variante padrão
    // ('body', 22, igual ao fontSize), e o emoji fica cortado em cima/embaixo.
    lineHeight: 28,
  },
  optionLabel: {
    textAlign: 'center',
    fontSize: 11,
  },
});
