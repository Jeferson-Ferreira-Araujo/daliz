import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DevScreen, DevSection, DevBanner, DevChipButton } from '@/dev/DevUI';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { radius, spacing, useTheme } from '@/theme';
import { profileService } from '@/services/profileService';
import { devService } from '@/dev/devService';
import { devClock, useDevClockState } from '@/dev/devClock';
import { RELATIONSHIP_LABELS } from '@/types';
import type { ChallengeExplanation } from '@/engine/ChallengeEngine';
import type { UserProfile } from '@/types';

/** Presets rápidos pra provocar os cenários pedidos na seção 20: sem filhos, com
 * filhos, com parceiro(a), várias pessoas, morando junto vs. morando separado. */
const PRESETS = [
  { key: 'child', label: '👶 Adicionar filho (7 anos, mora com você)', person: { name: null, relationship: 'filho' as const, age: 7, birthDate: null, livesWithUser: true } },
  { key: 'teen', label: '🧑 Adicionar filho adolescente (15 anos, mora com você)', person: { name: null, relationship: 'filho' as const, age: 15, birthDate: null, livesWithUser: true } },
  { key: 'partner', label: '❤️ Adicionar parceiro(a) (mora com você)', person: { name: null, relationship: 'conjuge' as const, age: null, birthDate: null, livesWithUser: true } },
  { key: 'parent-away', label: '👵 Adicionar mãe (não mora com você)', person: { name: null, relationship: 'mae' as const, age: null, birthDate: null, livesWithUser: false } },
  { key: 'friend', label: '🤝 Adicionar amigo(a)', person: { name: null, relationship: 'amigo' as const, age: null, birthDate: null, livesWithUser: false } },
];

export default function DevPeopleScreen() {
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

  async function withBusy(action: () => Promise<UserProfile>) {
    setBusy(true);
    try {
      setProfile(await action());
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id: string) {
    if (!profile) return;
    await withBusy(() => devService.setTestPeople(profile, profile.importantPeople.filter((p) => p.id !== id)));
  }

  async function handleClearChildren() {
    if (!profile) return;
    await withBusy(() => devService.setTestPeople(profile, profile.importantPeople.filter((p) => p.relationship !== 'filho')));
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
    <DevScreen title="Pessoas importantes">
      {!profile && (
        <DevBanner tone="warning" text="Nenhum perfil encontrado. Use Cenários de Teste → Usuário Engajado para criar um perfil de teste primeiro." />
      )}

      {profile && (
        <>
          <DevSection title="Pessoas do perfil de teste">
            <View style={styles.sectionBody}>
              {profile.importantPeople.length === 0 ? (
                <AppText variant="caption" color={colors.textMuted}>
                  Nenhuma pessoa cadastrada ainda.
                </AppText>
              ) : (
                profile.importantPeople.map((person) => (
                  <View key={person.id} style={[styles.personRow, { borderBottomColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <AppText variant="body">{person.name ?? RELATIONSHIP_LABELS[person.relationship]}</AppText>
                      <AppText variant="caption" color={colors.textMuted}>
                        {RELATIONSHIP_LABELS[person.relationship]}
                        {person.age != null ? ` · ${person.age} anos` : ''}
                        {person.birthDate ? ` · nasc. ${person.birthDate}` : ''}
                        {person.livesWithUser === true ? ' · mora com você' : person.livesWithUser === false ? ' · não mora com você' : ''}
                      </AppText>
                    </View>
                    <Pressable onPress={() => handleRemove(person.id)} hitSlop={12}>
                      <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </DevSection>

          <DevSection title="Presets rápidos">
            <View style={styles.sectionBody}>
              <View style={styles.chipsRow}>
                {PRESETS.map((preset) => (
                  <DevChipButton
                    key={preset.key}
                    label={preset.label}
                    onPress={() => withBusy(() => devService.addTestPerson(profile, preset.person))}
                  />
                ))}
                <DevChipButton label="🚫 Remover todos os filhos" tone="danger" onPress={handleClearChildren} />
              </View>
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
                <DevChipButton label="🎉 Fim de tarde (18:30)" onPress={() => setTime(18, 30)} />
                <DevChipButton label="🌙 Noite (21:30)" onPress={() => setTime(21, 30)} />
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
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
