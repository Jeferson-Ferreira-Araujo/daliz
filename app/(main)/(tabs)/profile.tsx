import React, { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { CurrentWeatherWidget } from '@/components/CurrentWeatherWidget';
import { TabHeaderIcons } from '@/components/TabHeaderIcons';
import { radius, spacing, useTheme } from '@/theme';
import { profileService } from '@/services/profileService';
import { shareProgress } from '@/utils/shareProgress';
import { calculateAge, formatLongDate } from '@/utils/date';
import { getCurrentDate } from '@/utils/now';
import { CHALLENGE_CATEGORY_LABELS, CHALLENGE_INTENSITY_LABELS, type UserProfile } from '@/types';

function parseISODate(dateISO: string): Date {
  const [year, month, day] = dateISO.split('-').map(Number);
  return new Date(year, month - 1, day);
}

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
            <View style={[styles.avatarCircle, { backgroundColor: colors.primaryMuted }]}>
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
            <View style={[styles.avatarBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
              <Ionicons name="camera" size={12} color={colors.onPrimary} />
            </View>
          </Pressable>

          <View style={styles.profileInfo}>
            <AppText variant="title">{profile.name}</AppText>
            <AppText variant="body" color={colors.textMuted}>
              {profile.occupation}
            </AppText>
          </View>

          <Pressable
            onPress={() => router.push('/(main)/edit-profile')}
            hitSlop={12}
            style={[styles.editButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="pencil-outline" size={16} color={colors.text} />
          </Pressable>
        </View>

        <CurrentWeatherWidget />

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <InfoRow label="Idade" value={`${calculateAge(profile.birthDate, getCurrentDate())} anos`} />
          <InfoRow label="Aniversário" value={formatLongDate(parseISODate(profile.birthDate))} />
          <InfoRow
            label="Trabalho"
            value={
              profile.isWorking && profile.workStartTime && profile.workEndTime
                ? `${profile.workStartTime} – ${profile.workEndTime}`
                : 'Não está trabalhando no momento'
            }
          />
          <InfoRow label="Rotina" value={`Acorda ${profile.wakeTime} · Dorme ${profile.sleepTime}`} />
          <InfoRow
            label="Categorias escolhidas"
            value={profile.selectedCategories.map((category) => CHALLENGE_CATEGORY_LABELS[category]).join(', ')}
          />
          <InfoRow label="Intensidade das ações" value={CHALLENGE_INTENSITY_LABELS[profile.challengeIntensity]} last />
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

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <AppText variant="caption" color={colors.textMuted}>
        {label}
      </AppText>
      <AppText variant="body">{value}</AppText>
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
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  infoRow: {
    paddingVertical: spacing.sm,
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
