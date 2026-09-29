import React, { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TabHeaderIcons } from '@/components/TabHeaderIcons';
import { CATEGORY_CHART_COLORS, gradients, radius, spacing, useTheme } from '@/theme';
import { CATEGORY_ICON_NAMES } from '@/utils/categoryIcons';
import { profileService } from '@/services/profileService';
import { shareProgress } from '@/utils/shareProgress';
import { calculateAge, formatLongDate, resolvePersonAge } from '@/utils/date';
import { getCurrentDate } from '@/utils/now';
import {
  CHALLENGE_CATEGORY_LABELS,
  CHALLENGE_INTENSITY_LABELS,
  DAY_OF_WEEK_LABELS,
  INTEREST_LABELS,
  RELATIONSHIP_LABELS,
  SOCIAL_CHALLENGES_INTEREST_LABELS,
  SOCIAL_MEDIA_USAGE_LABELS,
  SOCIAL_NETWORK_LABELS,
  type ChallengeIntensity,
  type UserProfile,
} from '@/types';

function parseISODate(dateISO: string): Date {
  const [year, month, day] = dateISO.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Resume a rotina de trabalho num texto só — mesma lógica de horário sempre, e depois dias
 * fixos, ciclo de turnos ou "variável" dependendo de `workSchedule` (ver edit-profile.tsx). */
function formatWorkSchedule(profile: UserProfile): string {
  if (!profile.isWorking || !profile.workStartTime || !profile.workEndTime) {
    return 'Não está trabalhando no momento';
  }
  const hours = `${profile.workStartTime} – ${profile.workEndTime}`;
  if (profile.workSchedule === 'fixa' && profile.workDays.length > 0) {
    return `${hours} · ${profile.workDays.map((day) => DAY_OF_WEEK_LABELS[day]).join(', ')}`;
  }
  if (profile.workSchedule === 'turnos' && profile.shiftPattern) {
    return `${hours} · ${profile.shiftPattern.workDays} dia(s) de trabalho / ${profile.shiftPattern.restDays} de folga`;
  }
  return `${hours} · Rotina variável`;
}

// Uma cor de destaque por nível — reaproveita os mesmos 3 tons de "energia" da marca
// (calmo → vivo → laranja), então o badge já comunica intensidade crescente só pela cor.
const INTENSITY_COLOR: Record<ChallengeIntensity, string> = {
  leve: '#22C1A2',
  equilibrado: '#3577FF',
  desafiador: '#FF9D1C',
};

const INTENSITY_ICON: Record<ChallengeIntensity, keyof typeof Ionicons.glyphMap> = {
  leve: 'leaf-outline',
  equilibrado: 'options-outline',
  desafiador: 'flame-outline',
};

export default function ProfileScreen() {
  const { colors } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [photoError, setPhotoError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      profileService.getProfile().then(setProfile);
    }, []),
  );

  async function handleChangePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;

    setPhotoError(false);
    const updated = await profileService.updatePhoto(result.assets[0].uri);
    setProfile(updated);
  }

  if (!profile) return <Screen edges={['top']} />;

  return (
    <Screen padded={false} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TabHeaderIcons />
        <AppText variant="title">Perfil</AppText>
        <AppText variant="body" color={colors.textMuted} style={styles.subtitle}>
          Suas informações e preferências de ações.
        </AppText>

        <View style={styles.profileRow}>
          <Pressable onPress={handleChangePhoto}>
            {/* Anel em gradiente (mesmo trio de cores da marca) em vez de um círculo plano — é
                o primeiro elemento que a pessoa vê na tela, então ganha o toque de cor mais forte. */}
            <LinearGradient colors={gradients.principal} style={styles.avatarRing}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.surface }]}>
                {profile.photoUri && !photoError ? (
                  <Image
                    source={{ uri: profile.photoUri }}
                    style={styles.avatarImage}
                    onError={() => setPhotoError(true)}
                  />
                ) : (
                  <AppText variant="hero" color={colors.primary}>
                    {profile.name.trim().charAt(0).toUpperCase()}
                  </AppText>
                )}
              </View>
            </LinearGradient>
            <View style={[styles.avatarBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
              <Ionicons name="camera" size={12} color={colors.onPrimary} />
            </View>
          </Pressable>

          <View style={styles.profileInfo}>
            <AppText variant="title">{profile.name}</AppText>
            <AppText variant="body" color={colors.textMuted}>
              {profile.occupation}
            </AppText>
            {/* Antes era só um ícone de lápis (discreto demais) e depois um botão de largura
                cheia (chamativo demais) — este fica no meio-termo: compacto, junto do nome, mas
                com texto em vez de só ícone. */}
            <Button
              label="✏️ Editar perfil"
              variant="soft"
              size="sm"
              onPress={() => router.push('/(main)/edit-profile')}
              style={styles.editButton}
            />
          </View>
        </View>

        {/* Clima já aparece na Home, e a cidade já aparece na linha "Localização" logo abaixo —
            mostrar aqui de novo era redundante (ver pedido do usuário). */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <InfoRow icon="hourglass-outline" accentColor="#3577FF" label="Idade" value={`${calculateAge(profile.birthDate, getCurrentDate())} anos`} />
          <InfoRow icon="gift-outline" accentColor="#7B5CFF" label="Aniversário" value={formatLongDate(parseISODate(profile.birthDate))} />
          <InfoRow icon="briefcase-outline" accentColor="#FF9D1C" label="Trabalho" value={formatWorkSchedule(profile)} />
          {profile.isWorking && (
            <InfoRow
              icon="notifications-outline"
              accentColor="#FFB629"
              label="Notificações no expediente"
              value={profile.receiveDuringWorkHours ? 'Recebendo normalmente' : 'Pausadas durante o horário de trabalho'}
            />
          )}
          <InfoRow
            icon="moon-outline"
            accentColor="#22C1A2"
            label="Rotina"
            value={`Acorda ${profile.wakeTime} · Dorme ${profile.sleepTime}`}
          />
          <InfoRow
            icon="location-outline"
            accentColor="#C97B4A"
            label="Localização"
            value={profile.location ? `${profile.location.city}, ${profile.location.state}` : 'Não informada'}
            last
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <AppText variant="caption" color={colors.textMuted} style={styles.sectionLabel}>
            Categorias escolhidas
          </AppText>
          <View style={styles.chipRow}>
            {profile.selectedCategories.map((category) => {
              const categoryColor = CATEGORY_CHART_COLORS[category];
              return (
                <View key={category} style={[styles.categoryChip, { backgroundColor: `${categoryColor}1F` }]}>
                  <Ionicons name={CATEGORY_ICON_NAMES[category]} size={13} color={categoryColor} />
                  <AppText variant="caption" color={categoryColor} style={styles.categoryChipLabel}>
                    {CHALLENGE_CATEGORY_LABELS[category]}
                  </AppText>
                </View>
              );
            })}
          </View>

          <AppText variant="caption" color={colors.textMuted} style={[styles.sectionLabel, styles.intensityLabel]}>
            Intensidade das ações
          </AppText>
          <View
            style={[
              styles.intensityBadge,
              { backgroundColor: `${INTENSITY_COLOR[profile.challengeIntensity]}1F` },
            ]}
          >
            <Ionicons name={INTENSITY_ICON[profile.challengeIntensity]} size={16} color={INTENSITY_COLOR[profile.challengeIntensity]} />
            <AppText variant="bodyStrong" color={INTENSITY_COLOR[profile.challengeIntensity]}>
              {CHALLENGE_INTENSITY_LABELS[profile.challengeIntensity]}
            </AppText>
          </View>
        </View>

        {(profile.interests.length > 0 || profile.stillDiscoveringInterests) && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <AppText variant="caption" color={colors.textMuted} style={styles.sectionLabel}>
              🎯 O que você gosta de fazer
            </AppText>
            <View style={styles.chipRow}>
              {profile.interests.map((interest) => (
                <View key={interest} style={[styles.categoryChip, { backgroundColor: colors.primaryMuted }]}>
                  <AppText variant="caption" color={colors.primary} style={styles.categoryChipLabel}>
                    {interest === 'other' && profile.otherInterestText ? profile.otherInterestText : INTEREST_LABELS[interest]}
                  </AppText>
                </View>
              ))}
              {profile.stillDiscoveringInterests && (
                <View style={[styles.categoryChip, { backgroundColor: colors.surfaceMuted }]}>
                  <AppText variant="caption" color={colors.textMuted} style={styles.categoryChipLabel}>
                    Ainda descobrindo
                  </AppText>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Sempre visível, mesmo sem ninguém cadastrado — sem isso, quem pulou essa etapa no
            cadastro nunca fica sabendo que dá pra voltar e preencher depois. */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <AppText variant="caption" color={colors.textMuted} style={styles.sectionLabel}>
            ❤️ Pessoas importantes
          </AppText>
          {profile.importantPeople.length > 0 ? (
            profile.importantPeople.map((person, index) => {
              // Recalculada a partir de birthDate quando existir (ver resolvePersonAge) — sem
              // isso, o Perfil mostraria pra sempre a idade digitada no cadastro, mesmo depois
              // da pessoa fazer aniversário.
              const personAge = resolvePersonAge(person, getCurrentDate());
              return (
                <InfoRow
                  key={person.id}
                  icon="heart-outline"
                  accentColor={colors.danger}
                  label={RELATIONSHIP_LABELS[person.relationship]}
                  value={[person.name, personAge != null ? `${personAge} anos` : null].filter(Boolean).join(' · ') || '—'}
                  last={index === profile.importantPeople.length - 1}
                />
              );
            })
          ) : (
            <>
              <AppText variant="body" color={colors.textMuted} style={styles.emptySectionText}>
                Você não cadastrou ninguém nessa etapa. Quer adicionar?
              </AppText>
              <Button
                label="Adicionar pessoa importante"
                variant="soft"
                size="sm"
                onPress={() => router.push({ pathname: '/(main)/edit-profile', params: { focusSection: 'importantPeople' } })}
                style={styles.editButton}
              />
            </>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <AppText variant="caption" color={colors.textMuted} style={styles.sectionLabel}>
            📱 Redes sociais
          </AppText>
          <InfoRow
            icon="phone-portrait-outline"
            accentColor="#6FBF73"
            label="Frequência de uso"
            value={SOCIAL_MEDIA_USAGE_LABELS[profile.socialMediaUsage]}
          />
          <InfoRow
            icon="sparkles-outline"
            accentColor="#8E6BAF"
            label="Ações com redes sociais"
            value={SOCIAL_CHALLENGES_INTEREST_LABELS[profile.socialChallengesInterest]}
            last={profile.socialNetworks.length === 0}
          />
          {profile.socialNetworks.length > 0 && (
            <View style={[styles.chipRow, styles.socialNetworksRow]}>
              {profile.socialNetworks.map((network) => (
                <View key={network} style={[styles.categoryChip, { backgroundColor: colors.surfaceMuted }]}>
                  <AppText variant="caption" color={colors.text} style={styles.categoryChipLabel}>
                    {SOCIAL_NETWORK_LABELS[network]}
                  </AppText>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.shareCard, { backgroundColor: colors.primaryMuted }]}>
          <Ionicons name="megaphone-outline" size={22} color={colors.primary} style={styles.shareIcon} />
          <AppText variant="bodyStrong" style={styles.shareTitle}>
            Inspire outra pessoa
          </AppText>
          <AppText variant="caption" color={colors.textMuted} style={styles.shareDescription}>
            Mostre pra alguém que pequenos passos fazem diferença.
          </AppText>
          <Button label="Compartilhar meu progresso" onPress={shareProgress} style={styles.shareButton} />
        </View>

      </ScrollView>
    </Screen>
  );
}

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  label: string;
  value: string;
  last?: boolean;
}

/** Ícone colorido por linha (cor fixa por assunto, não por posição) — é o que tira a tela de
 * parecer uma lista de texto cinza sobre branco. */
function InfoRow({ icon, accentColor, label, value, last }: InfoRowProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={[styles.infoIconCircle, { backgroundColor: `${accentColor}1F` }]}>
        <Ionicons name={icon} size={16} color={accentColor} />
      </View>
      <View style={styles.infoTextBlock}>
        <AppText variant="caption" color={colors.textMuted}>
          {label}
        </AppText>
        <AppText variant="body">{value}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  subtitle: {
    marginBottom: spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarRing: {
    width: 78,
    height: 78,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  editButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  infoTextBlock: {
    flex: 1,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  categoryChipLabel: {
    fontWeight: '600',
  },
  intensityLabel: {
    marginTop: spacing.md,
  },
  socialNetworksRow: {
    marginTop: spacing.sm,
  },
  emptySectionText: {
    marginBottom: spacing.sm,
  },
  intensityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  shareCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  shareIcon: {
    marginBottom: spacing.xs,
  },
  shareTitle: {
    marginBottom: spacing.xs,
  },
  shareDescription: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  shareButton: {
    alignSelf: 'stretch',
  },
});
