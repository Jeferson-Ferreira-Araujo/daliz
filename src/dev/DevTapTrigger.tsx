import React, { useRef } from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';

const TAPS_REQUIRED = 7;
const TAP_WINDOW_MS = 2000;

interface DevTapTriggerProps {
  children: React.ReactNode;
}

/**
 * Acesso secreto ao Modo Desenvolvedor: 7 toques no elemento envolvido, em
 * menos de 2s entre cada um. Só existe em __DEV__ — em produção, isso
 * renderiza só os `children`, sem nenhum Pressable/handler por trás.
 */
export function DevTapTrigger({ children }: DevTapTriggerProps) {
  if (!__DEV__) return <>{children}</>;
  return <DevTapTriggerActive>{children}</DevTapTriggerActive>;
}

function DevTapTriggerActive({ children }: DevTapTriggerProps) {
  const tapCount = useRef(0);
  const lastTapAt = useRef(0);

  function handlePress() {
    const now = Date.now();
    if (now - lastTapAt.current > TAP_WINDOW_MS) {
      tapCount.current = 0;
    }
    lastTapAt.current = now;
    tapCount.current += 1;

    if (tapCount.current >= TAPS_REQUIRED) {
      tapCount.current = 0;
      router.push('/dev/schedule-preview');
    }
  }

  return <Pressable onPress={handlePress}>{children}</Pressable>;
}
