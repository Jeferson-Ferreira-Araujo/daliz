import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { radius, spacing, useTheme } from '@/theme';
import { MOVIE_GENRE_LABELS, MOVIE_GENRE_ORDER, type MovieGenre } from '@/data/movieGenres';

interface MovieGenrePickerProps {
  onSelect: (genre: MovieGenre) => void;
}

// Mesmo padrão visual/interativo do AbandonReasonPicker (lista de opções que aparece dentro do
// próprio card, sem abrir uma tela ou modal nova) — reaproveitado aqui pra escolha de gênero.
export function MovieGenrePicker({ onSelect }: MovieGenrePickerProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <AppText variant="bodyStrong" style={styles.question}>
        Escolha um gênero
      </AppText>
      <View>
        {MOVIE_GENRE_ORDER.map((genre) => (
          <Pressable key={genre} onPress={() => onSelect(genre)} style={[styles.row, { borderColor: colors.border }]}>
            <AppText variant="body" style={styles.rowLabel}>
              {MOVIE_GENRE_LABELS[genre]}
            </AppText>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  question: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    flex: 1,
  },
});
