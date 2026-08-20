import React, { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import * as Location from 'expo-location';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { spacing, useTheme } from '@/theme';
import { currentLocationService } from '@/services/currentLocationService';
import { buildGoogleSearchUrl } from '@/utils/googleSearch';
import { buildMapsSearchUrl } from '@/utils/maps';
import { buildSpotifySearchUrl } from '@/utils/spotify';
import { MovieGenrePicker } from './MovieGenrePicker';
import { MOVIE_GENRE_URLS, type MovieGenre } from '@/data/movieGenres';
import type { ActionSupportData, ActionSupportType } from '@/types';

interface ActionSupportProps {
  supportType: ActionSupportType | undefined;
  supportLabel: string | undefined;
  supportData: ActionSupportData | undefined;
}

// Ponto único de decisão "supportType → experiência" (ver seção 2 do pedido: "não criar
// componentes diferentes e lógica duplicada para cada ação"). Cada tipo novo (camera, link, tool,
// youtube, weather, calculator, calendar) entra como mais um `case` aqui, sem tocar no
// ChallengeCard nem nos tipos que já existem. `supportType` é ortogonal a `timing`: um responde
// "como ajudar a fazer", o outro "quando faz sentido lembrar" — nunca misturados no mesmo campo.
export function ActionSupport({ supportType, supportLabel, supportData }: ActionSupportProps) {
  if (!supportType || supportType === 'none') return null;

  switch (supportType) {
    case 'search':
      return supportData?.query ? <SearchSupport label={supportLabel} query={supportData.query} /> : null;
    case 'categories':
      return <MovieCategorySupport label={supportLabel} />;
    case 'maps':
      return <MapsSupport label={supportLabel} query={supportData?.query} />;
    case 'spotify':
      return <SpotifySupport label={supportLabel} query={supportData?.query} />;
    default:
      return null;
  }
}

function SearchSupport({ label, query }: { label?: string; query: string }) {
  return (
    <Button
      label={label ?? '🔎 Pesquisar'}
      variant="outline"
      size="sm"
      onPress={() => Linking.openURL(buildGoogleSearchUrl(query)).catch(() => {})}
      style={styles.button}
    />
  );
}

function SpotifySupport({ label, query }: { label?: string; query?: string }) {
  return (
    <Button
      label={label ?? '🎵 Abrir no Spotify'}
      variant="outline"
      size="sm"
      onPress={() => Linking.openURL(query ? buildSpotifySearchUrl(query) : 'https://open.spotify.com/').catch(() => {})}
      style={styles.button}
    />
  );
}

function MovieCategorySupport({ label }: { label?: string }) {
  const [showGenres, setShowGenres] = useState(false);

  function handleSelect(genre: MovieGenre) {
    setShowGenres(false);
    Linking.openURL(MOVIE_GENRE_URLS[genre]).catch(() => {});
  }

  if (showGenres) return <MovieGenrePicker onSelect={handleSelect} />;

  return (
    <Button label={label ?? '🎬 Ver sugestões'} variant="outline" size="sm" onPress={() => setShowGenres(true)} style={styles.button} />
  );
}

type MapsState = 'idle' | 'loading' | 'denied';

function MapsSupport({ label, query }: { label?: string; query?: string }) {
  const { colors } = useTheme();
  const [state, setState] = useState<MapsState>('idle');

  // Só pede permissão quando a pessoa toca no botão (nunca no onboarding — ver seção 8 do
  // pedido). Nega -> mensagem amigável, sem travar a conclusão normal da ação.
  async function handlePress() {
    if (!query) return;
    setState('loading');
    try {
      let status = await currentLocationService.getPermissionStatus();
      if (status !== 'granted') status = await currentLocationService.requestPermission();
      if (status !== 'granted') {
        setState('denied');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      await Linking.openURL(buildMapsSearchUrl(query, position.coords));
      setState('idle');
    } catch {
      // Sem GPS/permissão indisponível na plataforma — mesma mensagem amigável da negação.
      setState('denied');
    }
  }

  if (!query) return null;

  return (
    <View>
      <Button
        label={label ?? '📍 Abrir no Maps'}
        variant="outline"
        size="sm"
        disabled={state === 'loading'}
        onPress={handlePress}
        style={styles.button}
      />
      {state === 'denied' && (
        <AppText variant="caption" color={colors.textMuted} style={styles.deniedMessage}>
          Precisamos da sua localização pra sugerir lugares por perto. Você pode continuar essa ação normalmente, sem o mapa.
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  deniedMessage: {
    marginTop: spacing.xs,
  },
});
