import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { profileService } from '@/services/profileService';
import { useTheme } from '@/theme';

export default function Index() {
  const { colors } = useTheme();
  const [status, setStatus] = useState<'checking' | 'onboard' | 'first-action' | 'main'>('checking');

  useEffect(() => {
    profileService.getProfile().then((profile) => {
      if (!profile) {
        setStatus('onboard');
        return;
      }
      // App fechado entre o fim do cadastro e o toque em "Receber minha primeira ação" — volta
      // exatamente pra essa tela em vez de cair direto (vazia) na Home (ver seção 14 do pedido).
      setStatus(profile.firstActionState === 'not_requested' ? 'first-action' : 'main');
    });
  }, []);

  if (status === 'checking') {
    return (
      <Screen style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (status === 'onboard') {
    return <Redirect href="/onboarding/welcome" />;
  }

  if (status === 'first-action') {
    return <Redirect href="/onboarding/first-action" />;
  }

  return <Redirect href="/(main)/(tabs)/home" />;
}
