import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { OccupationPicker } from '@/components/OccupationPicker';
import { TimeField } from '@/components/ui/TimeField';
import { DateField } from '@/components/ui/DateField';
import { Chip } from '@/components/ui/Chip';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { ImportantPeopleEditor } from '@/components/ImportantPeopleEditor';
import { CurrentLocationField } from '@/components/CurrentLocationField';
import { radius, spacing, useTheme } from '@/theme';
import { profileService } from '@/services/profileService';
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
  type SocialChallengesInterest,
  type SocialMediaUsage,
  type SocialNetwork,
  type UserLocation,
  type UserProfile,
  type WorkContext,
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
const today = new Date();
const MAX_BIRTH_DATE = today;
const MIN_BIRTH_DATE = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());

export default function EditProfileScreen() {
  const { colors } = useTheme();
  // `focusSection` vem do CTA "Quer adicionar?" no bloco vazio de Pessoas Importantes (ver
  // app/(main)/(tabs)/profile.tsx) — pula direto pra essa parte do formulário, já com o "Adicionar
  // pessoa" aberto, em vez de deixar a pessoa rolar a tela inteira achando a seção.
  const { focusSection } = useLocalSearchParams<{ focusSection?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const importantPeopleOffsetRef = useRef(0);
  const hasScrolledToFocusRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [occupation, setOccupation] = useState('');
  const [workContext, setWorkContext] = useState<WorkContext | null>(null);
  const [isWorking, setIsWorking] = useState<boolean | null>(null);
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('18:00');
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule>('fixa');
  const [workDays, setWorkDays] = useState<DayOfWeek[]>(DEFAULT_WORK_DAYS);
  const [shiftWorkDays, setShiftWorkDays] = useState('4');
  const [shiftRestDays, setShiftRestDays] = useState('2');
  const [shiftAnchorIsWorkday, setShiftAnchorIsWorkday] = useState<boolean | null>(null);
  const [receiveDuringWorkHours, setReceiveDuringWorkHours] = useState<boolean | null>(null);
  const [originalShiftPattern, setOriginalShiftPattern] = useState<ShiftPattern | null>(null);
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

  useEffect(() => {
    profileService.getProfile().then((profile) => {
      if (!profile) {
        router.back();
        return;
      }
      applyProfile(profile);
      setLoading(false);
    });
  }, []);

  function applyProfile(profile: UserProfile) {
    setName(profile.name);
    setBirthDate(profile.birthDate);
    setOccupation(profile.occupation);
    setWorkContext(profile.workContext);
    setIsWorking(profile.isWorking);
    setWorkStartTime(profile.workStartTime ?? '09:00');
    setWorkEndTime(profile.workEndTime ?? '18:00');
    setWorkSchedule(profile.workSchedule);
    setWorkDays(profile.workDays.length > 0 ? profile.workDays : DEFAULT_WORK_DAYS);
    if (profile.shiftPattern) {
      setShiftWorkDays(String(profile.shiftPattern.workDays));
      setShiftRestDays(String(profile.shiftPattern.restDays));
      setShiftAnchorIsWorkday(profile.shiftPattern.anchorIsWorkday);
    }
    setOriginalShiftPattern(profile.shiftPattern);
    setReceiveDuringWorkHours(profile.receiveDuringWorkHours);
    setWakeTime(profile.wakeTime);
    setSleepTime(profile.sleepTime);
    setSelectedCategories(profile.selectedCategories);
    setInterests(profile.interests);
    setOtherInterestText(profile.otherInterestText ?? '');
    setStillDiscoveringInterests(profile.stillDiscoveringInterests);
    setImportantPeople(profile.importantPeople);
    setLocation(profile.location);
    setChallengeIntensity(profile.challengeIntensity);
    setSocialMediaUsage(profile.socialMediaUsage);
    setSocialChallengesInterest(profile.socialChallengesInterest);
    setSocialNetworks(profile.socialNetworks);
  }

  const isValid = useMemo(() => {
    const base =
      name.trim().length > 0 &&
      birthDate.length > 0 &&
      occupation.trim().length > 0 &&
      isWorking !== null &&
      selectedCategories.length > 0;
    if (!base || isWorking !== true) return base;
    if (receiveDuringWorkHours === null) return false;
    if (workSchedule === 'fixa') return workDays.length > 0;
    if (workSchedule === 'turnos') {
      return Number(shiftWorkDays) > 0 && Number(shiftRestDays) > 0 && shiftAnchorIsWorkday !== null;
    }
    return true; // variável — nenhum campo extra obrigatório
  }, [
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
    selectedCategories,
  ]);

  // Salva na hora, sem esperar "Salvar alterações" lá embaixo (ver profileService.
  // updateImportantPeople) — o formulário de "Adicionar pessoa" tem seu próprio botão de commit,
  // que parece uma ação concluída; sem isso, dava pra adicionar alguém e sair da tela sem perceber
  // que não tinha sido salvo de verdade.
  async function handleImportantPeopleChange(people: ImportantPerson[]) {
    setImportantPeople(people);
    await profileService.updateImportantPeople(people);
  }

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

  async function handleSave() {
    if (!isValid || selectedCategories.length === 0 || isWorking === null) return;
    setSaving(true);
    try {
      const shiftPatternUnchanged =
        originalShiftPattern != null &&
        originalShiftPattern.workDays === Number(shiftWorkDays) &&
        originalShiftPattern.restDays === Number(shiftRestDays) &&
        originalShiftPattern.anchorIsWorkday === shiftAnchorIsWorkday;
      const shiftPattern: ShiftPattern | null =
        isWorking && workSchedule === 'turnos'
          ? shiftPatternUnchanged
            ? originalShiftPattern // nada mudou — preserva a âncora original do ciclo
            : {
                workDays: Number(shiftWorkDays),
                restDays: Number(shiftRestDays),
                anchorDate: toISODate(getCurrentDate()),
                anchorIsWorkday: shiftAnchorIsWorkday === true,
              }
          : null;
      await profileService.updateProfile({
        name: name.trim(),
        birthDate,
        occupation: occupation.trim(),
        workContext,
        isWorking,
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
      router.back();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <AppText variant="title">Editar perfil</AppText>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TextField label="Nome" value={name} onChangeText={setName} placeholder="Como podemos te chamar?" />
        <DateField
          label="Data de nascimento"
          value={birthDate}
          onChange={setBirthDate}
          minimumDate={MIN_BIRTH_DATE}
          maximumDate={MAX_BIRTH_DATE}
        />
        <OccupationPicker
          value={occupation}
          onChange={(nextOccupation, nextWorkContext) => {
            setOccupation(nextOccupation);
            setWorkContext(nextWorkContext);
          }}
        />

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

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <TimeField label="Acorda por volta de" value={wakeTime} onChange={setWakeTime} />
          </View>
          <View style={styles.rowItem}>
            <TimeField label="Dorme por volta de" value={sleepTime} onChange={setSleepTime} />
          </View>
        </View>

        <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
          Que tipos de ação você quer receber?
        </AppText>
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

        <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
          🎯 O que você gosta de fazer?
        </AppText>
        <AppText variant="caption" color={colors.textMuted} style={styles.hint}>
          Seus interesses ajudam o Daliz a encontrar ações que façam mais sentido para você.
        </AppText>
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

        <View
          onLayout={(event) => {
            importantPeopleOffsetRef.current = event.nativeEvent.layout.y;
            // Só rola uma vez — sem essa guarda, qualquer re-layout (ex: abrir/fechar o formulário
            // de adicionar) dispararia o scroll de novo, atrapalhando quem já está mexendo na tela.
            if (focusSection === 'importantPeople' && !hasScrolledToFocusRef.current) {
              hasScrolledToFocusRef.current = true;
              scrollViewRef.current?.scrollTo({ y: Math.max(0, importantPeopleOffsetRef.current - spacing.lg), animated: true });
            }
          }}
        >
          <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
            ❤️ Pessoas importantes
          </AppText>
          <AppText variant="caption" color={colors.textMuted} style={styles.hint}>
            Algumas pessoas fazem parte daquilo que torna seu dia melhor. Conhecê-las ajuda o Daliz a criar
            ações mais pessoais para você.
          </AppText>
          <ImportantPeopleEditor
            people={importantPeople}
            onChange={handleImportantPeopleChange}
            autoOpenAdd={focusSection === 'importantPeople'}
          />
        </View>

        <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
          📍 Onde você mora?
        </AppText>
        <AppText variant="caption" color={colors.textMuted} style={styles.hint}>
          Só a cidade — usamos isso pra saber o clima e a estação do ano, nunca pra localização precisa.
        </AppText>
        <CurrentLocationField location={location} onChange={setLocation} />

        <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
          Ritmo das ações
        </AppText>
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

        <View style={[styles.socialBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <AppText variant="title" style={styles.socialTitle}>
            📱 E as redes sociais?
          </AppText>
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
        </View>

        <Button label="Salvar alterações" onPress={handleSave} disabled={!isValid || saving} style={styles.saveButton} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  fieldLabel: {
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  hint: {
    marginBottom: spacing.md,
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
    marginBottom: spacing.xs,
  },
  rowItem: {
    flex: 1,
  },
  socialBlock: {
    marginTop: spacing.xxl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  socialTitle: {
    marginBottom: spacing.md,
  },
  saveButton: {
    marginTop: spacing.xl,
  },
});
