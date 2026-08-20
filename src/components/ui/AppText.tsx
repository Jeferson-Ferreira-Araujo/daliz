import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { typography, useTheme } from '@/theme';

type Variant = keyof typeof typography;

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
}

export function AppText({ variant = 'body', color, style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  const variantStyle = typography[variant] as TextStyle;
  return <Text style={[variantStyle, { color: color ?? colors.text }, style]} {...rest} />;
}
