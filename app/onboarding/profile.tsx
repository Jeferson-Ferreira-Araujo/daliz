import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { TimeField } from '@/components/ui/TimeField';
import { DateField } from '@/components/ui/DateField';
import { Chip } from '@/components/ui/Chip';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { ImportantPeopleEditor } from '@/components/ImportantPeopleEditor';
import { CurrentLocationField } from '@/components/CurrentLocationField';
import { radius, spacing, useTheme } from '@/theme';
import { onboardingDraft } from '@/services/onboardingDraft';
import { analyticsService } from '@/services/analyticsService';
import { devOnboardingAutofill } from '@/dev/onboardingAutofill';
import { toISODate } from '@/utils/date';
import { getCurrentDate } from '@/utils/now';
import {
  CHALLENGE_CATEGORY_DESCRIPTIONS,
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
  type ImportantPerson,
  type Interest,
  type ShiftPattern,
  type UserLocation,
  type SocialChallengesInterest,
  type SocialMediaUsage,
  type SocialNetwork,
  type WorkSchedule,
} from '@/types';

const CATEGORY_OPTIONS = Object.entries(CHALLENGE_CATEGORY_LABELS) as [ChallengeCategory, string][];
const INTEREST_OPTIONS = Object.entries(INTEREST_LABELS) as [Interest, string][];
const INTENSITY_OPTIONS = Object.entries(CHALLENGE_INTENSITY_LABELS) as [ChallengeIntensity, string][];
const WORK_SCHEDULE_OPTIONS = Object.entries(WORK_SCHEDULE_LABELS) as [WorkSchedule, string][];
const DAY_OPTIONS = Object.entries(DAY_OF_WEEK_LABELS) as [DayOfWeek, string][];
const DEFAULT_WORK_DAYS: DayOfWeek[] = ['seg', 'ter', 'qua', 'qui', 'sex'];
const SOCIAL_USAGE_OPTIONS = Object.entries(SOCIAL_MEDIA_USAGE_LABELS) as [SocialMediaUsage, string][];
const SOCIAL_INTEREST_OPTIONS = Object.entries(SOCIAL_CHALLENGES_INTEREST_LABELS) as [SocialChallengesInterest, string][];
const SOCIAL_NETWORK_OPTIONS = Object.entries(SOCIAL_NETWORK_LABELS) as [SocialNetwork, string][];

type Step = {
  title: string;
  helper: string;
};

const today = new Date();
const MAX_BIRTH_DATE = today;
const MIN_BIRTH_DATE = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
const DEFAULT_BIRTH_DATE = toISODate(new Date(today.getFullYear() - 25, today.getMonth(), today.getDate()));

