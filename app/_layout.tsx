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
import { ErrorBoundary } from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync().catch(() => {});

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

function navigateToInstance(instanceId: unknown) {
  if (typeof instanceId !== 'string') return;
  router.push({ pathname: '/(main)/(tabs)/home', params: { instanceId } });
}

// Navegação por tela em vez de instância — usada pela notificação de "O que você melhorou?"
// (ver weeklyRecapService.ts), que não se refere a um desafio específico. Mesmo padrão de
// `data.instanceId`, só que `data.screen` aponta pra uma aba em vez de uma instância.
function navigateToScreen(screen: unknown) {
  if (screen === 'insights') router.push('/(main)/(tabs)/insights');
}

function handleNotificationData(data: Record<string, unknown> | undefined) {
  if (!data) return;
  if (data.instanceId) navigateToInstance(data.instanceId);
  else if (data.screen) navigateToScreen(data.screen);
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
