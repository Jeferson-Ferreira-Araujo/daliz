import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { radius, spacing, useTheme } from '@/theme';
import { profileService } from '@/services/profileService';
import { notificationService } from '@/services/notificationService';
import { progressResetService } from '@/services/progressResetService';
import { DevTapTrigger } from '@/dev/DevTapTrigger';
import { CurrentLocationField } from '@/components/CurrentLocationField';
import type { ThemePreference, UserProfile } from '@/types';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'system', label: 'Automático', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Claro', icon: 'sunny-outline' },
  { value: 'dark', label: 'Escuro', icon: 'moon-outline' },
];

export default function SettingsScreen() {
  const { colors, preference, setPreference } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    profileService.getProfile().then(setProfile);
  }, []);

  async function handleChangeLocation(location: UserProfile['location']) {
    const updated = await profileService.updateLocation(location);
    setProfile(updated);
  }

  async function handleConfirmSignOut() {
    setSigningOut(true);
    try {
      await profileService.resetAccount();
      setPreference('light');
      router.replace('/onboarding/welcome');
    } finally {
      setSigningOut(false);
    }
  }

  async function handleConfirmReset() {
    setResetting(true);
    try {
      await progressResetService.resetProgress();
      setConfirmingReset(false);
      router.replace('/(main)/(tabs)/home');
    } finally {
      setResetting(false);
    }
  }

  async function applyNotificationsEnabled(value: boolean) {
    if (!profile) return;
    if (value) {
      const granted = await notificationService.requestPermissions();
      await profileService.updateNotificationsEnabled(granted);
      setProfile({ ...profile, notificationsEnabled: granted });
    } else {
      await profileService.updateNotificationsEnabled(false);
      setProfile({ ...profile, notificationsEnabled: false });
    }
  }

  // Desativar não é bloqueado, só desencorajado — a pessoa continua no controle, mas o app
  // só cumpre a proposta (lembrar de pequenas ações ao longo do dia) com isso ligado.
  function handleToggleNotifications(value: boolean) {
    if (!profile) return;
    if (value) {
      applyNotificationsEnabled(true);
      return;
    }
    Alert.alert(
      'Desativar notificações?',
      'O ideal para o app funcionar bem é manter as notificações ativadas — é como você recebe as ações ao longo do dia. Você pode desativar mesmo assim, se preferir.',
      [
        { text: 'Manter ativadas', style: 'cancel' },
        { text: 'Desativar mesmo assim', style: 'destructive', onPress: () => applyNotificationsEnabled(false) },
      ],
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <DevTapTrigger>
            <AppText variant="title">Configurações</AppText>
          </DevTapTrigger>
          <View style={{ width: 22 }} />
        </View>

        {profile && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong">Notificações</AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  Receber as ações ao longo do dia
                </AppText>
              </View>
              <Switch
                value={profile.notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ true: colors.primary, false: colors.border }}
              />
            </View>
          </View>
        )}

        {profile && (
          <>
            <AppText variant="bodyStrong" style={styles.sectionTitle}>
              Localização
            </AppText>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <CurrentLocationField location={profile.location} onChange={handleChangeLocation} />
            </View>
          </>
        )}

        <AppText variant="bodyStrong" style={styles.sectionTitle}>
          Aparência
        </AppText>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {THEME_OPTIONS.map((option, index) => (
            <Pressable
              key={option.value}
              onPress={() => setPreference(option.value)}
              style={[
                styles.themeRow,
                index < THEME_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <Ionicons name={option.icon} size={18} color={colors.text} style={{ marginRight: spacing.sm }} />
              <AppText variant="body" style={{ flex: 1 }}>
                {option.label}
              </AppText>
              {preference === option.value && <Ionicons name="checkmark" size={18} color={colors.primary} />}
            </Pressable>
          ))}
        </View>

        {__DEV__ && (
          <>
            <AppText variant="bodyStrong" style={styles.sectionTitle}>
              Desenvolvedor
            </AppText>
            <Button
              label="🛠️ Abrir Modo Desenvolvedor"
              variant="soft"
              tone="neutral"
              onPress={() => router.push('/dev')}
              style={styles.devButton}
            />
          </>
        )}

        <AppText variant="bodyStrong" style={styles.sectionTitle}>
          Recomeço
        </AppText>
        {confirmingReset ? (
          <View style={[styles.card, styles.resetCard, { backgroundColor: colors.warningBg }]}>
            <AppText variant="bodyStrong" style={styles.signOutTitle}>
              Recomeçar do zero?
            </AppText>
            <AppText variant="caption" color={colors.text} style={styles.signOutDescription}>
              Isso zera suas contagens — histórico de ações, sequência e o que o app já
              percebeu sobre sua evolução. Seu perfil, categorias e horários continuam os mesmos,
              nada precisa ser recadastrado. Não é possível desfazer.
            </AppText>
            <View style={styles.signOutActions}>
              <Button
                label="Cancelar"
                variant="ghost"
                tone="neutral"
                onPress={() => setConfirmingReset(false)}
                disabled={resetting}
                style={styles.signOutActionButton}
              />
              <Button
                label="Sim, recomeçar"
                tone="warning"
                onPress={handleConfirmReset}
                disabled={resetting}
                style={styles.signOutActionButton}
              />
            </View>
          </View>
        ) : (
          <Button
            label="Recomeçar do zero"
            tone="warning"
            variant="soft"
            onPress={() => setConfirmingReset(true)}
            style={styles.signOutButton}
          />
        )}

        {confirmingSignOut ? (
          <View style={[styles.card, styles.signOutCard, { backgroundColor: colors.dangerBg }]}>
            <AppText variant="bodyStrong" color={colors.danger} style={styles.signOutTitle}>
              Sair da conta?
            </AppText>
            <AppText variant="caption" color={colors.text} style={styles.signOutDescription}>
              Isso apaga seu perfil e todo o histórico de ações deste dispositivo. Não é possível desfazer.
            </AppText>
            <View style={styles.signOutActions}>
              <Button
                label="Cancelar"
                variant="ghost"
                tone="neutral"
                onPress={() => setConfirmingSignOut(false)}
                disabled={signingOut}
                style={styles.signOutActionButton}
              />
              <Button
                label="Sim, sair"
                tone="danger"
                onPress={handleConfirmSignOut}
                disabled={signingOut}
                style={styles.signOutActionButton}
              />
            </View>
          </View>
        ) : (
          <Button
            label="Sair"
            tone="danger"
            variant="soft"
            onPress={() => setConfirmingSignOut(true)}
            style={styles.signOutButton}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  devButton: {
    marginBottom: spacing.lg,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  signOutButton: {
    marginTop: spacing.sm,
  },
  signOutCard: {
    marginTop: spacing.sm,
    marginBottom: 0,
  },
  resetCard: {
    marginTop: spacing.sm,
  },
  signOutTitle: {
    marginBottom: spacing.xs,
  },
  signOutDescription: {
    marginBottom: spacing.md,
  },
  signOutActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  signOutActionButton: {
    flex: 1,
  },
});
