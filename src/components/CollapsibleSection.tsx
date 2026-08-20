import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { radius, spacing, useTheme } from '@/theme';

interface CollapsibleSectionProps {
  title: string;
  count: number;
  children: React.ReactNode;
}

/** Seção fechada por padrão — usada na Home pra "Concluídas"/"Não realizadas" (ver home.tsx):
 * essa informação continua acessível, mas não ocupa espaço na tela até a pessoa pedir pra ver. */
export function CollapsibleSection({ title, count, children }: CollapsibleSectionProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        style={[styles.header, { backgroundColor: colors.surfaceMuted }]}
      >
        <AppText variant="bodyStrong">
          {title} · {count}
        </AppText>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
      </Pressable>
      {expanded && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  content: {
    marginTop: spacing.md,
  },
});
