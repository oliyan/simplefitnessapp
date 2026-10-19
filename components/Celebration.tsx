import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface CelebrationProps {
  message: string | null; // null hides it
  onDone: () => void;
  durationMs?: number;
}

// A small banner that pops in at the top, stays for a moment and fades out. Used for personal bests.
export default function Celebration({ message, onDone, durationMs = 2600 }: CelebrationProps) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    scale.setValue(0.6);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    const timeout = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => onDone());
    }, durationMs);
    return () => clearTimeout(timeout);
  }, [message]);

  if (!message) return null;

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Animated.View
        style={[
          styles.banner,
          { backgroundColor: theme.buttonBackground, opacity, transform: [{ scale }] },
        ]}
      >
        <Text style={[styles.text, { color: theme.buttonText }]}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 92, left: 0, right: 0, alignItems: 'center', zIndex: 50 },
  banner: { borderRadius: 24, paddingVertical: 12, paddingHorizontal: 22, elevation: 6 },
  text: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
});
