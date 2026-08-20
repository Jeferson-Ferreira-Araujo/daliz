import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface LogoMarkProps {
  size?: number;
}

/** Marca "Daliz" — glifo gerado em SVG/rasterizado via scripts/generate-daliz-brand.js (ver ARCHITECTURE.md). */
export function LogoMark({ size = 96 }: LogoMarkProps) {
  return (
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    <Image source={require('../../../assets/brand/logo-mark.png')} style={[styles.image, { width: size, height: size }]} resizeMode="contain" />
  );
}

const styles = StyleSheet.create({
  image: {},
});
