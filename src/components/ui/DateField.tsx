import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { AppText } from './AppText';
import { radius, spacing, useTheme } from '@/theme';
import { toISODate } from '@/utils/date';

interface DateFieldProps {
  label: string;
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

function dateStringToDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDisplayDate(value: string): string {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export function DateField({ label, value, onChange, minimumDate, maximumDate }: DateFieldProps) {
  const { colors } = useTheme();
  const [showIOSPicker, setShowIOSPicker] = useState(false);

  function handlePress() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: dateStringToDate(value),
        mode: 'date',
        minimumDate,
        maximumDate,
        onChange: (event, date) => {
          if (event.type === 'set' && date) {
            onChange(toISODate(date));
          }
        },
      });
    } else {
      setShowIOSPicker(true);
    }
  }

  return (
    <View style={styles.container}>
      <AppText variant="caption" color={colors.textMuted} style={styles.label}>
        {label}
      </AppText>
      <Pressable
        onPress={handlePress}
        style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <AppText variant="bodyStrong">{formatDisplayDate(value)}</AppText>
      </Pressable>
      {Platform.OS === 'ios' && showIOSPicker && (
        <DateTimePicker
          value={dateStringToDate(value)}
          mode="date"
          display="spinner"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(event, date) => {
            if (date) onChange(toISODate(date));
            if (event.type === 'set' || event.type === 'dismissed') setShowIOSPicker(false);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
  },
  field: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
});
