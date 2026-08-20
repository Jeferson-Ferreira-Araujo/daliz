import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { DevScreen, DevSection, DevRow, DevKeyValue, DevBanner } from '@/dev/DevUI';
import { AppText } from '@/components/ui/AppText';
import { radius, spacing, useTheme } from '@/theme';
import { profileService } from '@/services/profileService';
import { devService } from '@/dev/devService';
import { CHALLENGE_CATEGORY_LABELS, INTEREST_LABELS } from '@/types';
import type { ChallengeInstance, UserActionPerformance, UserProfile } from '@/types';

const PROGRESSION_TEST_CONCEPTS = ['squat', 'quiet_pause', 'reading'] as const;

export default function DevChallengesScreen() {
  const { colors } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [instances, setInstances] = useState<ChallengeInstance[]>([]);
  const [selected, setSelected] = useState<ChallengeInstance | null>(null);
  const [busy, setBusy] = useState(false);
  const [performance, setPerformance] = useState<Record<string, UserActionPerformance>>({});

  const load = useCallback(async () => {
    const current = await profileService.getProfile();
    setProfile(current);
    if (current) {
      const list = await devService.listTodayInstances(current);
      setInstances(list);
    } else {
      setInstances([]);
    }
    setPerformance(await devService.getPerformanceSnapshot());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function withBusy(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <DevScreen title="Ações">
      {!profile && (
        <DevBanner tone="warning" text="Nenhum perfil encontrado. Use Cenários de Teste → Usuário Engajado para criar um perfil de teste primeiro." />
      )}

      <DevSection title="Ações">
        <DevRow
          icon="paper-plane-outline"
          label="Enviar ação agora"
          description="Cria, adiciona ao dia e dispara a notificação real"
          onPress={() => withBusy(async () => { if (profile) await devService.sendChallengeNow(profile); })}
          disabled={!profile || busy}
        />
        <DevRow
          icon="add-circle-outline"
          label="Criar ação de teste"
          description="Adiciona ao dia sem notificar"
          onPress={() => withBusy(async () => { if (profile) await devService.createTestChallenge(profile); })}
          disabled={!profile || busy}
        />
        <DevRow
          icon="alert-circle-outline"
          label="Criar ação atrasada"
          description="Testa o indicador 'Atrasado' na tela Hoje"
          onPress={() => withBusy(async () => { if (profile) await devService.createOverdueChallenge(profile); })}
          disabled={!profile || busy}
          last
        />
      </DevSection>

      <DevSection title="Testar Progressão (dificuldade adaptativa)">
        <AppText variant="caption" color={colors.textMuted} style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
          Envia o nível 1 de um concept de teste. Selecione a instância criada na lista abaixo e
          toque "Concluído" 3x seguidas (pode reenviar entre uma e outra) pra simular consistência
          — depois use "Testar seleção" em Contexto Inteligente pra ver o nível 2 substituir o 1.
        </AppText>
        {PROGRESSION_TEST_CONCEPTS.map((concept) => (
          <DevRow
            key={concept}
            icon="trending-up-outline"
            label={`Enviar nível 1: ${concept}`}
            description={performance[concept] ? `consecutivas: ${performance[concept].consecutiveCompletions} · nível atual: ${performance[concept].currentDifficulty}` : 'sem histórico ainda'}
            onPress={() => withBusy(async () => { if (profile) await devService.sendProgressiveChallengeNow(profile, concept); })}
            disabled={!profile || busy}
          />
        ))}
        <DevRow
          icon="refresh-outline"
          label="Zerar dados de progressão"
          description="Limpa todo o desempenho registrado (todos os concepts)"
          onPress={() => withBusy(async () => { await devService.resetProgressionData(); })}
          disabled={busy}
          last
        />
      </DevSection>

      <DevSection title={`Ações de hoje (${instances.length})`}>
        {instances.length === 0 ? (
          <AppText variant="caption" color={colors.textMuted} style={styles.empty}>
            Nenhuma ação hoje ainda.
          </AppText>
        ) : (
          instances.map((instance, index) => (
            <Pressable
              key={instance.id}
              onPress={() => setSelected(instance)}
              style={[
                styles.instanceRow,
                index < instances.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                selected?.id === instance.id && { backgroundColor: colors.primaryMuted },
              ]}
            >
              <AppText variant="body" numberOfLines={1} style={{ flex: 1 }}>
                {instance.titulo}
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                {instance.deliveredAt ? 'entregue' : '—'}
              </AppText>
            </Pressable>
          ))
        )}
      </DevSection>

      {selected && (
        <DevSection title="Ação selecionada">
          <View style={styles.detailBox}>
            <DevKeyValue label="ID" value={selected.id} />
            <DevKeyValue label="Categoria" value={CHALLENGE_CATEGORY_LABELS[selected.categoria]} />
            <DevKeyValue label="Texto" value={selected.titulo} />
            <DevKeyValue label="Duração estimada" value={`${selected.tempoEstimado} min`} />
            <DevKeyValue
              label="Interesses"
              value={selected.interests.length > 0 ? selected.interests.map((i) => INTEREST_LABELS[i]).join(', ') : '—'}
            />
            <DevKeyValue label="Entregue em" value={selected.deliveredAt ?? '—'} last />
          </View>
        </DevSection>
      )}
    </DevScreen>
  );
}

const styles = StyleSheet.create({
  empty: {
    padding: spacing.md,
  },
  instanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  detailBox: {
    borderRadius: radius.md,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.md,
  },
  actionButton: {
    flexGrow: 1,
  },
});
