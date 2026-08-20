/**
 * Rastreia, só em memória (mesmo padrão de devClock.ts — reseta em todo reload, produção nunca
 * herda estado de teste), quais instâncias de hoje já tiveram sua notificação "enviada" pelo
 * botão "Enviar próxima notificação" do Modo Dev (ver app/dev/notifications.tsx). Independente do
 * `notificationId` real (esse é da fila de agendamento do sistema operacional) — aqui é só pra
 * saber onde a pessoa testando parou na fila do dia.
 */
const sentIds = new Set<string>();

export const devNotificationTester = {
  isSent(instanceId: string): boolean {
    return sentIds.has(instanceId);
  },

  markSent(instanceId: string): void {
    sentIds.add(instanceId);
  },

  /** Reinicia a contagem — útil pra testar a fila do mesmo dia de novo, sem regenerar o ciclo. */
  reset(): void {
    sentIds.clear();
  },
};
