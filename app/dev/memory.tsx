import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { DevScreen, DevSection, DevRow, DevKeyValue, DevBanner } from '@/dev/DevUI';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { spacing, useTheme } from '@/theme';
import { devService } from '@/dev/devService';
import { CHALLENGE_CATEGORY_LABELS } from '@/types';
import type { ChallengeInstance } from '@/types';

type ConfirmKind = null | 'history' | 'learning';

export default function DevMemoryScreen() {
  const { colors } = useTheme();
  const [summary, setSummary] = useState({ delivered: 0, daysRegistered: 0, categoriesUsed: 0 });
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ChallengeInstance[]>([]);
  const [confirming, setConfirming] = useState<ConfirmKind>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setSummary(await devService.getMemorySummary());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function toggleHistory() {
    if (!showHistory) setHistory(await devService.getFullHistory());
    setShowHistory((prev) => !prev);
  }

  async function handleConfirmClear() {
    setBusy(true);
    try {
      await devService.clearHistoryAndLearning();
      setConfirming(null);
      setShowHistory(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <DevScreen title="Memória e Aprendizado">
      <DevSection title="Resumo geral">
        <DevKeyValue label="Ações entregues" value={String(summary.delivered)} />
        <DevKeyValue label="Dias registrados" value={String(summary.daysRegistered)} />
        <DevKeyValue label="Categorias utilizadas" value={String(summary.categoriesUsed)} last />
      </DevSection>

      <DevSection title="Ações">
        <DevRow icon="list-outline" label={showHistory ? 'Ocultar histórico' : 'Ver histórico completo'} onPress={toggleHistory} />
        <DevRow icon="trash-outline" label="Limpar histórico" tone="danger" onPress={() => setConfirming('history')} />
        <DevRow icon="refresh-outline" label="Resetar aprendizado" tone="danger" onPress={() => setConfirming('learning')} last />
      </DevSection>

      {confirming && (
        <DevSection title="Confirmação">
          <View style={styles.confirmBox}>
            <AppText variant="body" color={colors.danger} style={styles.confirmText}>
              {confirming === 'history'
                ? 'Isso vai apagar todo o histórico de ações e dias registrados. Essa ação não pode ser desfeita.'
                : 'Isso vai apagar o histórico usado para personalizar suas ações (não há uma tabela de aprendizado separada — ela é calculada a partir do histórico). Essa ação não pode ser desfeita.'}
            </AppText>
            <View style={styles.confirmActions}>
              <Button label="Cancelar" variant="ghost" tone="neutral" onPress={() => setConfirming(null)} disabled={busy} style={{ flex: 1 }} />
              <Button label={confirming === 'history' ? 'Limpar' : 'Resetar'} tone="danger" onPress={handleConfirmClear} disabled={busy} style={{ flex: 1 }} />
            </View>
          </View>
        </DevSection>
      )}

      {showHistory && (
        <DevSection title={`Histórico (${history.length})`}>
          {history.length === 0 ? (
            <AppText variant="caption" color={colors.textMuted} style={{ padding: spacing.md }}>
              Sem registros ainda.
            </AppText>
          ) : (
            history.slice(0, 60).map((instance, index) => (
              <View
                key={instance.id}
                style={[styles.historyRow, index < Math.min(history.length, 60) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              >
                <View style={{ flex: 1 }}>
                  <AppText variant="body" numberOfLines={1}>
                    {instance.titulo}
                  </AppText>
                  <AppText variant="caption" color={colors.textMuted}>
                    {instance.date} · {CHALLENGE_CATEGORY_LABELS[instance.categoria]}
                  </AppText>
                </View>
                <AppText variant="caption" color={colors.textMuted}>
                  {instance.deliveredAt ? 'entregue' : '—'}
                </AppText>
              </View>
            ))
          )}
        </DevSection>
      )}
    </DevScreen>
  );
}

const styles = StyleSheet.create({
  confirmBox: {
    padding: spacing.md,
  },
  confirmText: {
    marginBottom: spacing.md,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});
