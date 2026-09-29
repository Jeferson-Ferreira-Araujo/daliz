import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { DevScreen, DevSection, DevBanner, DevChipButton } from '@/dev/DevUI';
import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/TextField';
import { OccupationPicker } from '@/components/OccupationPicker';
import { TimeField } from '@/components/ui/TimeField';
import { DateField } from '@/components/ui/DateField';
import { ImportantPeopleEditor } from '@/components/ImportantPeopleEditor';
import { CurrentLocationField } from '@/components/CurrentLocationField';
import { radius, spacing, useTheme } from '@/theme';
import { profileService, type OnboardingProfileInput } from '@/services/profileService';
import { DEV_ONBOARDING_TEST_DATA } from '@/dev/onboardingAutofill';
import { buildPreviewProfile, computeSchedulePreviewForDate, type SchedulePreviewEntry } from '@/dev/schedulePreview';
import { useDevClockState } from '@/dev/devClock';
import { getCurrentDate } from '@/utils/now';
import { addDays, parseISODate, toISODate } from '@/utils/date';
import { getInstanceTiming } from '@/data/challenges';
import { TIMING_LABELS } from '@/engine/challengeTiming';
import {
  CHALLENGE_CATEGORY_ICONS,
  CHALLENGE_CATEGORY_LABELS,
  CHALLENGE_INTENSITY_LABELS,
  DAY_OF_WEEK_LABELS,
  INTEREST_LABELS,
  SOCIAL_CHALLENGES_INTEREST_LABELS,
  SOCIAL_MEDIA_USAGE_LABELS,
  SOCIAL_NETWORK_LABELS,
  WORK_SCHEDULE_LABELS,
  type ChallengeCategory,
  type ChallengeIntensity,
  type DayOfWeek,
  type Interest,
  type SocialChallengesInterest,
  type SocialMediaUsage,
  type SocialNetwork,
  type WorkSchedule,
} from '@/types';

const CATEGORY_OPTIONS = Object.entries(CHALLENGE_CATEGORY_LABELS) as [ChallengeCategory, string][];
const INTENSITY_OPTIONS = Object.entries(CHALLENGE_INTENSITY_LABELS) as [ChallengeIntensity, string][];
const WORK_SCHEDULE_OPTIONS = Object.entries(WORK_SCHEDULE_LABELS) as [WorkSchedule, string][];
const DAY_OPTIONS = Object.entries(DAY_OF_WEEK_LABELS) as [DayOfWeek, string][];
const INTEREST_OPTIONS = Object.entries(INTEREST_LABELS) as [Interest, string][];
const SOCIAL_USAGE_OPTIONS = Object.entries(SOCIAL_MEDIA_USAGE_LABELS) as [SocialMediaUsage, string][];
const SOCIAL_INTEREST_OPTIONS = Object.entries(SOCIAL_CHALLENGES_INTEREST_LABELS) as [SocialChallengesInterest, string][];
const SOCIAL_NETWORK_OPTIONS = Object.entries(SOCIAL_NETWORK_LABELS) as [SocialNetwork, string][];
const RECOMPUTE_DEBOUNCE_MS = 400;
// Teto de quantos dias à frente dá pra simular de uma vez — cada dia entre hoje e a data
// escolhida precisa ser gerado em memória pra alimentar o histórico do próximo (ver
// computeSchedulePreviewForDate), então um teto generoso evita rodar o motor centenas de vezes à
// toa se alguém escolher uma data muito distante sem querer.
const MAX_PREVIEW_DAYS_AHEAD = 30;

const today = new Date();
const MAX_BIRTH_DATE = today;
const MIN_BIRTH_DATE = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());

