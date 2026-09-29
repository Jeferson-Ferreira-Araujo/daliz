import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { router, Stack, usePathname } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  NunitoSans_400Regular,
  NunitoSans_500Medium,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
  NunitoSans_800ExtraBold,
} from '@expo-google-fonts/nunito-sans';
import { ThemeProvider, useTheme } from '@/theme';
import { analyticsService } from '@/services/analyticsService';
import { crashService } from '@/services/crashService';
import { admobService } from '@/services/admobService';
import { ErrorBoundary } from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Chamada uma única vez, o quanto antes — precisa acontecer antes de qualquer <AdBannerNative />
// tentar carregar um anúncio (ver TabBar.tsx). Fora de qualquer componente de propósito: não deve
// esperar nenhum efeito de tela específica pra rodar, e a própria função já é no-op no Expo Go/web
// (ver admobService.ts).
admobService.initialize();

// Captura qualquer erro de JS que escape de um try/catch e do próprio ErrorBoundary (que só pega
// erro de render) — ex: erro dentro de um `setTimeout`, de um listener de evento, de uma Promise
// sem `.catch`. `ErrorUtils` é uma global do React Native, não existe na web.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ErrorUtils não tem types oficiais
const errorUtils = (global as any).ErrorUtils;
if (errorUtils?.setGlobalHandler) {
  const defaultHandler = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    crashService.recordError(error, isFatal ? 'uncaught_fatal' : 'uncaught_error');
    defaultHandler(error, isFatal);
  });
}

// `reminded` marca que a notificação era um lembrete ("⏰ Lembrete: você pediu pra rever essa
// ação", ver notificationService.scheduleReminder) — home.tsx usa isso pra destacar o card
// lembrado de um jeito diferente do destaque de "ação mais recente" (que pode já ser outro card,
// se uma ação nova chegou nesse meio-tempo). Nunca reordena a lista, só marca visualmente.
function navigateToInstance(instanceId: unknown, options?: { reminded?: boolean }) {
  if (typeof instanceId !== 'string') return;
  router.push({ pathname: '/(main)/(tabs)/home', params: options?.reminded ? { instanceId, reminded: '1' } : { instanceId } });
}

// Navegação por tela em vez de instância — usada pela notificação de "Seu resumo semanal" (ver
// weeklyRecapService.ts) e pelo lembrete de fim de dia (ver notificationService.
// scheduleDayReflectionReminder), nenhum dos dois se refere a um desafio específico. Mesmo padrão
// de `data.instanceId`, só que `data.screen` aponta pra uma aba em vez de uma instância.
function navigateToScreen(data: Record<string, unknown>) {
  if (data.screen === 'insights') router.push('/(main)/(tabs)/insights');
  // `focusToday` pede pro Histórico já abrir o card de hoje expandido, pronto pra escrever — sem
  // isso a notificação "Como foi seu dia hoje?" só levava a uma lista de dias fechados, obrigando
  // a pessoa a achar e tocar no card de novo.
  else if (data.screen === 'history') router.push({ pathname: '/(main)/(tabs)/history', params: data.focusToday ? { focusToday: '1' } : undefined });
}

function handleNotificationData(data: Record<string, unknown> | undefined) {
  if (!data) return;
  if (data.instanceId) navigateToInstance(data.instanceId, { reminded: data.isReminder === true });
  else if (data.screen) navigateToScreen(data);
}

// expo-notifications não implementa respostas de notificação na web.
function useNotificationTapNavigation() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    Notifications.getLastNotificationResponseAsync().then((response) => {
      handleNotificationData(response?.notification.request.content.data);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationData(response.notification.request.content.data);
    });

    return () => subscription.remove();
  }, []);
}

// Reaproveita a própria rota (ex: "/(main)/(tabs)/home") como nome de tela — simples e já único
// por natureza (expo-router), sem precisar manter um mapa de nomes bonitos em paralelo.
function useScreenViewTracking() {
  const pathname = usePathname();
  useEffect(() => {
    analyticsService.logScreenView(pathname);
  }, [pathname]);
}

function RootNavigator() {
  useNotificationTapNavigation();
  useScreenViewTracking();
  const { colors, scheme } = useTheme();

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    NunitoSans_400Regular,
    NunitoSans_500Medium,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
    NunitoSans_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <RootNavigator />
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
