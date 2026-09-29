import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DevScreen, DevSection, DevBanner, DevChipButton } from '@/dev/DevUI';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { spacing, useTheme } from '@/theme';
import { profileService } from '@/services/profileService';
import { devService } from '@/dev/devService';
import { allChallenges } from '@/data/challenges';
import { CHALLENGE_CATEGORY_ICONS, CHALLENGE_CATEGORY_LABELS, type ChallengeCategory } from '@/types';

const CATEGORY_OPTIONS = Object.entries(CHALLENGE_CATEGORY_LABELS) as [ChallengeCategory, string][];

/**
 * Separada de `/dev/schedule-preview` (ver ARCHITECTURE.md) — as duas coisas não têm relação
 * direta (uma edita um perfil de teste em memória, a outra dispara notificação real pro perfil
 * salvo) e juntas numa tela só ficavam compridas demais pra escanear. Reaproveita
 * `devService`/`profileService` de produção, igual todo o resto do Modo Dev — nada de lógica de
 * negócio duplicada aqui.
 */
export default function DevNotificationTesterScreen() {
  const { colors } = useTheme();
  const [sendCategory, setSendCategory] = useState<ChallengeCategory | null>(null);
  const [sendingChallengeId, setSendingChallengeId] = useState<string | null>(null);
  const [sentChallengeIds, setSentChallengeIds] = useState<Set<string>>(new Set());
  const [clearingToday, setClearingToday] = useState(false);

  // Lista pra escolher, não busca por texto — filtra direto em `allChallenges` (nunca uma cópia)
  // pela categoria marcada, então se uma ação for removida do catálogo ela já some daqui sozinha.
  // Ordenada por título pra ficar fácil de escanear visualmente numa lista de ~30-50 itens.
  const challengesInSendCategory = useMemo(
    () =>
      sendCategory == null
        ? []
        : allChallenges.filter((c) => c.categoria === sendCategory).sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR')),
    [sendCategory],
  );

  /** Dispara agora a notificação real de uma ação específica do catálogo (ver
   * devService.sendChallengeById) — usa o perfil de verdade salvo, não um rascunho, porque isso
   * persiste uma instância e envia uma notificação de verdade. */
  async function handleSendChallenge(challengeId: string) {
    setSendingChallengeId(challengeId);
    try {
      const profile = await profileService.getProfile();
      if (profile) {
        await devService.sendChallengeById(profile, challengeId);
        setSentChallengeIds((prev) => new Set(prev).add(challengeId));
      }
    } finally {
      setSendingChallengeId(null);
    }
  }

  /** Limpa a lista "Suas ações de hoje" da Home (ver devService.clearTodayInstances) — pra testar
   * várias ações seguidas sem a tela ir acumulando os cards de teste. Também esvazia
   * `sentChallengeIds` (os "✓ Enviada" abaixo), já que as instâncias que eles representavam não
   * existem mais. */
  async function handleClearToday() {
    setClearingToday(true);
    try {
      const profile = await profileService.getProfile();
      if (profile) {
        await devService.clearTodayInstances(profile);
        setSentChallengeIds(new Set());
      }
    } finally {
      setClearingToday(false);
    }
  }

  return (
    <DevScreen title="🔔 Testar notificações" closeDisabled={clearingToday}>
      <DevBanner text="Escolha uma categoria pra listar as ações dela e disparar a notificação real de uma específica agora, pro perfil salvo — pra testar sem depender de sorteio. Lista sempre o catálogo atual: se você remover uma ação, ela some daqui também." />

      <DevSection title="🗑️ Limpar ações de hoje">
        <View style={styles.nowRow}>
          <AppText variant="caption" color={colors.textMuted} style={styles.clearTodayLabel}>
            Testando várias seguidas? Limpe a Home antes de encher de cards.
          </AppText>
          <DevChipButton
            label={clearingToday ? 'Limpando...' : '🗑️ Limpar'}
            tone="danger"
            disabled={clearingToday}
            onPress={handleClearToday}
          />
        </View>
      </DevSection>

      <DevSection title="Disparar ação individual">
        <View style={styles.chipsRow}>
          {CATEGORY_OPTIONS.map(([value, label]) => (
            <Chip
              key={value}
              label={`${CHALLENGE_CATEGORY_ICONS[value]} ${label}`}
              selected={sendCategory === value}
              onPress={() => setSendCategory(sendCategory === value ? null : value)}
            />
          ))}
        </View>
        {sendCategory == null ? (
          <AppText variant="caption" color={colors.textMuted} style={styles.challengeSearchHint}>
            Escolha uma categoria acima pra ver a lista de ações dela.
          </AppText>
        ) : (
          <>
            <AppText variant="caption" color={colors.textMuted} style={styles.challengeSearchHint}>
              {challengesInSendCategory.length} {challengesInSendCategory.length === 1 ? 'ação' : 'ações'} em{' '}
              {CHALLENGE_CATEGORY_LABELS[sendCategory]}
            </AppText>
            {challengesInSendCategory.map((challenge) => {
              const sent = sentChallengeIds.has(challenge.id);
              return (
                <View key={challenge.id} style={[styles.challengeRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.challengeRowText}>
                    <AppText variant="body">{challenge.titulo}</AppText>
                  </View>
                  {sent ? (
                    <View style={styles.challengeSentBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <AppText variant="caption" color={colors.success}>
                        Enviada
                      </AppText>
                    </View>
                  ) : (
                    <Button
                      label="Enviar"
                      size="sm"
                      variant="soft"
                      disabled={sendingChallengeId === challenge.id}
                      onPress={() => handleSendChallenge(challenge.id)}
                    />
                  )}
                </View>
              );
            })}
          </>
        )}
      </DevSection>
    </DevScreen>
  );
}

const styles = StyleSheet.create({
  nowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  challengeSearchHint: {
    padding: spacing.md,
    paddingTop: 0,
  },
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  challengeRowText: {
    flex: 1,
  },
  challengeSentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearTodayLabel: {
    flex: 1,
    marginRight: spacing.sm,
  },
});
