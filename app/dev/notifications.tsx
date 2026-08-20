import React, { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DevScreen, DevSection, DevRow, DevKeyValue, DevBanner } from '@/dev/DevUI';
import { AppText } from '@/components/ui/AppText';
import { spacing, useTheme } from '@/theme';
import { profileService } from '@/services/profileService';
import { notificationService } from '@/services/notificationService';
import { devService } from '@/dev/devService';
import { TIMING_LABELS } from '@/engine/challengeTiming';
import type { ActionSupportType, ChallengeInstance, ChallengeTiming, UserProfile } from '@/types';

const TIMING_TEST_ORDER: ChallengeTiming[] = ['now', 'today', 'contextual'];
const SUPPORT_TEST_ORDER: ActionSupportType[] = ['search', 'categories', 'maps', 'spotify'];
const SUPPORT_ICON: Record<ActionSupportType, keyof typeof Ionicons.glyphMap> = {
  none: 'ellipse-outline',
  search: 'search-outline',
  categories: 'film-outline',
  maps: 'map-outline',
  spotify: 'musical-notes-outline',
};
const SUPPORT_TEST_LABEL: Record<ActionSupportType, string> = {
  none: '—',
  search: 'Pesquisar',
  categories: 'Filmes',
  maps: 'Maps',
  spotify: 'Spotify',
};
const TIMING_ICON: Record<ChallengeTiming, keyof typeof Ionicons.glyphMap> = {
  now: 'flash-outline',
  today: 'sunny-outline',
  contextual: 'hourglass-outline',
};

