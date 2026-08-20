import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { spacing, useTheme } from '@/theme';
import { APP_NAME, SUPPORT_EMAIL } from '@/constants/app';

interface Section {
  title: string;
  body: string;
}

// Conteúdo real da política — o texto em si já cobre o que a Apple/Google exigem, mas a submissão
// nas lojas pede uma URL pública (não uma tela dentro do app). Antes de publicar, hospedar este
// mesmo texto em uma página (site, GitHub Pages etc.) e usar essa URL no cadastro do app.
const SECTIONS: Section[] = [
  {
    title: 'O que este app faz com seus dados',
    body: `O ${APP_NAME} não tem servidor, conta de usuário ou sincronização em nuvem. Tudo o que você preenche — nome, data de nascimento, localização (cidade), pessoas importantes, fotos escolhidas — fica salvo só neste aparelho. Nada é enviado para nós nem vendido para terceiros.`,
  },
  {
    title: 'Localização',
    body: 'Usamos sua localização aproximada só para saber a cidade e o clima do seu dia — nunca um endereço exato. Essa informação é enviada apenas aos serviços gratuitos de clima e geocodificação (Open-Meteo e BigDataCloud), só para obter cidade/clima, e não fica armazenada em nenhum servidor nosso.',
  },
  {
    title: 'Notificações',
    body: 'As notificações são geradas e disparadas localmente no seu aparelho, no seu horário. Você pode desativá-las a qualquer momento em Configurações.',
  },
  {
    title: 'Câmera e fotos',
    body: 'Quando uma ação pede uma foto, ela é aberta e descartada na hora — não fica salva no app. A única foto que o app guarda é a que você escolhe deliberadamente como foto de perfil, e ela continua só no seu aparelho.',
  },
  {
    title: 'Pessoas importantes para você',
    body: 'Nomes, idade aproximada e relação das pessoas que você cadastra (incluindo filhos, se você adicionar) servem só para personalizar suas ações e nunca saem do seu aparelho.',
  },
  {
    title: 'Apagar seus dados',
    body: 'Em Configurações, "Sair" apaga permanentemente todo o seu perfil e histórico deste aparelho. Como não existe conta ou servidor, isso já é a exclusão completa dos seus dados.',
  },
  {
    title: 'Anúncios',
    body: 'Este app pode exibir um banner de anúncios (Google AdMob) para se manter gratuito. Quando ativo, o AdMob pode processar identificadores do dispositivo para exibir anúncios, seguindo a própria política de privacidade do Google.',
  },
  {
    title: 'Contato',
    body: `Dúvidas sobre privacidade? Escreva para ${SUPPORT_EMAIL}.`,
  },
];

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <AppText variant="title">Política de Privacidade</AppText>
          <View style={{ width: 22 }} />
        </View>

        <AppText variant="caption" color={colors.textMuted} style={styles.updated}>
          Última atualização: agosto de 2026
        </AppText>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <AppText variant="bodyStrong" style={styles.sectionTitle}>
              {section.title}
            </AppText>
            <AppText variant="body" color={colors.textMuted}>
              {section.body}
            </AppText>
          </View>
        ))}
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
    marginBottom: spacing.sm,
  },
  updated: {
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
  },
});
