import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { radius, spacing, useTheme } from '@/theme';
import { profileService } from '@/services/profileService';
import { dayCycleService } from '@/services/dayCycleService';
import { getCurrentDate } from '@/utils/now';
import type { UserProfile } from '@/types';

export default function FirstActionScreen() {
  const { colors } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    profileService.getProfile().then((loaded) => {
      if (!loaded) {
        router.replace('/onboarding/welcome');
        return;
      }
      setProfile(loaded);
    });
  }, []);

  async function handleRequest() {
    if (!profile || loading) return;
    setLoading(true);
    setError(false);
    try {
      await dayCycleService.requestFirstAction(profile, getCurrentDate());
      router.replace('/(main)/(tabs)/home');
    } catch (err) {
      if (__DEV__) console.error('[first-action]', err);
      setError(true);
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted }]}>
          <AppText variant="hero">🌱</AppText>
        </View>
        <AppText variant="title" style={styles.title}>
          Bem-vindo ao Daliz!
        </AppText>
        <AppText variant="body" color={colors.textMuted} style={styles.description}>
          A partir de agora, vamos encontrar pequenas ações que façam sentido para o seu dia. Você
          não precisa mudar tudo de uma vez.
        </AppText>
        <AppText variant="bodyStrong" style={styles.callToAction}>
          Vamos começar com uma pequena ação?
        </AppText>
        {error && (
          <AppText variant="caption" color={colors.danger} style={styles.error}>
            Não conseguimos preparar sua ação agora. Tente novamente em alguns instantes.
          </AppText>
        )}
      </View>
      <View style={styles.footer}>
        <Button
          label={loading ? 'Preparando sua ação...' : '✨ Receber minha primeira ação'}
          onPress={handleRequest}
          disabled={loading || !profile}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  callToAction: {
    textAlign: 'center',
  },
  error: {
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  footer: {
    paddingBottom: spacing.lg,
  },
});
