import { Share } from 'react-native';
import { statsService } from '@/services/statsService';
import { APP_NAME, APP_STORE_URL } from '@/constants/app';

/** Compartilha o progresso do usuário via o share nativo — usado tanto no ícone do cabeçalho
 * (TabHeaderIcons) quanto no botão "Compartilhar meu progresso" da aba Perfil. */
export async function shareProgress(): Promise<void> {
  const stats = await statsService.getAggregatedStats();
  const message = `Com ajuda do ${APP_NAME}, consegui ser melhor do que fui ontem. Concluí ${stats.totalCompleted} ações. Tente você também!\n${APP_STORE_URL}`;
  try {
    await Share.share({ message });
  } catch {
    // usuário cancelou ou a plataforma não suporta compartilhamento — sem problema
  }
}
