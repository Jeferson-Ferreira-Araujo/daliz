import React, { useState } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { spacing, useTheme } from '@/theme';
import { DevTapTrigger } from '@/dev/DevTapTrigger';

// Lockup completo (ícone + wordmark "DALIZ") como veio da arte real — imagem única, não o
// ícone + AppText montados pelo componente Logo (mesmo lockup usado no side menu, ver
// app/(main)/menu.tsx). Sempre a versão clara: o fundo de boas-vindas é claro em qualquer tema
// (background-welcome.png não muda com o tema do app).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const LOGO_FULL_LIGHT = require('../../assets/brand/logo-full-light.png');
// Largura/altura fixas em px, não `aspectRatio` — no RN Web o <Image> ignora `aspectRatio`
// quando a largura vem de `width: '100%'` e usa a altura natural do arquivo (ver menu.tsx).
const LOGO_FULL_WIDTH = 220;
const LOGO_FULL_HEIGHT = Math.round(LOGO_FULL_WIDTH / (1510 / 484));

export default function WelcomeScreen() {
  const { colors } = useTheme();
  // Aceite obrigatório antes de entrar no cadastro — gate único, na primeira tela, em vez de
  // pedir de novo lá no fim do onboarding (a pessoa já leu/decidiu antes de preencher qualquer
  // dado). `termsAcceptedAt` é gravado no perfil só quando o cadastro é concluído de verdade
  // (ver profileService.completeOnboarding) — ninguém chega lá sem passar por essa checkbox.
  const [accepted, setAccepted] = useState(false);

  return (
    <ImageBackground
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      source={require('../../assets/brand/background-welcome.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <DevTapTrigger>
            <View style={styles.brandBlock}>
              <Image
                source={LOGO_FULL_LIGHT}
                style={styles.logoImage}
                resizeMode="contain"
                accessibilityLabel="Daliz"
              />
            </View>
          </DevTapTrigger>
        </View>
        <View style={styles.footer}>
          <Pressable
            onPress={() => setAccepted((prev) => !prev)}
            style={styles.acceptRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: accepted }}
          >
            <Ionicons
              name={accepted ? 'checkbox' : 'square-outline'}
              size={20}
              color={accepted ? colors.primary : colors.textMuted}
              style={styles.acceptIcon}
            />
            <AppText variant="caption" color={colors.textMuted} style={styles.acceptText}>
              Li e aceito os{' '}
              <AppText variant="caption" color={colors.primary} onPress={() => router.push('/terms-of-use')}>
                Termos de Uso
              </AppText>{' '}
              e a{' '}
              <AppText variant="caption" color={colors.primary} onPress={() => router.push('/privacy-policy')}>
                Política de Privacidade
              </AppText>
            </AppText>
          </Pressable>
          <Button label="Começar" onPress={() => router.push('/onboarding/concept')} disabled={!accepted} />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  brandBlock: {
    alignItems: 'center',
  },
  logoImage: {
    width: LOGO_FULL_WIDTH,
    height: LOGO_FULL_HEIGHT,
  },
  acceptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  acceptIcon: {
    marginRight: spacing.sm,
    marginTop: 1,
  },
  acceptText: {
    flex: 1,
  },
  footer: {
    paddingBottom: spacing.lg,
  },
});
