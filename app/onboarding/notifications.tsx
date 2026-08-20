import React, { useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { radius, spacing, useTheme } from '@/theme';
import { notificationService } from '@/services/notificationService';
import { profileService } from '@/services/profileService';
import { onboardingDraft } from '@/services/onboardingDraft';

// Sem notificação, o app não cumpre sua proposta (lembrar a pessoa ao longo do dia) — por isso
// essa tela não deixa mais "pular" pra dentro do app sem a permissão de verdade concedida (ver
// pedido do usuário). No web, expo-notifications não funciona de verdade (nem local, nem
// push — ver notificationService.sendNow) então bloquear aqui só travaria o único jeito de
// testar o resto do app nesse ambiente; a garantia vale pro app real (iOS/Android).
type Status = 'idle' | 'requesting' | 'denied' | 'checking';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const [status, setStatus] = useState<Status>('idle');

  async function finishOnboarding(notificationsEnabled: boolean) {
    const draft = onboardingDraft.get();
    if (!draft) {
      router.replace('/onboarding/profile');
      return;
    }
    await profileService.completeOnboarding(draft, notificationsEnabled);
    onboardingDraft.clear();
    router.replace('/onboarding/first-action');
  }

  async function handleEnable() {
    if (Platform.OS === 'web') {
      await finishOnboarding(false);
      return;
    }
    setStatus('requesting');
    const granted = await notificationService.requestPermissions();
    if (granted) {
      await finishOnboarding(true);
      return;
    }
    setStatus('denied');
  }

  async function handleCheckAgain() {
    setStatus('checking');
    const current = await notificationService.getPermissionStatus();
    if (current === 'granted') {
      await finishOnboarding(true);
      return;
    }
    setStatus('denied');
  }

  const busy = status === 'requesting' || status === 'checking';
  const checkAgainLabel = status === 'checking' ? 'Verificando...' : 'Já ativei, continuar';
  const enableLabel = status === 'requesting' ? 'Ativando...' : 'Ativar notificações';

  return (
    <Screen>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted }]}>
          <AppText variant="hero">🔔</AppText>
        </View>
        <AppText variant="title" style={styles.title}>
          Suas ações chegam por notificação
        </AppText>
        <AppText variant="body" color={colors.textMuted} style={styles.description}>
          {status === 'denied'
            ? 'Sem essa permissão o Daliz não consegue cumprir sua proposta, que é te lembrar de pequenas ações ao longo do dia. Ative nas configurações do seu celular e volte aqui.'
            : 'Sem notificações, é fácil esquecer. Vamos te avisar em poucos momentos ao longo do dia — sempre respeitando seu horário de trabalho e de sono.'}
        </AppText>
      </View>
      <View style={styles.footer}>
        {status === 'denied' ? (
          <>
            <Button label="Abrir configurações do celular" onPress={() => Linking.openSettings()} disabled={busy} />
            <Button label={checkAgainLabel} variant="ghost" tone="neutral" onPress={handleCheckAgain} disabled={busy} style={styles.skip} />
          </>
        ) : (
          <Button label={enableLabel} onPress={handleEnable} disabled={busy} />
        )}
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
  },
  footer: {
    paddingBottom: spacing.lg,
  },
  skip: {
    marginTop: spacing.xs,
  },
});
