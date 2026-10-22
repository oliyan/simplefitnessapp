import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  size?: number;
  stroke?: number;
  progress: number; // 0 to 1
  color?: string;
  children?: React.ReactNode;
}

// A progress ring with something (a number, an icon) in the middle.
export default function Ring({ size = 64, stroke = 7, progress, color, children }: Props) {
  const { theme } = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.accentSoft} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color ?? theme.accent}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * p} ${c}`}
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      {children}
    </View>
  );
}
