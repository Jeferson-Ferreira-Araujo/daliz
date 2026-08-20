export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const typography = {
  hero: { fontSize: 30, fontWeight: '700' as const, lineHeight: 38, fontFamily: 'NunitoSans_700Bold' },
  title: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28, fontFamily: 'NunitoSans_700Bold' },
  subtitle: { fontSize: 17, fontWeight: '600' as const, lineHeight: 23, fontFamily: 'NunitoSans_600SemiBold' },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22, fontFamily: 'NunitoSans_400Regular' },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22, fontFamily: 'NunitoSans_600SemiBold' },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18, fontFamily: 'NunitoSans_400Regular' },
  statNumber: { fontSize: 20, fontWeight: '800' as const, lineHeight: 26, fontFamily: 'NunitoSans_800ExtraBold' },
  pillLabel: { fontSize: 13, fontWeight: '600' as const, lineHeight: 17, fontFamily: 'NunitoSans_600SemiBold' },
};