export default function DevSchedulePreviewScreen() {
  const { colors } = useTheme();
  const clock = useDevClockState();
  const [draft, setDraft] = useState<OnboardingProfileInput>(DEV_ONBOARDING_TEST_DATA);
  const [entries, setEntries] = useState<SchedulePreviewEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [runToken, setRunToken] = useState(0);
  // Dia sendo simulado — default "hoje" (a data do relógio simulado). Escolher outra data
  // simula, em memória, cada dia entre hoje e ela (ver computeSchedulePreviewForDate), pra ver a
  // lista de ações de qualquer dia futuro, não só "a partir de agora".
  const [previewDate, setPreviewDate] = useState(() => toISODate(getCurrentDate()));

  useEffect(() => {
    profileService.getProfile().then((profile) => {
      if (profile) setDraft({ ...profile });
    });
  }, []);

  const simulatedAtMs = clock.simulatedAt.getTime();

  // Se o relógio simulado mudar de dia (ex: "+1 dia" no /dev/clock) e a data escolhida aqui
  // ficar pra trás de "hoje", volta pra hoje — simular um dia que já passou não faz sentido.
  useEffect(() => {
    const todayISO = toISODate(getCurrentDate());
    if (previewDate < todayISO) setPreviewDate(todayISO);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reage a mudança de dia do relógio
  }, [simulatedAtMs, clock.enabled]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const profile = buildPreviewProfile(draft);
      computeSchedulePreviewForDate(profile, previewDate, getCurrentDate()).then((result) => {
        setEntries(result);
        setLoading(false);
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps -- runToken força reamostrar sem editar nada
    }, RECOMPUTE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // simulatedAtMs (não clock.simulatedAt): useDevClockState devolve um novo objeto Date a cada
    // render, então usar o objeto direto na dependência recalculava em loop infinito.
  }, [draft, previewDate, simulatedAtMs, clock.enabled, runToken]);

  function update<K extends keyof OnboardingProfileInput>(key: K, value: OnboardingProfileInput[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function toggleCategory(category: ChallengeCategory) {
    update(
      'selectedCategories',
      draft.selectedCategories.includes(category)
        ? draft.selectedCategories.filter((c) => c !== category)
        : [...draft.selectedCategories, category],
    );
  }

  function toggleInterest(interest: Interest) {
    update('interests', draft.interests.includes(interest) ? draft.interests.filter((i) => i !== interest) : [...draft.interests, interest]);
  }

  function toggleWorkDay(day: DayOfWeek) {
    update('workDays', draft.workDays.includes(day) ? draft.workDays.filter((d) => d !== day) : [...draft.workDays, day]);
  }

  function toggleSocialNetwork(network: SocialNetwork) {
    update('socialNetworks', (() => {
      if (draft.socialNetworks.includes(network)) return draft.socialNetworks.filter((n) => n !== network);
      if (network === 'nenhuma') return ['nenhuma'];
      return [...draft.socialNetworks.filter((n) => n !== 'nenhuma'), network];
    })());
  }

  const nowLabel = useMemo(() => formatDateTime(getCurrentDate()), [simulatedAtMs, clock.enabled]);
  const isPreviewToday = previewDate === toISODate(getCurrentDate());

  return (
    <DevScreen title="🗓️ Prévia do cadastro">
      <DevBanner text="Edite o perfil abaixo (cadastro completo) e veja, ao vivo, quais ações e em que horário seriam enviadas — usando o motor de seleção de verdade, sem salvar nada." />

      <DevSection title="Agora (relógio simulado)">
        <View style={styles.nowRow}>
          <AppText variant="body">{nowLabel}</AppText>
          <DevChipButton label="Ajustar relógio" tone="primary" onPress={() => router.push('/dev/clock')} />
        </View>
      </DevSection>

      <DevSection title="Ferramentas">
        <View style={styles.nowRow}>
          <AppText variant="body">🔔 Disparar/testar notificações</AppText>
          <DevChipButton label="Abrir" tone="primary" onPress={() => router.push('/dev/notification-tester')} />
        </View>
      </DevSection>

      <DevSection title="Simular dia">
        <View style={styles.fieldBlock}>
          <DateField
            label="Ver as ações deste dia"
            value={previewDate}
            onChange={setPreviewDate}
            minimumDate={getCurrentDate()}
            maximumDate={parseISODate(addDays(toISODate(getCurrentDate()), MAX_PREVIEW_DAYS_AHEAD))}
          />
        </View>
        <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
          Padrão é hoje. Escolher outro dia simula, em memória, cada dia entre hoje e ele (pra não
          repetir ação recente à toa) e mostra a lista daquele dia específico.
        </AppText>
      </DevSection>

      <DevSection title="Sobre você">
        <View style={styles.fieldBlock}>
          <TextField label="Nome" value={draft.name} onChangeText={(v) => update('name', v)} />
        </View>
        <View style={styles.fieldBlock}>
          <DateField
            label="Data de nascimento"
            value={draft.birthDate}
            onChange={(v) => update('birthDate', v)}
            minimumDate={MIN_BIRTH_DATE}
            maximumDate={MAX_BIRTH_DATE}
          />
        </View>
        <View style={styles.fieldBlock}>
          <OccupationPicker
            value={draft.occupation}
            onChange={(nextOccupation, nextWorkContext) => {
              update('occupation', nextOccupation);
              update('workContext', nextWorkContext);
            }}
          />
        </View>
        <View style={styles.fieldBlock}>
          <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
            📍 Onde mora
          </AppText>
          <CurrentLocationField location={draft.location} onChange={(v) => update('location', v)} />
        </View>
      </DevSection>

      <DevSection title="Sono">
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <TimeField label="Acorda por volta de" value={draft.wakeTime} onChange={(v) => update('wakeTime', v)} />
          </View>
          <View style={styles.rowItem}>
            <TimeField label="Dorme por volta de" value={draft.sleepTime} onChange={(v) => update('sleepTime', v)} />
          </View>
        </View>
      </DevSection>

      <DevSection title="Trabalho">
        <View style={styles.chipsRow}>
          <Chip label="Está trabalhando" selected={draft.isWorking} onPress={() => update('isWorking', !draft.isWorking)} />
        </View>
        {draft.isWorking && (
          <>
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <TimeField
                  label="Começa"
                  value={draft.workStartTime ?? '09:00'}
                  onChange={(v) => update('workStartTime', v)}
                />
              </View>
              <View style={styles.rowItem}>
                <TimeField label="Termina" value={draft.workEndTime ?? '18:00'} onChange={(v) => update('workEndTime', v)} />
              </View>
            </View>
            <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
              Recebe ações no expediente?
            </AppText>
            <View style={styles.chipsRow}>
              <Chip
                label="Sim"
                selected={draft.receiveDuringWorkHours}
                onPress={() => update('receiveDuringWorkHours', true)}
              />
              <Chip
                label="Não"
                selected={!draft.receiveDuringWorkHours}
                onPress={() => update('receiveDuringWorkHours', false)}
              />
            </View>
            <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
              Rotina
            </AppText>
            <View style={styles.chipsRow}>
              {WORK_SCHEDULE_OPTIONS.map(([value, label]) => (
                <Chip key={value} label={label} selected={draft.workSchedule === value} onPress={() => update('workSchedule', value)} />
              ))}
            </View>
            {draft.workSchedule === 'fixa' && (
              <View style={styles.chipsRow}>
                {DAY_OPTIONS.map(([value, label]) => (
                  <Chip key={value} label={label} selected={draft.workDays.includes(value)} onPress={() => toggleWorkDay(value)} />
                ))}
              </View>
            )}
          </>
        )}
      </DevSection>

      <DevSection title="Ritmo">
        <View style={styles.chipsRow}>
          {INTENSITY_OPTIONS.map(([value, label]) => (
            <Chip key={value} label={label} selected={draft.challengeIntensity === value} onPress={() => update('challengeIntensity', value)} />
          ))}
        </View>
      </DevSection>

      <DevSection title="Categorias">
        <View style={styles.chipsRow}>
          {CATEGORY_OPTIONS.map(([value, label]) => (
            <Chip
              key={value}
              label={`${CHALLENGE_CATEGORY_ICONS[value]} ${label}`}
              selected={draft.selectedCategories.includes(value)}
              onPress={() => toggleCategory(value)}
            />
          ))}
        </View>
      </DevSection>

      <DevSection title="🎯 Interesses">
        <View style={styles.chipsRow}>
          {INTEREST_OPTIONS.map(([value, label]) => (
            <Chip key={value} label={label} selected={draft.interests.includes(value)} onPress={() => toggleInterest(value)} />
          ))}
        </View>
        <View style={styles.chipsRow}>
          <Chip
            label="Ainda estou descobrindo meus interesses"
            selected={draft.stillDiscoveringInterests}
            onPress={() => update('stillDiscoveringInterests', !draft.stillDiscoveringInterests)}
          />
        </View>
      </DevSection>

      <DevSection title="❤️ Pessoas importantes">
        <View style={styles.fieldBlock}>
          <ImportantPeopleEditor people={draft.importantPeople} onChange={(v) => update('importantPeople', v)} />
        </View>
      </DevSection>

      <DevSection title="📱 Redes sociais">
        <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
          Frequência de uso
        </AppText>
        <View style={styles.chipsRow}>
          {SOCIAL_USAGE_OPTIONS.map(([value, label]) => (
            <Chip key={value} label={label} selected={draft.socialMediaUsage === value} onPress={() => update('socialMediaUsage', value)} />
          ))}
        </View>
        <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
          Interesse em ações de rede social
        </AppText>
        <View style={styles.chipsRow}>
          {SOCIAL_INTEREST_OPTIONS.map(([value, label]) => (
            <Chip
              key={value}
              label={label}
              selected={draft.socialChallengesInterest === value}
              onPress={() => update('socialChallengesInterest', value)}
            />
          ))}
        </View>
        <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
          Onde costuma estar
        </AppText>
        <View style={styles.chipsRow}>
          {SOCIAL_NETWORK_OPTIONS.map(([value, label]) => (
            <Chip key={value} label={label} selected={draft.socialNetworks.includes(value)} onPress={() => toggleSocialNetwork(value)} />
          ))}
        </View>
      </DevSection>

      <View style={styles.resultHeader}>
        <AppText variant="bodyStrong">
          {loading ? 'Calculando…' : `${entries.length} ação(ões) ${isPreviewToday ? 'a partir de agora' : `em ${formatDate(previewDate)}`}`}
        </AppText>
        <DevChipButton label="🔄 Sortear de novo" onPress={() => setRunToken((n) => n + 1)} />
      </View>
      <AppText variant="caption" color={colors.textMuted} style={styles.resultHint}>
        Pra um mesmo perfil e horário exatos, o motor sempre escolhe a mesma ação (é assim de
        verdade — sem isso, duas pessoas no mesmo contexto receberiam coisas diferentes ao acaso).
        "Sortear de novo" só varia quantas ações e em que instante dentro de cada período — pra ver
        combinações diferentes de verdade, mude o perfil acima (categorias, interesses, pessoas,
        localização, horário) ou o dia simulado.
      </AppText>

      {!loading && entries.length === 0 && (
        <DevBanner
          tone="warning"
          text={
            isPreviewToday
              ? "Nenhuma ação seria enviada agora com esse perfil — pode ser que 'agora' esteja fora da janela acordado, ou dentro do expediente sem receber notificações."
              : 'Nenhuma ação seria enviada nesse dia com esse perfil — pode ser um dia de folga sem categoria compatível, ou o expediente sem receber notificações.'
          }
        />
      )}

      {entries.map(({ instance }) => (
        <View key={instance.id} style={[styles.instanceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.instanceHeader}>
            <View style={styles.instanceTimeCol}>
              <AppText variant="bodyStrong">{formatTime(instance.scheduledFor)}</AppText>
              <AppText variant="caption" color={colors.textMuted}>
                {TIMING_LABELS[getInstanceTiming(instance)]}
              </AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="body">
                {CHALLENGE_CATEGORY_ICONS[instance.categoria]} {instance.titulo}
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                {CHALLENGE_CATEGORY_LABELS[instance.categoria]} · {instance.tempoEstimado} min
              </AppText>
            </View>
          </View>
        </View>
      ))}
    </DevScreen>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDateTime(date: Date): string {
  const d = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  const t = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return `${d} ${t}`;
}

/** "YYYY-MM-DD" -> "dd/mm", pro cabeçalho da lista quando o dia simulado não é hoje. */
function formatDate(dateISO: string): string {
  const [, month, day] = dateISO.split('-');
  return `${day}/${month}`;
}

const styles = StyleSheet.create({
  nowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  fieldBlock: {
    padding: spacing.md,
    paddingBottom: 0,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: 0,
  },
  rowItem: {
    flex: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  fieldLabel: {
    marginTop: spacing.xs,
    marginLeft: spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  resultHint: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  instanceCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  instanceHeader: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  instanceTimeCol: {
    width: 72,
  },
});
