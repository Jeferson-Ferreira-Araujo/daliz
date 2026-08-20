import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { DevScreen, DevBanner } from '@/dev/DevUI';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { radius, spacing, useTheme } from '@/theme';
import { profileService } from '@/services/profileService';
import { devService } from '@/dev/devService';
import type { UserProfile } from '@/types';

interface Scenario {
  key: string;
  icon: string;
  title: string;
  description: string;
  run: (profile: UserProfile | null) => Promise<void>;
  needsProfile?: boolean;
  navigateHome?: boolean;
  /** Some cenários deixam um perfil já existente com um estado específico e precisam que o
   * roteamento de verdade (`app/index.tsx`) decida pra onde ir — em vez do atalho fixo pro
   * onboarding usado por `navigateHome`. */
  navigateTo?: string;
}

export default function DevScenariosScreen() {
  const { colors } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    setProfile(await profileService.getProfile());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const scenarios: Scenario[] = [
    {
      key: 'new',
      icon: '👤',
      title: 'Usuário novo',
      description: 'Reseta perfil e histórico — estado de quem acabou de instalar.',
      run: async () => {
        await devService.simulateNewUser();
      },
      navigateHome: true,
    },
    {
      key: 'onboardingFormTest',
      icon: '🧪',
      title: 'Testar cadastro (pré-preenchido)',
      description:
        'Reseta a conta e leva você pro cadastro de verdade, já com os campos preenchidos — só aperte "Continuar" em cada tela pra revisar.',
      run: async () => {
        await devService.simulateOnboardingFormTest();
      },
      navigateHome: true,
    },
    {
      key: 'firstAction',
      icon: '🌱',
      title: 'Onboarded, sem 1ª ação ainda',
      description: 'Perfil de teste pronto, mas ainda não pediu "Receber minha primeira ação".',
      run: async () => {
        await devService.simulateOnboardedNotYetFirstAction();
      },
      navigateTo: '/',
    },
    {
      key: 'engaged',
      icon: '⭐',
      title: 'Usuário engajado',
      description: 'Gera ~12 dias de histórico com boa taxa de conclusão e boas reações.',
      run: async () => {
        await devService.simulateEngagedUser();
      },
    },
    {
      key: 'low',
      icon: '📉',
      title: 'Usuário com baixa adesão',
      description: 'Gera histórico com muitas ações não concluídas, motivos variados.',
      run: async () => {
        await devService.simulateLowEngagementUser();
      },
    },
    {
      key: 'endOfDay',
      icon: '🌙',
      title: 'Final do dia',
      description: 'Avança o relógio simulado pra 23:59 e mistura status de hoje.',
      run: async (profile) => {
        if (profile) await devService.simulateEndOfDay(profile);
      },
      needsProfile: true,
    },
    {
      key: 'pending',
      icon: '⏰',
      title: 'Ação pendente',
      description: 'Cria uma ação atrasada pra testar o indicador "Atrasado".',
      run: async (profile) => {
        if (profile) await devService.simulatePendingChallenge(profile);
      },
      needsProfile: true,
    },
  ];

  async function handleApply(scenario: Scenario) {
    if (scenario.needsProfile && !profile) return;
    setBusyKey(scenario.key);
    setFeedback(null);
    try {
      await scenario.run(profile);
      if (scenario.navigateTo) {
        router.replace(scenario.navigateTo as never);
        return;
      }
      if (scenario.navigateHome) {
        router.replace('/onboarding/welcome');
        return;
      }
      await load();
      setFeedback(`Cenário "${scenario.title}" aplicado.`);
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <DevScreen title="Cenários de Teste">
      <AppText variant="body" color={colors.textMuted} style={styles.intro}>
        Selecione um cenário para aplicar um conjunto de dados de teste.
      </AppText>

      {feedback && <DevBanner tone="success" text={feedback} />}

      {scenarios.map((scenario) => (
        <View key={scenario.key} style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong">
              {scenario.icon} {scenario.title}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {scenario.description}
            </AppText>
          </View>
          <Button
            label="Aplicar"
            size="sm"
            tone="primary"
            variant="soft"
            disabled={busyKey !== null || (scenario.needsProfile && !profile)}
            onPress={() => handleApply(scenario)}
          />
        </View>
      ))}
    </DevScreen>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginBottom: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
});
