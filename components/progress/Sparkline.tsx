import React from 'react';
import Svg, { Polyline, Circle } from 'react-native-svg';

interface Props {
  values: number[];
  color: string;
  width?: number;
  height?: number;
}

// A tiny line for a list row: no axes, just the shape and a dot on the latest value.
export default function Sparkline({ values, color, width = 64, height = 26 }: Props) {
  if (values.length < 2) {
    return (
      <Svg width={width} height={height}>
        <Circle cx={width - 5} cy={height / 2} r={3} fill={color} />
      </Svg>
    );
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => ({
    x: 3 + (i / (values.length - 1)) * (width - 8),
    y: 4 + (1 - (v - min) / span) * (height - 8),
  }));
  const last = pts[pts.length - 1];
  return (
    <Svg width={width} height={height}>
      <Polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx={last.x} cy={last.y} r={3} fill={color} />
    </Svg>
  );
}
