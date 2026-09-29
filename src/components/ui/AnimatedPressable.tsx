import React from 'react';
import { Pressable, type GestureResponderEvent, type PressableProps } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  style?: PressableProps['style'] extends (...args: never[]) => infer R ? R : PressableProps['style'];
  // Quanto o elemento "afunda" ao ser tocado — chips/botões pequenos pedem menos do que um card
  // inteiro (valor mais próximo de 1 = efeito mais sutil).
  scaleTo?: number;
}

/**
 * Base de toque com feedback de escala — usada por Button/Chip/SelectableCard em vez de cada um
 * reimplementar sua própria animação de toque. `withTiming` (não spring) de propósito: um spring
 * ultrapassa o valor final e "balança" antes de assentar, o que lê como brincalhão — aqui o
 * objetivo é discreto/profissional, então a escala anda até o valor final e para. Só aceita
 * `style` como valor direto (não função `(state) => style`, que o Pressable normal suporta):
 * nenhum consumidor de hoje precisa da variante de função, e a versão animada já cobre o estado
 * "pressionado" via escala.
 */
export function AnimatedPressable({ scaleTo = 0.97, style, onPressIn, onPressOut, ...rest }: AnimatedPressableProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handlePressIn(event: GestureResponderEvent) {
    scale.value = withTiming(scaleTo, { duration: 90, easing: Easing.out(Easing.quad) });
    onPressIn?.(event);
  }

  function handlePressOut(event: GestureResponderEvent) {
    scale.value = withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) });
    onPressOut?.(event);
  }

  return (
    <ReanimatedPressable
      {...rest}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, style]}
    />
  );
}
