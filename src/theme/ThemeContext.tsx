import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type ColorPalette } from './palette';
import { preferencesRepository } from '@/storage/repositories/preferencesRepository';
import { profileRepository } from '@/storage/repositories/profileRepository';
import type { ThemePreference } from '@/types';

interface ThemeContextValue {
  colors: ColorPalette;
  scheme: 'light' | 'dark';
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('light');

  useEffect(() => {
    // A preferência de tema só é aplicada depois que existe um cadastro —
    // antes disso (onboarding) o app sempre abre no claro, mesmo que tenha
    // sobrado uma preferência salva de um cadastro anterior (ex: testes).
    Promise.all([preferencesRepository.get(), profileRepository.get()]).then(([prefs, profile]) => {
      if (profile) setPreferenceState(prefs.themePreference);
    });
  }, []);

  function setPreference(next: ThemePreference) {
    setPreferenceState(next);
    preferencesRepository.get().then((prefs) => preferencesRepository.save({ ...prefs, themePreference: next }));
  }

  const scheme: 'light' | 'dark' =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: scheme === 'dark' ? darkColors : lightColors,
      scheme,
      preference,
      setPreference,
    }),
    [scheme, preference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
