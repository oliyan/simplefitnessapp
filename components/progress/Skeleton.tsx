import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

// Grey placeholder cards that pulse softly while the numbers load, so the page does not jump.
export default function Skeleton({ blocks = [90, 140, 120] }: { blocks?: number[] }) {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <View accessibilityLabel="Loading" accessibilityRole="progressbar">
      {blocks.map((h, i) => (
        <Animated.View key={i} style={{ height: h, borderRadius: 20, marginBottom: 14, backgroundColor: theme.accentSoft, opacity }} />
      ))}
    </View>
  );
}
