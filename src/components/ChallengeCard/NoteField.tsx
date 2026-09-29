import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { radius, spacing, useTheme } from '@/theme';

interface NoteFieldProps {
  value: string;
  onSave: (note: string) => void;
}

/** Campo de anotação inline, mostrado só em ações que pedem pra escrever/anotar algo (ver
 * ChallengeCard.asksToWrite). Depois de salva, a anotação fica visível como texto — não como um
 * campo editável — porque não faz sentido deixar a pessoa digitando/corrigindo livremente uma
 * resposta que ela já deu; "Editar" reabre o campo de propósito, de forma explícita, em vez de
 * qualquer toque na área virar edição sem querer. Enquanto não existe nada salvo, o campo continua
 * sempre editável (comportamento de antes) — o botão "Salvar" some depois de salvar, trocando por
 * essa mesma anotação em modo leitura. Ainda salva ao perder o foco também, como rede de segurança
 * (ex: sair da tela sem tocar em Salvar). */
export function NoteField({ value, onSave }: NoteFieldProps) {
  const { colors } = useTheme();
  const [text, setText] = useState(value);
  // Começa em modo leitura quando já existe uma anotação salva (ex: reabrindo o app depois) —
  // só entra em edição de novo por ação explícita da pessoa (digitar do zero, ou tocar "Editar").
  const [editing, setEditing] = useState(value.trim() === '');

  const isDirty = text.trim() !== (value ?? '').trim();

  function handleChangeText(next: string) {
    setText(next);
  }

  function handleSave() {
    onSave(text);
    setEditing(false);
  }

  function handleBlur() {
    if (isDirty) handleSave();
  }

  function handleEdit() {
    setEditing(true);
  }

  if (!editing) {
    return (
      <View style={styles.container}>
        <View style={[styles.savedNote, { backgroundColor: colors.surfaceMuted }]}>
          <AppText variant="body">{text}</AppText>
        </View>
        <Pressable onPress={handleEdit} hitSlop={8} style={styles.editLink}>
          <AppText variant="caption" color={colors.textMuted}>
            Editar
          </AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextField
        value={text}
        onChangeText={handleChangeText}
        onBlur={handleBlur}
        placeholder="Escreva aqui"
        multiline
        numberOfLines={3}
        autoFocus
        style={[styles.input, { backgroundColor: colors.surfaceMuted }]}
      />
      {isDirty && (
        <Button label="Salvar anotação" size="sm" variant="soft" tone="primary" onPress={handleSave} style={styles.saveButton} />
      )}
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
  saveButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  savedNote: {
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  editLink: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
});
