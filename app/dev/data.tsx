import React, { useCallback, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { DevScreen, DevSection, DevRow, DevKeyValue } from '@/dev/DevUI';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { spacing, useTheme } from '@/theme';
import { devService } from '@/dev/devService';

type ResetStep = null | 'first' | 'second';

export default function DevDataScreen() {
  const { colors } = useTheme();
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof devService.getStateSnapshot>> | null>(null);
  const [resetStep, setResetStep] = useState<ResetStep>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setSnapshot(await devService.getStateSnapshot());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleExport() {
    const json = await devService.exportLocalDataAsJson();
    try {
      await Share.share({ message: json });
    } catch {
      // sem app de compartilhamento disponível — sem problema, é só uma ferramenta de dev
    }
  }

  async function handleResetAll() {
    setBusy(true);
    try {
      await devService.resetAllData();
      router.replace('/onboarding/welcome');
    } finally {
      setBusy(false);
    }
  }

  return (
    <DevScreen title="Dados e Sistema">
      {snapshot && (
        <DevSection title="Estado atual do sistema">
          <DevKeyValue label="Data ativa" value={snapshot.activeDate ?? '—'} />
          <DevKeyValue label="Ações de hoje" value={String(snapshot.todayInstances.length)} />
          <DevKeyValue label="Pendências" value={String(snapshot.todayInstances.filter((i) => i.status === 'pendente').length)} />
          <DevKeyValue label="Relógio simulado" value={snapshot.clockEnabled ? (snapshot.simulatedNow ?? '') : 'desativado'} />
          <DevKeyValue label="Notificações" value={snapshot.notificationsPermission} />
          <DevKeyValue label="Perfil" value={snapshot.profile ? snapshot.profile.name : 'nenhum'} last />
        </DevSection>
      )}

      <DevSection title="Ações">
        <DevRow icon="share-outline" label="Exportar dados locais" description="Compartilha um JSON com perfil, dias e histórico" onPress={handleExport} />
        <DevRow icon="trash-outline" label="Resetar todos os dados" tone="danger" onPress={() => setResetStep('first')} last />
      </DevSection>

      {resetStep === 'first' && (
        <ConfirmCard
          color={colors.danger}
          bg={colors.dangerBg}
          text="⚠️ Isso apagará todos os dados locais do aplicativo."
          cancelLabel="Cancelar"
          confirmLabel="Continuar"
          onCancel={() => setResetStep(null)}
          onConfirm={() => setResetStep('second')}
        />
      )}

      {resetStep === 'second' && (
        <ConfirmCard
          color={colors.danger}
          bg={colors.dangerBg}
          text="Tem certeza? Essa ação não pode ser desfeita."
          cancelLabel="Cancelar"
          confirmLabel="Apagar tudo"
          busy={busy}
          onCancel={() => setResetStep(null)}
          onConfirm={handleResetAll}
        />
      )}
    </DevScreen>
  );
}

function ConfirmCard({
  color,
  bg,
  text,
  cancelLabel,
  confirmLabel,
  busy,
  onCancel,
  onConfirm,
}: {
  color: string;
  bg: string;
  text: string;
  cancelLabel: string;
  confirmLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <View style={[styles.confirmCard, { backgroundColor: bg }]}>
      <AppText variant="body" color={color} style={styles.confirmText}>
        {text}
      </AppText>
      <View style={styles.confirmActions}>
        <Button label={cancelLabel} variant="ghost" tone="neutral" onPress={onCancel} disabled={busy} style={{ flex: 1 }} />
        <Button label={confirmLabel} tone="danger" onPress={onConfirm} disabled={busy} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  confirmCard: {
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  confirmText: {
    marginBottom: spacing.md,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
