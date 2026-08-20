import React from 'react';
import { router } from 'expo-router';
import { DevScreen, DevSection, DevRow, DevBanner } from '@/dev/DevUI';
import { useDevClockState } from '@/dev/devClock';

export default function DevMenuScreen() {
  const clock = useDevClockState();

  return (
    <DevScreen title="🛠️ Modo Desenvolvedor" onClose={() => router.replace('/')}>
      <DevBanner text="Ferramentas exclusivas para testes e simulações. Não aparecem na versão final do app." />

      <DevSection title="Testes">
        <DevRow
          icon="time-outline"
          label="Relógio Simulado"
          description={clock.enabled ? `Relógio simulado: ${formatDateTime(clock.simulatedAt)}` : 'Simule horários, datas e a virada do dia'}
          onPress={() => router.push('/dev/clock')}
        />
        <DevRow
          icon="flag-outline"
          label="Ações"
          description="Criar, enviar e gerenciar ações"
          onPress={() => router.push('/dev/challenges')}
        />
        <DevRow
          icon="calendar-outline"
          label="Prévia do cadastro"
          description="Edite o perfil e veja ao vivo quais ações e horários seriam enviados"
          onPress={() => router.push('/dev/schedule-preview')}
        />
        <DevRow
          icon="sparkles-outline"
          label="Interesses"
          description="Testar personalização por hobbies e ver o raciocínio da escolha"
          onPress={() => router.push('/dev/interests')}
        />
        <DevRow
          icon="heart-outline"
          label="Pessoas importantes"
          description="Gerenciar pessoas de teste e ver o raciocínio da escolha"
          onPress={() => router.push('/dev/people')}
        />
        <DevRow
          icon="partly-sunny-outline"
          label="Contexto Inteligente"
          description="Clima, estação, datas comemorativas e o raciocínio do motor"
          onPress={() => router.push('/dev/context')}
        />
        <DevRow
          icon="notifications-outline"
          label="Notificações"
          description="Enviar notificações de teste"
          onPress={() => router.push('/dev/notifications')}
        />
        <DevRow
          icon="bulb-outline"
          label="Memória e Aprendizado"
          description="Ver dados, histórico e aprendizado"
          onPress={() => router.push('/dev/memory')}
        />
        <DevRow
          icon="people-outline"
          label="Cenários de Teste"
          description="Aplicar cenários prontos"
          onPress={() => router.push('/dev/scenarios')}
        />
        <DevRow
          icon="server-outline"
          label="Dados e Sistema"
          description="Estado atual e ações avançadas"
          onPress={() => router.push('/dev/data')}
          last
        />
      </DevSection>
    </DevScreen>
  );
}

function formatDateTime(date: Date): string {
  const d = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  const t = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return `${d} ${t}`;
}
