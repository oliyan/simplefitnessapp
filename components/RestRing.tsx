import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface RestRingProps {
  remaining: number; // seconds left
  total: number; // seconds the rest started with (grows when time is added)
  color: string; // the arc
  trackColor: string;
  textColor: string;
  unitLabel: string;
  size?: number;
}

// A circular countdown: the arc shrinks as the rest runs out, with the seconds in the middle.
export default function RestRing({ remaining, total, color, trackColor, textColor, unitLabel, size = 176 }: RestRingProps) {
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - fraction)}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={{ color: textColor, fontSize: 56, fontWeight: '800', lineHeight: 62 }}>{remaining}</Text>
      <Text style={{ color: textColor, fontSize: 18, opacity: 0.7 }}>{unitLabel}</Text>
    </View>
  );
}
