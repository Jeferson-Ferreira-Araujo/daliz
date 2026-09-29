import { Share } from 'react-native';
import { statsService } from '@/services/statsService';
import { APP_NAME, APP_STORE_URL } from '@/constants/app';

/** Compartilha o progresso do usuário via o share nativo — usado tanto no ícone do cabeçalho
 * (TabHeaderIcons) quanto no botão "Compartilhar meu progresso" da aba Perfil. Sem Concluir/Não
 * consegui (ver plano de migração), a mensagem fala de PRESENÇA (ações recebidas), não de
 * conclusão — antes disso ela sempre teria dito "Concluí 0 ações", já que esse sinal não existe
 * mais. */
export async function shareProgress(): Promise<void> {
  const stats = await statsService.getPresenceSummary();
  const message = `Com ajuda do ${APP_NAME}, venho recebendo pequenas ações todos os dias — já foram ${stats.totalDelivered}. Tente você também!\n${APP_STORE_URL}`;
  try {
    await Share.share({ message });
  } catch {
    // usuário cancelou ou a plataforma não suporta compartilhamento — sem problema
  }
}
