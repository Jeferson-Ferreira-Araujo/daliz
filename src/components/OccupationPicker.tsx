import React, { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './ui/AppText';
import { radius, spacing, useTheme } from '@/theme';
import { occupationService } from '@/services/occupationService';
import type { OccupationEntry, WorkContext } from '@/types';

interface OccupationPickerProps {
  label?: string;
  value: string;
  onChange: (occupation: string, workContext: WorkContext | null) => void;
}

/**
 * Campo de profissão com busca (ver CBO em src/services/occupationService.ts) — substitui o
 * `TextField` livre de antes. Escolher um item da lista preenche `occupation` + `workContext`
 * (usado pelo motor pra liberar ações do expediente específicas do contexto de trabalho, ver
 * ChallengeEngine.WORK_CONTEXT_TAGS). Digitar livre continua funcionando — profissão fora da
 * lista ou sem internet ainda salva normalmente, só sem contexto de trabalho associado.
 */
export function OccupationPicker({ label = 'Profissão', value, onChange }: OccupationPickerProps) {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<OccupationEntry[]>([]);

  useEffect(() => {
    if (!modalVisible) return;
    occupationService.ensureFreshOccupations().catch(() => {});
  }, [modalVisible]);

  useEffect(() => {
    if (!modalVisible) return;
    let cancelled = false;
    occupationService.searchOccupations(query).then((entries) => {
      if (!cancelled) setResults(entries);
    });
    return () => {
      cancelled = true;
    };
  }, [modalVisible, query]);

  function openPicker() {
    setQuery(value);
    setModalVisible(true);
  }

  function handleSelect(entry: OccupationEntry) {
    onChange(entry.termo, entry.workContext);
    setModalVisible(false);
  }

  function handleUseFreeText() {
    onChange(query.trim(), null);
    setModalVisible(false);
  }

  return (
    <View style={styles.container}>
      <AppText variant="caption" color={colors.textMuted} style={styles.label}>
        {label}
      </AppText>
      <Pressable onPress={openPicker} style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <AppText variant="bodyStrong" color={value ? colors.text : colors.textMuted}>
          {value || 'Ex: Motorista, Professor, Advogado...'}
        </AppText>
        <Ionicons name="search" size={18} color={colors.textMuted} />
      </Pressable>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Digite sua profissão"
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            />
            <Pressable onPress={() => setModalVisible(false)} hitSlop={12} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          <FlatList
            data={results}
            keyExtractor={(item) => item.codigo}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSelect(item)}
                style={[styles.resultRow, { borderBottomColor: colors.border }]}
              >
                <AppText variant="body">{item.termo}</AppText>
              </Pressable>
            )}
            ListFooterComponent={
              query.trim().length > 0 ? (
                <Pressable onPress={handleUseFreeText} style={styles.freeTextRow}>
                  <AppText variant="body" color={colors.primary}>
                    Usar "{query.trim()}" mesmo assim
                  </AppText>
                </Pressable>
              ) : null
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  modalContainer: {
    flex: 1,
    paddingTop: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 15,
  },
  closeButton: {
    padding: spacing.xs,
  },
  resultRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  freeTextRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
