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

// Conteúdo real dos termos — cobre o essencial pra um app sem conta/servidor com um catálogo
// próprio de conteúdo. Não substitui revisão jurídica antes da publicação nas lojas (mesma
// ressalva já registrada em privacy-policy.tsx sobre hospedar o texto numa URL pública).
const SECTIONS: Section[] = [
  {
    title: 'Aceitando estes termos',
    body: `Ao usar o ${APP_NAME}, você concorda com estes Termos de Uso e com a nossa Política de Privacidade. Se você não concorda com algum ponto, pedimos que não use o app.`,
  },
  {
    title: 'O que é o Daliz',
    body: `O ${APP_NAME} sugere pequenas ações diárias personalizadas com base no que você conta sobre sua rotina, interesses e pessoas importantes. É uma ferramenta de bem-estar e organização pessoal — não substitui aconselhamento médico, psicológico, financeiro, jurídico ou de qualquer outro profissional. Em caso de dúvida sobre sua saúde física ou mental, procure um profissional qualificado.`,
  },
  {
    title: 'Quem pode usar',
    body: 'O app é destinado a maiores de 13 anos. Se você tem entre 13 e 18 anos, use com o conhecimento de um responsável.',
  },
  {
    title: 'Uso permitido',
    body: 'Você pode usar o app livremente para fins pessoais e não comerciais. Não é permitido copiar, extrair ou redistribuir o catálogo de ações do app para fins comerciais, nem tentar contornar, desmontar ou explorar falhas do app.',
  },
  {
    title: 'Conteúdo e propriedade intelectual',
    body: `Os textos das ações, a marca ${APP_NAME}, o logotipo e o design do app pertencem a nós ou a nossos licenciantes. O que você digita — nome, anotações, pessoas cadastradas — continua seu; usamos apenas para gerar suas ações, como descrito na Política de Privacidade.`,
  },
  {
    title: 'Notificações e disponibilidade',
    body: 'As notificações são geradas e agendadas localmente no seu aparelho. Alguns recursos (clima, mapas, busca) dependem de serviços de terceiros gratuitos e podem ficar temporariamente indisponíveis — o app continua funcionando normalmente sem eles, só sem esse contexto extra.',
  },
  {
    title: 'Anúncios e serviços de terceiros',
    body: 'O app pode exibir anúncios (Google AdMob) e abrir links para serviços externos (Google Maps, Spotify, busca do Google) quando você toca em botões de apoio a uma ação. Esses serviços têm seus próprios termos e políticas, fora do nosso controle.',
  },
  {
    title: 'Sem garantias',
    body: 'O app é fornecido "como está". Fazemos o possível para que as sugestões façam sentido para sua rotina, mas não garantimos resultados específicos de bem-estar, produtividade ou qualquer outro tipo. O uso é por sua conta e risco.',
  },
  {
    title: 'Limitação de responsabilidade',
    body: `Na máxima extensão permitida por lei, o ${APP_NAME} e seus criadores não se responsabilizam por danos indiretos, perda de dados do aparelho (ex.: desinstalação, troca de celular sem backup) ou decisões pessoais tomadas com base nas ações sugeridas.`,
  },
  {
    title: 'Cancelamento e exclusão de dados',
    body: 'Não existe assinatura ou conta para cancelar. Basta desinstalar o app, ou usar "Sair" em Configurações para apagar seu perfil e histórico deste aparelho a qualquer momento.',
  },
  {
    title: 'Mudanças nestes termos',
    body: 'Podemos atualizar estes termos conforme o app evolui. Mudanças relevantes serão refletidas na data de atualização abaixo — o uso continuado do app após uma alteração significa que você concorda com a nova versão.',
  },
  {
    title: 'Lei aplicável',
    body: 'Estes termos são regidos pelas leis do Brasil. Eventuais disputas serão resolvidas no foro do domicílio do usuário, conforme o Código de Defesa do Consumidor.',
  },
  {
    title: 'Contato',
    body: `Dúvidas sobre estes termos? Escreva para ${SUPPORT_EMAIL}.`,
  },
];

export default function TermsOfUseScreen() {
  const { colors } = useTheme();

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <AppText variant="title">Termos de Uso</AppText>
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
