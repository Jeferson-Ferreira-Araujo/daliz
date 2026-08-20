import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { AppText } from './AppText';
import { radius, spacing, useTheme } from '@/theme';
import { timeToMinutes } from '@/utils/time';

interface TimeFieldProps {
  label: string;
  value: string; // "HH:mm"
  onChange: (value: string) => void;
}

function timeStringToDate(value: string): Date {
  const date = new Date();
  const minutes = timeToMinutes(value);
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
}

function dateToTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function TimeField({ label, value, onChange }: TimeFieldProps) {
  const { colors } = useTheme();
  const [showIOSPicker, setShowIOSPicker] = useState(false);

  function handlePress() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: timeStringToDate(value),
        mode: 'time',
        is24Hour: true,
        onChange: (event, date) => {
          if (event.type === 'set' && date) {
            onChange(dateToTimeString(date));
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
        <AppText variant="bodyStrong">{value}</AppText>
      </Pressable>
      {Platform.OS === 'ios' && showIOSPicker && (
        <DateTimePicker
          value={timeStringToDate(value)}
          mode="time"
          display="spinner"
          onChange={(event, date) => {
            if (date) onChange(dateToTimeString(date));
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