export default function DevNotificationsScreen() {
  const { colors } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [permission, setPermission] = useState<string>('');
  const [lastSent, setLastSent] = useState<ChallengeInstance | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [queueProgress, setQueueProgress] = useState<{ sent: number; total: number } | null>(null);

  const load = useCallback(async () => {
    const [currentProfile, status, last] = await Promise.all([
      profileService.getProfile(),
      notificationService.getPermissionStatus(),
      devService.getLastSentInstance(),
    ]);
    setProfile(currentProfile);
    setPermission(status);
    setLastSent(last);
    setQueueProgress(currentProfile ? await devService.getNotificationQueueProgress(currentProfile) : null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function runAction(action: () => Promise<void>, message: string) {
    setBusy(true);
    setFeedback(null);
    try {
      await action();
      setFeedback(message);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleSendNextQueued() {
    if (!profile) return;
    setBusy(true);
    setFeedback(null);
    try {
      const result = await devService.sendNextQueuedNotification(profile);
      if (!result) {
        setFeedback(`✅ Todas as notificações de hoje já foram enviadas (${queueProgress?.total ?? 0}/${queueProgress?.total ?? 0}).`);
      } else {
        const { instance, sentIndex, total } = result;
        setFeedback(`📬 ${sentIndex}/${total} — "${instance.titulo}"`);
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleSendMusicChallenge() {
    if (!profile) return;
    setBusy(true);
    setFeedback(null);
    try {
      const instance = await devService.sendMusicChallengeNow(profile);
      setFeedback(instance ? `🎧 "${instance.titulo}"` : 'Nenhuma ação de música disponível no momento.');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleSendBibleChallenge() {
    if (!profile) return;
    setBusy(true);
    setFeedback(null);
    try {
      const instance = await devService.sendBibleChallengeNow(profile);
      setFeedback(instance ? `📖 "${instance.titulo}"` : 'Nenhuma ação bíblica disponível no momento.');
      await load();
    } finally {
      setBusy(false);
    }
  }

  function handleResetQueue() {
    devService.resetNotificationQueue();
    setFeedback('Fila de notificações reiniciada — o próximo toque manda a primeira de novo.');
    load();
  }

  async function handleSendTimedChallenge(timing: ChallengeTiming) {
    if (!profile) return;
    setBusy(true);
    setFeedback(null);
    try {
      const instance = await devService.sendTimedChallengeNow(profile, timing);
      setFeedback(instance ? `${TIMING_LABELS[timing]} — "${instance.titulo}"` : `Nenhuma ação ${timing} disponível no momento.`);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleSendSuggestion() {
    if (!profile) return;
    setBusy(true);
    setFeedback(null);
    try {
      const instance = await devService.sendSuggestionNow(profile);
      setFeedback(instance ? `💡 Sugestão — "${instance.titulo}"` : 'Nenhuma sugestão disponível nas categorias desse perfil.');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleSendSupportChallenge(supportType: ActionSupportType) {
    if (!profile) return;
    setBusy(true);
    setFeedback(null);
    try {
      const instance = await devService.sendSupportChallengeNow(profile, supportType);
      setFeedback(instance ? `${SUPPORT_TEST_LABEL[supportType]} — "${instance.titulo}"` : `Nenhuma ação com suporte "${supportType}" disponível no momento.`);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleCloseToday() {
    if (!profile) return;
    setBusy(true);
    setFeedback(null);
    try {
      const closed = await devService.closeTodayNow(profile);
      setFeedback(
        closed
          ? 'Ações today/contextual que ainda estavam abertas de períodos anteriores viraram "ignorado" internamente.'
          : 'Não havia nenhuma pendência de período anterior pra expirar.',
      );
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <DevScreen title="Notificações">
      {Platform.OS === 'web' ? (
        <DevBanner
          tone="warning"
          text="expo-notifications não funciona no preview web. As ações abaixo não vão disparar nada aqui — teste no Expo Go (iOS/Android) pra validar notificações de verdade."
        />
      ) : (
        <DevBanner text="Só o disparo imediato ('agora') pode ser testado com confiabilidade no Expo Go. Notificações agendadas pro futuro respeitam o relógio REAL do dispositivo, não o simulado — isso é uma limitação do sistema operacional, não do app." />
      )}

      <DevSection title="Ações">
        <DevRow
          icon="notifications-outline"
          label="Enviar notificação agora"
          description="Notificação de teste genérica"
          onPress={() => runAction(() => devService.sendTestNotification(), 'Notificação de teste enviada.')}
          disabled={busy}
        />
        <DevRow
          icon="paper-plane-outline"
          label="Testar notificação de ação"
          description="Usa o mesmo formato das notificações reais"
          onPress={() =>
            runAction(async () => {
              let instance = lastSent;
              if (!instance && profile) instance = await devService.createTestChallenge(profile);
              if (instance) await devService.sendChallengeNotification(instance);
            }, 'Notificação de ação enviada.')
          }
          disabled={busy || !profile}
          last
        />
      </DevSection>

      <DevSection title="Testar Spotify / Versículo">
        <AppText variant="caption" color={colors.textMuted} style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
          Sorteio normal do dia pode não incluir uma ação de música ou de fé — estes botões forçam
          uma ação desse tipo especificamente, pra testar o botão "Abrir no Spotify"/"Ler
          versículo" sem depender de sorte.
        </AppText>
        <DevRow
          icon="musical-notes-outline"
          label="Enviar ação de música agora"
          description="Sorteia uma ação com botão do Spotify"
          onPress={handleSendMusicChallenge}
          disabled={busy || !profile}
        />
        <DevRow
          icon="book-outline"
          label="Enviar ação bíblica agora"
          description="Sorteia uma ação com botão de versículo"
          onPress={handleSendBibleChallenge}
          disabled={busy || !profile}
          last
        />
      </DevSection>

      <DevSection title="Testar Timing">
        <AppText variant="caption" color={colors.textMuted} style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
          Força uma ação de cada timing (⚡ AGORA / ☀️ HOJE / ⏳ QUANDO FIZER SENTIDO), sem
          esperar o sorteio normal do dia incluir um. "Encerrar dia agora" expira agora as
          pendências de períodos anteriores — o mesmo que aconteceria ao passar do horário de
          dormir — pra testar o que sobra em aberto virando "ignorado" sem esperar a hora real.
        </AppText>
        {TIMING_TEST_ORDER.map((timing) => (
          <DevRow
            key={timing}
            icon={TIMING_ICON[timing]}
            label={`Testar ação ${timing === 'now' ? 'AGORA' : timing === 'today' ? 'HOJE' : 'QUANDO FIZER SENTIDO'}`}
            description={TIMING_LABELS[timing]}
            onPress={() => handleSendTimedChallenge(timing)}
            disabled={busy || !profile}
          />
        ))}
        <DevRow
          icon="moon-outline"
          label="Encerrar dia agora"
          description="Expira ações today/contextual ainda abertas"
          onPress={handleCloseToday}
          disabled={busy}
          last
        />
      </DevSection>

      <DevSection title="Testar Sugestão">
        <AppText variant="caption" color={colors.textMuted} style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
          Força uma ação `actionKind: 'sugestao'` (💡 orientação contextual, sem botão de
          conclusão) — testa o título/corpo próprios dessa notificação sem depender do sorteio
          normal do dia incluir uma.
        </AppText>
        <DevRow
          icon="bulb-outline"
          label="Testar notificação de sugestão"
          description="💡 Uma orientação pra agora"
          onPress={handleSendSuggestion}
          disabled={busy || !profile}
          last
        />
      </DevSection>

      <DevSection title="Testar Suporte">
        <AppText variant="caption" color={colors.textMuted} style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
          Força uma ação de cada supportType (busca/filmes/maps/spotify) pra testar os botões
          da camada de assistência sem depender de sorte no sorteio normal do dia.
        </AppText>
        {SUPPORT_TEST_ORDER.map((supportType) => (
          <DevRow
            key={supportType}
            icon={SUPPORT_ICON[supportType]}
            label={`Testar suporte: ${SUPPORT_TEST_LABEL[supportType]}`}
            description={supportType}
            onPress={() => handleSendSupportChallenge(supportType)}
            disabled={busy || !profile}
          />
        ))}
      </DevSection>

      <DevSection title="Testar Resumo Semanal">
        <AppText variant="caption" color={colors.textMuted} style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
          Dispara agora a notificação de "O que você melhorou?" com os dados reais da semana
          atual — em produção ela só chega na segunda seguinte, sobre a semana que fechou.
        </AppText>
        <DevRow
          icon="sparkles-outline"
          label="Enviar resumo semanal agora"
          description="Usa os dados reais da semana atual"
          onPress={() => runAction(async () => { await devService.sendWeeklyRecapNow(); }, 'Resumo semanal enviado.')}
          disabled={busy}
          last
        />
      </DevSection>

      <DevSection title="Fila de notificações do dia">
        <AppText variant="caption" color={colors.textMuted} style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
          Manda, uma de cada vez e em ordem, as notificações reais de todas as ações de hoje —
          pra testar se a sequência faz sentido e se a quantidade está adequada, sem precisar
          esperar os horários reais.
        </AppText>
        <DevRow
          icon="play-forward-outline"
          label="Enviar próxima notificação"
          description={queueProgress ? `${queueProgress.sent}/${queueProgress.total} já enviadas` : 'Carregando...'}
          onPress={handleSendNextQueued}
          disabled={busy || !profile}
        />
        <DevRow
          icon="refresh-outline"
          label="Reiniciar fila"
          description="Volta a contagem pro início, sem regenerar o dia"
          onPress={handleResetQueue}
          disabled={busy || !profile}
          last
        />
      </DevSection>

      {feedback && <DevBanner tone="success" text={feedback} />}

      <DevSection title="Tipo de teste sugerido">
        <AppText variant="caption" color={colors.textMuted} style={{ padding: spacing.md }}>
          Envie e então: deixe o app aberto (banner aparece na hora), coloque em segundo plano (Home do celular) ou feche
          totalmente o app — notificação local funciona nos três casos.
        </AppText>
      </DevSection>

      <DevSection title="Estado">
        <DevKeyValue label="Permissão" value={permission || '—'} />
        <DevKeyValue label="Última instância enviada" value={lastSent ? lastSent.titulo : 'nenhuma'} last />
      </DevSection>
    </DevScreen>
  );
}
