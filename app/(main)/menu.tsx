import React from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { radius, spacing, useTheme } from '@/theme';
import { SOCIAL_LINKS, SUPPORT_EMAIL } from '@/constants/app';

// Lockup completo (ícone + wordmark "DALIZ") como veio da arte real — imagem única, não o
// ícone + AppText montados pelo componente Logo. O texto vem em azul-marinho fixo na arte, por
// isso existe uma segunda versão com o texto recolorido pra branco (ver
// scripts/apply-real-brand-assets.js), escolhida conforme o tema pra continuar legível no escuro.
const LOGO_FULL_LIGHT = require('../../assets/brand/logo-full-light.png');
const LOGO_FULL_DARK = require('../../assets/brand/logo-full-dark.png');
// Largura/altura fixas em px, não `aspectRatio` — no RN Web o <Image> ignora `aspectRatio` quando
// a largura vem de `width: '100%'` e usa a altura natural do arquivo (484px), quase tomando o
// side menu inteiro. Calculando a altura já em px a partir da largura alvo evita o bug.
const LOGO_FULL_WIDTH = 190;
const LOGO_FULL_HEIGHT = Math.round(LOGO_FULL_WIDTH / (1510 / 484));

/**
 * Menu lateral (aberto pelo ícone de "menu" no cabeçalho das abas — ver TabHeaderIcons) —
 * conteúdo informativo (marca, redes sociais, contato, política de privacidade no rodapé).
 * Diferente de Configurações (settings.tsx), que só tem ajustes de fato — ver ARCHITECTURE.md.
 * Rota com `presentation: 'transparentModal'` + `animation: 'slide_from_left'` (ver
 * app/(main)/_layout.tsx): o backdrop abaixo é o que dá a sensação de painel lateral, não
 * uma tela cheia — tocar nele fecha o menu igual um side menu de verdade.
 */
export default function MenuScreen() {
  const { colors, scheme } = useTheme();

  function handleOpenSupportEmail() {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {});
  }

  function handleOpenSocialLink(url: string) {
    Linking.openURL(url).catch(() => {});
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()} />
      <SafeAreaView edges={['top', 'bottom']} style={[styles.panel, { backgroundColor: colors.background }]}>
        <View style={styles.closeRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.logoBlock}>
            <Image
              source={scheme === 'dark' ? LOGO_FULL_DARK : LOGO_FULL_LIGHT}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="Daliz"
            />
          </View>

          <AppText variant="bodyStrong" style={styles.sectionTitle}>
            Nossas redes sociais
          </AppText>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {SOCIAL_LINKS.map((social, index) => (
              <Pressable
                key={social.label}
                onPress={() => handleOpenSocialLink(social.url)}
                style={[
                  styles.socialRow,
                  index < SOCIAL_LINKS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <Ionicons name={social.icon} size={18} color={colors.text} style={styles.linkIcon} />
                <AppText variant="body" style={{ flex: 1 }}>
                  {social.label}
                </AppText>
                <Ionicons name="open-outline" size={16} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>

          <AppText variant="bodyStrong" style={styles.sectionTitle}>
            Contato
          </AppText>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <AppText variant="caption" color={colors.textMuted} style={styles.locationHint}>
              Sugestões, dúvidas ou algo não funcionou como esperado? Fale com a gente.
            </AppText>
            <Pressable onPress={handleOpenSupportEmail} style={styles.linkRow}>
              <Ionicons name="mail-outline" size={18} color={colors.text} style={styles.linkIcon} />
              <AppText variant="body" color={colors.primary}>
                {SUPPORT_EMAIL}
              </AppText>
            </Pressable>
          </View>

          <Pressable onPress={() => router.push('/privacy-policy')} style={styles.footerLinkRow}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.textMuted} style={styles.linkIcon} />
            <AppText variant="caption" color={colors.textMuted}>
              Política de Privacidade
            </AppText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(22, 35, 63, 0.45)',
  },
  panel: {
    width: '82%',
    maxWidth: 340,
    height: '100%',
  },
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  logoBlock: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoImage: {
    width: LOGO_FULL_WIDTH,
    height: LOGO_FULL_HEIGHT,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  locationHint: {
    marginBottom: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkIcon: {
    marginRight: spacing.sm,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  footerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
});
