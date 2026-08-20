import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { currentLocationService } from '@/services/currentLocationService';
import { radius, spacing, useTheme } from '@/theme';
import type { UserLocation } from '@/types';

interface CurrentLocationFieldProps {
  location: UserLocation | null;
  onChange: (location: UserLocation) => void;
}

/**
 * Localização sempre via GPS — nunca mais por busca/escolha de nome de cidade. Deixar a pessoa
 * digitar e escolher "a dedo" abria margem pra cadastrar uma cidade que não é a sua de verdade,
 * o que contaminaria clima/estação/datas comemorativas calculados a partir dela (ver
 * dayCycleService.syncRegisteredLocationForToday, que já assume a cidade cadastrada como
 * confiável). Mesmo componente usado no cadastro ("Usar minha localização atual") e em
 * Configurações/Editar perfil ("Atualizar") — só muda o rótulo do botão conforme já existe ou não
 * uma cidade registrada; nunca oferece remover/limpar a cidade, só atualizar pra a atual.
 */
export function CurrentLocationField({ location, onChange }: CurrentLocationFieldProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleRequestLocation() {
    setLoading(true);
    setError(false);
    try {
      let status = await currentLocationService.getPermissionStatus();
      if (status !== 'granted') status = await currentLocationService.requestPermission();
      if (status !== 'granted') {
        setError(true);
        return;
      }
      const detected = await currentLocationService.fetchLocationOnly();
      if (detected) {
        onChange(detected);
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (location) {
    return (
      <View style={[styles.currentCard, { backgroundColor: colors.surface }]}>
        <Ionicons name="location-outline" size={20} color={colors.primary} style={styles.currentIcon} />
        <View style={{ flex: 1 }}>
          <AppText variant="body">
            {location.city}
            {location.state ? `, ${location.state}` : ''}
          </AppText>
          {location.country && (
            <AppText variant="caption" color={colors.textMuted}>
              {location.country}
            </AppText>
          )}
        </View>
        <Button
          label={loading ? 'Atualizando...' : 'Atualizar'}
          variant="outline"
          size="sm"
          onPress={handleRequestLocation}
          disabled={loading}
        />
      </View>
    );
  }

  return (
    <View>
      <Pressable
        onPress={handleRequestLocation}
        disabled={loading}
        style={[styles.promptCard, { backgroundColor: colors.surfaceMuted }]}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Ionicons name="location-outline" size={18} color={colors.primary} style={styles.promptIcon} />
            <AppText variant="body" color={colors.text} style={styles.promptText}>
              Usar minha localização atual
            </AppText>
          </>
        )}
      </Pressable>
      {error && (
        <AppText variant="caption" color={colors.textMuted} style={styles.hint}>
          Não conseguimos acessar sua localização agora — você pode tentar de novo, ou pular essa etapa.
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  currentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  currentIcon: {
    marginRight: spacing.xs,
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  promptIcon: {
    marginRight: spacing.sm,
  },
  promptText: {
    flex: 1,
  },
  hint: {
    marginTop: spacing.xs,
  },
});
