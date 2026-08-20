import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { currentLocationService } from '@/services/currentLocationService';
import type { CurrentLocationWeather, LocationPermissionState } from '@/services/currentLocationService';
import { getWeatherIconName } from '@/utils/weatherIcons';
import { radius, spacing, useTheme } from '@/theme';

/**
 * Widget de clima "ao vivo" — cidade + temperatura de onde a pessoa está agora (GPS), separado do
 * clima da cidade cadastrada (esse continua só alimentando o motor de desafios, ver
 * currentLocationService.ts). Usado tanto na Home quanto no Perfil. Some completamente sem
 * permissão de localização, sem GPS disponível, ou se qualquer parte da busca falhar — nunca
 * quebra a tela por causa disso.
 */
export function CurrentWeatherWidget() {
  const { colors } = useTheme();
  const [permission, setPermission] = useState<LocationPermissionState | null>(null);
  const [data, setData] = useState<CurrentLocationWeather | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    const status = await currentLocationService.getPermissionStatus();
    setPermission(status);
    if (status !== 'granted') return;

    setLoading(true);
    const result = await currentLocationService.fetchCurrent();
    setLoading(false);
    if (result) {
      setData(result);
      setFailed(false);
    } else {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleActivate() {
    setLoading(true);
    const status = await currentLocationService.requestPermission();
    setPermission(status);
    if (status === 'granted') {
      const result = await currentLocationService.fetchCurrent();
      if (result) {
        setData(result);
        setFailed(false);
      } else {
        setFailed(true);
      }
    }
    setLoading(false);
  }

  // Ainda não sabemos o status de permissão — evita "piscar" o prompt antes de checar.
  if (permission === null) return null;

  // Negada, ou qualquer falha na busca (sem GPS, API fora do ar): o widget simplesmente some.
  if (permission === 'denied' || failed) return null;

  if (permission === 'undetermined') {
    return (
      <Pressable
        onPress={handleActivate}
        disabled={loading}
        style={[styles.promptCard, { backgroundColor: colors.surfaceMuted }]}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Ionicons name="location-outline" size={18} color={colors.primary} style={styles.promptIcon} />
            <AppText variant="caption" color={colors.textMuted} style={styles.promptText}>
              Ativar localização pra ver o clima de onde você está agora
            </AppText>
          </>
        )}
      </Pressable>
    );
  }

  if (loading || !data) {
    return (
      <View style={[styles.promptCard, { backgroundColor: colors.surfaceMuted }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Ionicons name={getWeatherIconName(data.weather)} size={20} color={colors.text} style={styles.icon} />
      <AppText variant="bodyStrong" color={colors.text}>
        {data.location.city}
      </AppText>
      <AppText variant="bodyStrong" color={colors.textMuted} style={styles.temperature}>
        {Math.round(data.weather.temperature)}°
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  icon: {
    marginRight: spacing.sm,
  },
  temperature: {
    marginLeft: spacing.sm,
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    minHeight: 48,
  },
  promptIcon: {
    marginRight: spacing.sm,
  },
  promptText: {
    flex: 1,
  },
});
