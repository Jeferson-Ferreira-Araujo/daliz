import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { Firestore } from '@react-native-firebase/firestore';

// Mesmo padrão de analyticsService.ts/crashService.ts: SDK nativo, não existe no Expo Go nem no
// preview web. `require` sob demanda + try/catch não basta sozinho — o Metro reporta como erro
// fatal global qualquer módulo que falhe na primeira avaliação, derrubando o app mesmo com o
// `require` dentro de um try/catch (visto num teste real no Expo Go). Por isso o `require` nem é
// tentado em `executionEnvironment === StoreClient` (Expo Go); o try/catch é a segunda camada
// pra outros cenários (web).
const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Limite de tamanho pro texto livre — bate com a regra de segurança do Firestore (ver
// firestore.rules), pra o app nunca tentar uma escrita que o servidor vai rejeitar de qualquer
// jeito. 300 é bem mais que suficiente pra "o que você gosta de fazer".
const MAX_TEXT_LENGTH = 300;

let cachedFirestore: Firestore | null | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- só resolvido em runtime nativo, ver getFirestoreInstance
let firestoreModule: any;

function getFirestoreInstance(): Firestore | null {
  if (cachedFirestore !== undefined) return cachedFirestore;
  if (IS_EXPO_GO) {
    cachedFirestore = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires -- carregado sob demanda, ver comentário acima
    firestoreModule = require('@react-native-firebase/firestore');
    cachedFirestore = firestoreModule.getFirestore();
  } catch {
    cachedFirestore = null;
  }
  return cachedFirestore ?? null;
}

export const otherInterestFeedbackService = {
  /**
   * Envia o texto livre digitado no interesse "✨ Outro" (ver app/onboarding/profile.tsx e
   * app/(main)/edit-profile.tsx) pra uma coleção do Firestore — não alimenta o motor, é só
   * coletado pra dar pra consultar depois no console do Firebase e considerar expandir a lista
   * fixa de interesses. Sem autenticação (o app não tem login de usuário) — a coleção é
   * write-only por regra de segurança (ver firestore.rules), então nada enviado aqui pode ser
   * lido de volta pelo próprio app. Nunca lança: uma falha aqui não pode derrubar o fluxo de
   * salvar o perfil, que é o que a pessoa realmente estava tentando fazer.
   */
  async submitOtherInterest(text: string): Promise<void> {
    const trimmed = text.trim().slice(0, MAX_TEXT_LENGTH);
    if (trimmed.length === 0) return;

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[otherInterestFeedback]', trimmed);
    }

    const firestore = getFirestoreInstance();
    if (!firestore) return;

    try {
      await firestoreModule.addDoc(firestoreModule.collection(firestore, 'otherInterests'), {
        text: trimmed,
        platform: Platform.OS,
        createdAt: firestoreModule.serverTimestamp(),
      });
    } catch {
      // Falha de rede/permissão aqui não pode impedir a pessoa de salvar o perfil — é só um
      // envio de feedback em segundo plano, não uma etapa obrigatória do fluxo.
    }
  },
};
