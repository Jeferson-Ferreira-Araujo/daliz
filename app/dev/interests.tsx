import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DevScreen, DevSection, DevBanner, DevChipButton } from '@/dev/DevUI';
import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { radius, spacing, useTheme } from '@/theme';
import { profileService } from '@/services/profileService';
import { devService } from '@/dev/devService';
import { devClock, useDevClockState } from '@/dev/devClock';
import { INTEREST_LABELS } from '@/types';
import type { ChallengeExplanation } from '@/engine/ChallengeEngine';
import type { Interest, UserProfile } from '@/types';

const INTEREST_OPTIONS = Object.entries(INTEREST_LABELS) as [Interest, string][];

export default function DevInterestsScreen() {
  const { colors } = useTheme();
  const clock = useDevClockState();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ChallengeExplanation | null>(null);
  const [testedAt, setTestedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setProfile(await profileService.getProfile());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function toggleInterest(interest: Interest) {
    if (!profile) return;
    setBusy(true);
    try {
      const next = profile.interests.includes(interest)
        ? profile.interests.filter((i) => i !== interest)
        : [...profile.interests, interest];
      const updated = await devService.setTestInterests(profile, next, profile.stillDiscoveringInterests);
      setProfile(updated);
    } finally {
      setBusy(false);
    }
  }

  async function toggleDiscovering() {
    if (!profile) return;
    setBusy(true);
    try {
      const updated = await devService.setTestInterests(profile, profile.interests, !profile.stillDiscoveringInterests);
      setProfile(updated);
    } finally {
      setBusy(false);
    }
  }

  function setTime(hours: number, minutes: number) {
    devClock.setTimeOfDay(hours, minutes);
  }

  async function handleTest() {
    if (!profile) return;
    setBusy(true);
    try {
      const explanation = await devService.explainNextChallenge(profile);
      setResult(explanation);
      setTestedAt(devClock.getSimulatedAt());
    } finally {
      setBusy(false);
    }
  }

  return (
    <DevScreen title="Interesses">
      {!profile && (
        <DevBanner tone="warning" text="Nenhum perfil encontrado. Use Cenários de Teste → Usuário Engajado para criar um perfil de teste primeiro." />
      )}

      {profile && (
        <>
          <DevSection title="Perfil de teste — interesses">
            <View style={styles.sectionBody}>
              <View style={styles.chipsRow}>
                {INTEREST_OPTIONS.map(([value, label]) => (
                  <Chip key={value} label={label} selected={profile.interests.includes(value)} onPress={() => toggleInterest(value)} />
                ))}
              </View>
              <View style={[styles.chipsRow, styles.discoveringRow]}>
                <Chip
                  label="Ainda estou descobrindo meus interesses"
                  selected={profile.stillDiscoveringInterests}
                  onPress={toggleDiscovering}
                />
              </View>
              {profile.discoveredInterests.length > 0 && (
                <AppText variant="caption" color={colors.textMuted} style={styles.discoveredNote}>
                  Aprendidos pelo comportamento: {profile.discoveredInterests.map((i) => INTEREST_LABELS[i]).join(', ')}
                </AppText>
              )}
            </View>
          </DevSection>

          <DevSection title="Contexto — relógio simulado">
            <View style={styles.sectionBody}>
              <AppText variant="caption" color={colors.textMuted} style={styles.contextHint}>
                Simulado agora: {formatDateTime(clock.simulatedAt)}
                {clock.enabled ? '' : ' (relógio real — ainda não simulando)'}
              </AppText>
              <View style={styles.chipsRow}>
                <DevChipButton label="🌅 Manhã (09:00)" onPress={() => setTime(9, 0)} />
                <DevChipButton label="☀️ Tarde (14:30)" onPress={() => setTime(14, 30)} />
                <DevChipButton label="🌙 Noite (21:30)" onPress={() => setTime(21, 30)} />
                <DevChipButton label="🎉 Fim de tarde (18:30)" onPress={() => setTime(18, 30)} />
              </View>
            </View>
          </DevSection>

          <DevSection title="Testar seleção">
            <View style={styles.sectionBody}>
              <Button label="Testar seleção" onPress={handleTest} disabled={busy} />
            </View>
          </DevSection>

          {result && (
            <DevSection title="Resultado">
              <View style={styles.sectionBody}>
                {testedAt && (
                  <AppText variant="caption" color={colors.textMuted} style={styles.contextHint}>
                    Testado às {formatDateTime(testedAt)}
                  </AppText>
                )}
                {result.instance ? (
                  <View style={[styles.resultCard, { backgroundColor: colors.surface }]}>
                    <AppText variant="bodyStrong">{result.instance.titulo}</AppText>
                    <AppText variant="caption" color={colors.textMuted} style={styles.resultMeta}>
                      {result.candidateCount} candidato(s) elegível(is) neste momento
                    </AppText>
                    <View style={styles.reasonsList}>
                      {result.reasons.map((reason, index) => (
                        <View key={index} style={styles.reasonRow}>
                          <Ionicons name="checkmark-circle" size={16} color={colors.success} style={styles.reasonIcon} />
                          <AppText variant="body" style={{ flex: 1 }}>
                            {reason}
                          </AppText>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <DevBanner text={result.reasons[0] ?? 'Nenhuma ação elegível agora.'} />
                )}
              </View>
            </DevSection>
          )}
        </>
      )}
    </DevScreen>
  );
}

function formatDateTime(date: Date): string {
  const d = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  const t = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return `${d} ${t}`;
}

const styles = StyleSheet.create({
  sectionBody: {
    padding: spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  discoveringRow: {
    marginTop: spacing.sm,
  },
  discoveredNote: {
    marginTop: spacing.sm,
  },
  contextHint: {
    marginBottom: spacing.sm,
  },
  resultCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  resultMeta: {
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  reasonsList: {
    gap: spacing.xs,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reasonIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
});
