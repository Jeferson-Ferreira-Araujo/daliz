import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextField } from '@/components/ui/TextField';
import { spacing, useTheme } from '@/theme';

interface NoteFieldProps {
  value: string;
  onSave: (note: string) => void;
}

/** Campo de anotação inline, mostrado só em ações que pedem pra escrever/anotar algo (ver
 * ChallengeCard.asksToWrite). Salva ao perder o foco — sem botão "Salvar" explícito, diferente do
 * diário do dia (DayCard, no Histórico): aqui é um campo dentro de uma lista de cards roláveis,
 * um botão por card pesaria a tela. */
export function NoteField({ value, onSave }: NoteFieldProps) {
  const { colors } = useTheme();
  const [text, setText] = useState(value);

  function handleBlur() {
    if (text.trim() !== (value ?? '').trim()) onSave(text);
  }

  return (
    <View style={styles.container}>
      <TextField
        value={text}
        onChangeText={setText}
        onBlur={handleBlur}
        placeholder="Escreva aqui"
        multiline
        numberOfLines={3}
        style={[styles.input, { backgroundColor: colors.surfaceMuted }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  input: {
    minHeight: 64,
    textAlignVertical: 'top',
    marginBottom: 0,
  },
});