const STEPS: Step[] = [
  {
    title: 'Como podemos te chamar?',
    helper: 'Isso ajuda a deixar as ações mais pessoais, ajustar o tom pra sua fase de vida (e preparar algo especial pro seu aniversário) e considerar o clima e a estação do seu lugar.',
  },
  { title: 'Sobre o seu trabalho', helper: 'Assim evitamos te mandar uma ação no meio de uma reunião.' },
  { title: 'Sua rotina', helper: 'Pra nunca te notificar de madrugada ou enquanto você dorme.' },
  { title: 'Que tipos de ação você quer receber?', helper: 'Escolha quantas quiser — só entram ações das categorias marcadas aqui.' },
  {
    title: '🎯 O que você gosta de fazer?',
    helper: 'Seus interesses ajudam o Daliz a encontrar ações que façam mais sentido para você.',
  },
  {
    title: '❤️ Pessoas importantes',
    helper: 'Algumas pessoas fazem parte daquilo que torna seu dia melhor. Conhecê-las ajuda o Daliz a criar ações mais pessoais para você.',
  },
  { title: 'Qual ritmo você prefere?', helper: 'Ajustamos o nível da ação pra combinar com o que você topa hoje.' },
  { title: 'E as redes sociais?', helper: 'Totalmente opcional — ajuda a decidir se vale a pena incluir esse tipo de ação.' },
];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const [step, setStep] = useState(0);

  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState(DEFAULT_BIRTH_DATE);
  const [occupation, setOccupation] = useState('');
  const [isWorking, setIsWorking] = useState<boolean | null>(null);
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('18:00');
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule>('fixa');
  const [workDays, setWorkDays] = useState<DayOfWeek[]>(DEFAULT_WORK_DAYS);
  const [shiftWorkDays, setShiftWorkDays] = useState('4');
  const [shiftRestDays, setShiftRestDays] = useState('2');
  const [shiftAnchorIsWorkday, setShiftAnchorIsWorkday] = useState<boolean | null>(null);
  const [receiveDuringWorkHours, setReceiveDuringWorkHours] = useState<boolean | null>(null);
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [selectedCategories, setSelectedCategories] = useState<ChallengeCategory[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [otherInterestText, setOtherInterestText] = useState('');
  const [stillDiscoveringInterests, setStillDiscoveringInterests] = useState(false);
  const [importantPeople, setImportantPeople] = useState<ImportantPerson[]>([]);
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [challengeIntensity, setChallengeIntensity] = useState<ChallengeIntensity>('equilibrado');
  const [socialMediaUsage, setSocialMediaUsage] = useState<SocialMediaUsage>('as_vezes');
  const [socialChallengesInterest, setSocialChallengesInterest] = useState<SocialChallengesInterest>('as_vezes');
  const [socialNetworks, setSocialNetworks] = useState<SocialNetwork[]>([]);

  // Modo Dev: "Testar cadastro (pré-preenchido)" arma esses dados antes de navegar pra cá (ver
  // app/dev/scenarios.tsx) — consumido uma única vez no mount, nunca em produção.
  useEffect(() => {
    if (!__DEV__) return;
    const draft = devOnboardingAutofill.consume();
    if (!draft) return;
    setName(draft.name);
    setBirthDate(draft.birthDate);
    setOccupation(draft.occupation);
    setIsWorking(draft.isWorking);
    setWorkStartTime(draft.workStartTime ?? '09:00');
    setWorkEndTime(draft.workEndTime ?? '18:00');
    setWorkSchedule(draft.workSchedule);
    setWorkDays(draft.workDays.length > 0 ? draft.workDays : DEFAULT_WORK_DAYS);
    if (draft.shiftPattern) {
      setShiftWorkDays(String(draft.shiftPattern.workDays));
      setShiftRestDays(String(draft.shiftPattern.restDays));
      setShiftAnchorIsWorkday(draft.shiftPattern.anchorIsWorkday);
    }
    setReceiveDuringWorkHours(draft.receiveDuringWorkHours);
    setWakeTime(draft.wakeTime);
    setSleepTime(draft.sleepTime);
    setSelectedCategories(draft.selectedCategories);
    setInterests(draft.interests);
    setOtherInterestText(draft.otherInterestText ?? '');
    setStillDiscoveringInterests(draft.stillDiscoveringInterests);
    setImportantPeople(draft.importantPeople);
    setLocation(draft.location);
    setChallengeIntensity(draft.challengeIntensity);
    setSocialMediaUsage(draft.socialMediaUsage);
    setSocialChallengesInterest(draft.socialChallengesInterest);
    setSocialNetworks(draft.socialNetworks);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só deve rodar uma vez, no mount
  }, []);

  const isStepValid = useMemo(() => {
    switch (step) {
      case 0:
        return name.trim().length > 0 && birthDate.length > 0;
      case 1: {
        if (occupation.trim().length === 0 || isWorking === null) return false;
        if (isWorking === false) return true;
        if (receiveDuringWorkHours === null) return false;
        if (workSchedule === 'fixa') return workDays.length > 0;
        if (workSchedule === 'turnos') {
          return Number(shiftWorkDays) > 0 && Number(shiftRestDays) > 0 && shiftAnchorIsWorkday !== null;
        }
        return true; // variável — nenhum campo extra obrigatório
      }
      case 2:
        return wakeTime.length > 0 && sleepTime.length > 0;
      case 3:
        return selectedCategories.length > 0;
      case 4:
        return true; // interesses são opcionais — não devemos assumir que todo mundo já tem hobbies definidos
      case 5:
        return true; // pessoas importantes são opcionais — nunca obrigar a informar ninguém
      case 6:
        return challengeIntensity !== null;
      case 7:
        return true;
      default:
        return false;
    }
  }, [
    step,
    name,
    birthDate,
    occupation,
    isWorking,
    workSchedule,
    workDays,
    shiftWorkDays,
    shiftRestDays,
    shiftAnchorIsWorkday,
    receiveDuringWorkHours,
    wakeTime,
    sleepTime,
    selectedCategories,
    challengeIntensity,
  ]);

  function toggleCategory(category: ChallengeCategory) {
    setSelectedCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
  }

  function toggleInterest(interest: Interest) {
    setInterests((prev) => (prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]));
  }

  function toggleWorkDay(day: DayOfWeek) {
    setWorkDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function toggleSocialNetwork(network: SocialNetwork) {
    setSocialNetworks((prev) => {
      if (prev.includes(network)) return prev.filter((n) => n !== network);
      if (network === 'nenhuma') return ['nenhuma'];
      return [...prev.filter((n) => n !== 'nenhuma'), network];
    });
  }

  // Funil do cadastro — diferente do screen_view automático (app/_layout.tsx), que só vê a rota
  // "/onboarding/profile" inteira: essas 9 etapas vivem dentro da mesma rota (estado local `step`),
  // então sem isso não dá pra saber em qual pergunta as pessoas mais desistem.
  useEffect(() => {
    analyticsService.log('onboarding_step_viewed', { step: step + 1, totalSteps: STEPS.length, stepTitle: STEPS[step].title });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só deve rodar quando o step muda, não a cada render
  }, [step]);

  function handleBack() {
    if (step === 0) {
      router.back();
      return;
    }
    setStep((s) => s - 1);
  }

  function handleNext() {
    if (!isStepValid) return;
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    if (selectedCategories.length === 0) return;
    const shiftPattern: ShiftPattern | null =
      isWorking && workSchedule === 'turnos'
        ? {
            workDays: Number(shiftWorkDays),
            restDays: Number(shiftRestDays),
            anchorDate: toISODate(getCurrentDate()),
            anchorIsWorkday: shiftAnchorIsWorkday === true,
          }
        : null;
    onboardingDraft.set({
      name: name.trim(),
      birthDate,
      occupation: occupation.trim(),
      isWorking: isWorking === true,
      workStartTime: isWorking ? workStartTime : null,
      workEndTime: isWorking ? workEndTime : null,
      workSchedule,
      workDays: isWorking ? workDays : [],
      shiftPattern,
      receiveDuringWorkHours: isWorking ? receiveDuringWorkHours === true : true,
      wakeTime,
      sleepTime,
      selectedCategories,
      interests,
      otherInterestText: interests.includes('other') ? otherInterestText.trim() || null : null,
      stillDiscoveringInterests,
      importantPeople,
      location,
      challengeIntensity,
      socialMediaUsage,
      socialChallengesInterest,
      socialNetworks,
    });
    router.push('/onboarding/notifications');
  }

  const current = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.dotsRow}>
          {STEPS.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, { backgroundColor: index <= step ? colors.primary : colors.surfaceMuted }]}
            />
          ))}
        </View>
        <AppText variant="caption" color={colors.textMuted}>
          {step + 1}/{STEPS.length}
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <AppText variant="title" style={styles.title}>
          {current.title}
        </AppText>
        <AppText variant="body" color={colors.textMuted} style={styles.subtitle}>
          {current.helper}
        </AppText>

        {step === 0 && (
          <>
            <TextField label="Nome" value={name} onChangeText={setName} placeholder="Como podemos te chamar?" autoFocus />

            <DateField
              label="Data de nascimento"
              value={birthDate}
              onChange={setBirthDate}
              minimumDate={MIN_BIRTH_DATE}
              maximumDate={MAX_BIRTH_DATE}
            />

            <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
              📍 Onde você mora?
            </AppText>
            <AppText variant="caption" color={colors.textMuted} style={styles.hint}>
              Só a cidade — usamos isso pra saber o clima e a estação do ano, nunca pra localização precisa. Totalmente
              opcional.
            </AppText>
            <CurrentLocationField location={location} onChange={setLocation} />
          </>
        )}

        {step === 1 && (
          <>
            <TextField label="Profissão" value={occupation} onChangeText={setOccupation} placeholder="Ex: Designer" />
            <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
              Você está trabalhando atualmente?
            </AppText>
            <View style={styles.chipsRow}>
              <Chip label="Sim, estou trabalhando" selected={isWorking === true} onPress={() => setIsWorking(true)} />
              <Chip label="Não, no momento não" selected={isWorking === false} onPress={() => setIsWorking(false)} />
            </View>
            {isWorking === true && (
              <>
                <View style={styles.row}>
                  <View style={styles.rowItem}>
                    <TimeField label="Trabalho começa" value={workStartTime} onChange={setWorkStartTime} />
                  </View>
                  <View style={styles.rowItem}>
                    <TimeField label="Trabalho termina" value={workEndTime} onChange={setWorkEndTime} />
                  </View>
                </View>

                <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
                  Você deseja receber notificações de ações durante seu horário de trabalho?
                </AppText>
                <AppText variant="caption" color={colors.textMuted} style={styles.hint}>
                  Queremos ser uma ferramenta que ajuda a melhorar seu dia, não algo que atrapalhe — se preferir, pausamos os
                  ações durante o expediente e retomamos assim que ele terminar.
                </AppText>
                <View style={styles.chipsRow}>
                  <Chip
                    label="Sim, desejo receber"
                    selected={receiveDuringWorkHours === true}
                    onPress={() => setReceiveDuringWorkHours(true)}
                  />
                  <Chip
                    label="Não desejo receber"
                    selected={receiveDuringWorkHours === false}
                    onPress={() => setReceiveDuringWorkHours(false)}
                  />
                </View>

                <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
                  Sua rotina de trabalho é
                </AppText>
                <View style={styles.chipsRow}>
                  {WORK_SCHEDULE_OPTIONS.map(([value, label]) => (
                    <Chip key={value} label={label} selected={workSchedule === value} onPress={() => setWorkSchedule(value)} />
                  ))}
                </View>

                {workSchedule === 'fixa' && (
                  <>
                    <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
                      Quais dias você trabalha?
                    </AppText>
                    <View style={styles.chipsRow}>
                      {DAY_OPTIONS.map(([value, label]) => (
                        <Chip key={value} label={label} selected={workDays.includes(value)} onPress={() => toggleWorkDay(value)} />
                      ))}
                    </View>
                  </>
                )}

                {workSchedule === 'turnos' && (
                  <>
                    <View style={styles.row}>
                      <View style={styles.rowItem}>
                        <TextField
                          label="Dias trabalhando seguidos"
                          value={shiftWorkDays}
                          onChangeText={setShiftWorkDays}
                          keyboardType="number-pad"
                          placeholder="Ex: 4"
                        />
                      </View>
                      <View style={styles.rowItem}>
                        <TextField
                          label="Dias de folga seguidos"
                          value={shiftRestDays}
                          onChangeText={setShiftRestDays}
                          keyboardType="number-pad"
                          placeholder="Ex: 2"
                        />
                      </View>
                    </View>
                    <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
                      Hoje você trabalha ou está de folga?
                    </AppText>
                    <View style={styles.chipsRow}>
                      <Chip
                        label="Hoje é dia de trabalho"
                        selected={shiftAnchorIsWorkday === true}
                        onPress={() => setShiftAnchorIsWorkday(true)}
                      />
                      <Chip
                        label="Hoje é dia de folga"
                        selected={shiftAnchorIsWorkday === false}
                        onPress={() => setShiftAnchorIsWorkday(false)}
                      />
                    </View>
                  </>
                )}
              </>
            )}
          </>
        )}

        {step === 2 && (
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <TimeField label="Acorda por volta de" value={wakeTime} onChange={setWakeTime} />
            </View>
            <View style={styles.rowItem}>
              <TimeField label="Dorme por volta de" value={sleepTime} onChange={setSleepTime} />
            </View>
          </View>
        )}

        {step === 3 && (
          <View>
            {CATEGORY_OPTIONS.map(([value, label]) => (
              <SelectableCard
                key={value}
                icon={CHALLENGE_CATEGORY_ICONS[value]}
                title={label}
                description={CHALLENGE_CATEGORY_DESCRIPTIONS[value]}
                selected={selectedCategories.includes(value)}
                onPress={() => toggleCategory(value)}
              />
            ))}
          </View>
        )}

        {step === 4 && (
          <View>
            <View style={styles.chipsRow}>
              {INTEREST_OPTIONS.map(([value, label]) => (
                <Chip key={value} label={label} selected={interests.includes(value)} onPress={() => toggleInterest(value)} />
              ))}
            </View>
            {interests.includes('other') && (
              <TextField
                placeholder="O que você gosta de fazer?"
                value={otherInterestText}
                onChangeText={setOtherInterestText}
                style={styles.otherInterestField}
              />
            )}
            <View style={[styles.chipsRow, styles.discoveringRow]}>
              <Chip
                label="Ainda estou descobrindo meus interesses"
                selected={stillDiscoveringInterests}
                onPress={() => setStillDiscoveringInterests((prev) => !prev)}
              />
            </View>
          </View>
        )}

        {step === 5 && <ImportantPeopleEditor people={importantPeople} onChange={setImportantPeople} />}

        {step === 6 && (
          <View style={styles.chipsRow}>
            {INTENSITY_OPTIONS.map(([value, label]) => (
              <Chip
                key={value}
                label={label}
                selected={challengeIntensity === value}
                onPress={() => setChallengeIntensity(value)}
              />
            ))}
          </View>
        )}

        {step === 7 && (
          <>
            <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
              Com que frequência você usa redes sociais?
            </AppText>
            <View style={styles.chipsRow}>
              {SOCIAL_USAGE_OPTIONS.map(([value, label]) => (
                <Chip key={value} label={label} selected={socialMediaUsage === value} onPress={() => setSocialMediaUsage(value)} />
              ))}
            </View>

            <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
              Gostaria de receber, de vez em quando, ações que envolvam redes sociais?
            </AppText>
            <View style={styles.chipsRow}>
              {SOCIAL_INTEREST_OPTIONS.map(([value, label]) => (
                <Chip
                  key={value}
                  label={label}
                  selected={socialChallengesInterest === value}
                  onPress={() => setSocialChallengesInterest(value)}
                />
              ))}
            </View>

            {socialMediaUsage !== 'quase_nunca' && socialChallengesInterest !== 'prefiro_nao' && (
              <>
                <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
                  Onde você costuma estar? (opcional)
                </AppText>
                <View style={styles.chipsRow}>
                  {SOCIAL_NETWORK_OPTIONS.map(([value, label]) => (
                    <Chip
                      key={value}
                      label={label}
                      selected={socialNetworks.includes(value)}
                      onPress={() => toggleSocialNetwork(value)}
                    />
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button label={isLastStep ? 'Concluir' : 'Continuar'} onPress={handleNext} disabled={!isStepValid} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  dotsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: radius.pill,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  hint: {
    marginBottom: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  discoveringRow: {
    marginTop: spacing.sm,
  },
  otherInterestField: {
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
});
