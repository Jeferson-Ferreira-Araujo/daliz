import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { TextField } from '@/components/ui/TextField';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { generateId } from '@/utils/id';
import { radius, spacing, useTheme } from '@/theme';
import { resolvePersonAge, toISODate } from '@/utils/date';
import { getCurrentDate } from '@/utils/now';
import { RELATIONSHIP_LABELS, type ImportantPerson, type LivesWithUser, type RelationshipType } from '@/types';

function formatDisplayDate(value: string): string {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function dateStringToDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const RELATIONSHIP_OPTIONS = Object.entries(RELATIONSHIP_LABELS) as [RelationshipType, string][];

const LIVES_WITH_OPTIONS: { value: LivesWithUser; label: string }[] = [
  { value: true, label: 'Sim' },
  { value: false, label: 'Não' },
  { value: null, label: 'Prefiro não informar' },
];

interface ImportantPeopleEditorProps {
  people: ImportantPerson[];
  onChange: (people: ImportantPerson[]) => void;
  // Abre o formulário de "Adicionar pessoa" já expandido — usado quando a pessoa chega aqui pelo
  // CTA "Quer adicionar?" da tela de Perfil (ver app/(main)/(tabs)/profile.tsx), pra economizar o
  // toque extra de abrir o formulário de novo.
  autoOpenAdd?: boolean;
}

/**
 * Widget de "pessoas importantes" reaproveitado no onboarding e em editar perfil —
 * ao contrário dos outros blocos de pergunta (categorias, interesses), aqui a lógica
 * de adicionar/remover pessoas é complexa o bastante pra justificar um componente
 * único em vez de duplicar em cada tela (ver app/onboarding/profile.tsx e
 * app/(main)/edit-profile.tsx).
 */
export function ImportantPeopleEditor({ people, onChange, autoOpenAdd }: ImportantPeopleEditorProps) {
  const { colors } = useTheme();
  const [adding, setAdding] = useState(() => autoOpenAdd ?? false);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType | null>(null);
  const [age, setAge] = useState('');
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [showIOSPicker, setShowIOSPicker] = useState(false);
  const [livesWithUser, setLivesWithUser] = useState<LivesWithUser | undefined>(undefined);

  function resetForm() {
    setName('');
    setRelationship(null);
    setAge('');
    setBirthDate(null);
    setLivesWithUser(undefined);
    setAdding(false);
  }

  function handlePickBirthDate() {
    const initial = birthDate ? dateStringToDate(birthDate) : new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initial,
        mode: 'date',
        maximumDate: new Date(),
        onChange: (event, date) => {
          if (event.type === 'set' && date) setBirthDate(toISODate(date));
        },
      });
    } else {
      setShowIOSPicker(true);
    }
  }

  function handleAdd() {
    if (!relationship || livesWithUser === undefined) return;
    const person: ImportantPerson = {
      id: generateId('person'),
      name: name.trim().length > 0 ? name.trim() : null,
      relationship,
      age: age.trim().length > 0 && !Number.isNaN(Number(age)) ? Number(age) : null,
      birthDate,
      livesWithUser,
    };
    onChange([...people, person]);
    resetForm();
  }

  function handleRemove(id: string) {
    onChange(people.filter((p) => p.id !== id));
  }

  const canAdd = relationship != null && livesWithUser !== undefined;

  return (
    <View>
      {people.map((person) => (
        <View key={person.id} style={[styles.personCard, { backgroundColor: colors.surface }]}>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong">{person.name ?? RELATIONSHIP_LABELS[person.relationship]}</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {RELATIONSHIP_LABELS[person.relationship]}
              {/* Recalculada a partir de birthDate quando existir (ver resolvePersonAge) — sem
                  isso, essa lista mostraria pra sempre a idade digitada no cadastro, mesmo
                  depois da pessoa fazer aniversário. */}
              {(() => {
                const age = resolvePersonAge(person, getCurrentDate());
                return age != null ? ` · ${age} anos` : '';
              })()}
              {person.birthDate ? ` · nascimento em ${formatDisplayDate(person.birthDate)}` : ''}
              {person.livesWithUser === true ? ' · mora com você' : person.livesWithUser === false ? ' · não mora com você' : ''}
            </AppText>
          </View>
          <Pressable onPress={() => handleRemove(person.id)} hitSlop={12}>
            <Ionicons name="close-circle" size={22} color={colors.textMuted} />
          </Pressable>
        </View>
      ))}

      {!adding && (
        <Button
          label={people.length > 0 ? 'Adicionar outra pessoa' : 'Adicionar pessoa'}
          variant="outline"
          onPress={() => setAdding(true)}
        />
      )}

      {adding && (
        <View style={[styles.form, { borderColor: colors.border }]}>
          <TextField label="Nome (opcional)" value={name} onChangeText={setName} placeholder="Ex: João" />

          <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
            Relação
          </AppText>
          <View style={styles.chipsRow}>
            {RELATIONSHIP_OPTIONS.map(([value, label]) => (
              <Chip key={value} label={label} selected={relationship === value} onPress={() => setRelationship(value)} />
            ))}
          </View>

          <TextField
            label="Idade (opcional)"
            value={age}
            onChangeText={setAge}
            placeholder="Ex: 7"
            keyboardType="number-pad"
          />

          <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
            Data de nascimento (opcional)
          </AppText>
          <View style={styles.birthDateRow}>
            <Pressable
              onPress={handlePickBirthDate}
              style={[styles.birthDateField, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <AppText variant="bodyStrong">
                {birthDate ? formatDisplayDate(birthDate) : 'Se não souber, não tem problema'}
              </AppText>
            </Pressable>
            {birthDate && (
              <Pressable onPress={() => setBirthDate(null)} hitSlop={12}>
                <Ionicons name="close-circle" size={22} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
          {Platform.OS === 'ios' && showIOSPicker && (
            <DateTimePicker
              value={birthDate ? dateStringToDate(birthDate) : new Date()}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={(event, date) => {
                if (date) setBirthDate(toISODate(date));
                if (event.type === 'set' || event.type === 'dismissed') setShowIOSPicker(false);
              }}
            />
          )}

          <AppText variant="caption" color={colors.textMuted} style={styles.fieldLabel}>
            Mora com você?
          </AppText>
          <View style={styles.chipsRow}>
            {LIVES_WITH_OPTIONS.map((option) => (
              <Chip
                key={String(option.value)}
                label={option.label}
                selected={livesWithUser === option.value}
                onPress={() => setLivesWithUser(option.value)}
              />
            ))}
          </View>

          <View style={styles.formActions}>
            <Button label="Cancelar" variant="outline" size="sm" onPress={resetForm} style={styles.formButton} />
            <Button label="Adicionar" size="sm" onPress={handleAdd} disabled={!canAdd} style={styles.formButton} />
          </View>
        </View>
      )}

      {people.length === 0 && !adding && (
        <AppText variant="caption" color={colors.textMuted} style={styles.hint}>
          Prefiro não adicionar ninguém agora — tudo bem, você pode voltar aqui quando quiser.
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  form: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  fieldLabel: {
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  birthDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  birthDateField: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  formButton: {
    flex: 1,
  },
  hint: {
    marginTop: spacing.sm,
  },
});
