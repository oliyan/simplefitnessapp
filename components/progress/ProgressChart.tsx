import React, { useMemo, useRef, useState } from 'react';
import { View, Text, PanResponder, LayoutChangeEvent } from 'react-native';
import Svg, { Line, Polyline, Circle, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { SeriesPoint, formatKg, shortDate, trendLine, MetricKind, metricUnit } from '../../utils/progressStats';

interface Props {
  points: SeriesPoint[];
  metric: MetricKind;
  height?: number;
}

const PAD_L = 40;
const PAD_R = 14;
const PAD_T = 14;
const PAD_B = 24;

// One value per session. Press and drag a finger along the chart to read each session; the
// personal records are drawn as larger gold dots, and a faint dashed line shows the overall direction.
export default function ProgressChart({ points, metric, height = 220 }: Props) {
  const { theme } = useTheme();
  const [width, setWidth] = useState(300);
  const [active, setActive] = useState<number | null>(null);
  const unit = metricUnit(metric);

  const geometry = useMemo(() => {
    if (points.length === 0) return { min: 0, max: 1, xs: [] as number[], y: (_v: number) => 0, innerH: 0 };
    const vs = points.map((p) => p.v);
    let min = Math.min(...vs);
    let max = Math.max(...vs);
    if (min === max) {
      min = min * 0.9;
      max = max * 1.1 || 1;
    }
    const pad = (max - min) * 0.12;
    min = Math.max(0, min - pad);
    max += pad;
    const t0 = points[0].d;
    const t1 = points[points.length - 1].d;
    const spanT = t1 - t0 || 1;
    const innerW = width - PAD_L - PAD_R;
    const innerH = height - PAD_T - PAD_B;
    const xs = points.map((p) => (points.length === 1 ? PAD_L + innerW / 2 : PAD_L + ((p.d - t0) / spanT) * innerW));
    const y = (v: number) => PAD_T + (1 - (v - min) / (max - min)) * innerH;
    return { min, max, xs, y, innerH };
  }, [points, width, height]);

  const nearest = (x: number) => {
    let best = 0;
    let dist = Infinity;
    geometry.xs.forEach((px, i) => {
      const d = Math.abs(px - x);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    return best;
  };

  // The responder is created once, so it reads the newest `nearest` through a ref.
  const nearestRef = useRef(nearest);
  nearestRef.current = nearest;
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Keep the finger on the chart: the page should not scroll while someone reads a value.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => setActive(nearestRef.current(e.nativeEvent.locationX)),
      onPanResponderMove: (e) => setActive(nearestRef.current(e.nativeEvent.locationX)),
    }),
  ).current;

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (points.length === 0) return null;
  const { min, max, xs, y } = geometry;
  const trend = trendLine(points);
  const ticks = [0, 0.5, 1].map((f) => min + f * (max - min));
  const sel = active !== null && active < points.length ? active : points.length - 1;
  const p = points[sel];

  return (
    <View>
      <View onLayout={onLayout} {...responder.panHandlers} style={{ height }}>
        <Svg width={width} height={height}>
          {ticks.map((t, i) => (
            <React.Fragment key={i}>
              <Line x1={PAD_L} x2={width - PAD_R} y1={y(t)} y2={y(t)} stroke={theme.border} strokeWidth={1} />
              <SvgText x={PAD_L - 6} y={y(t) + 4} fontSize={11} fill={theme.text} fillOpacity={0.6} textAnchor="end">
                {formatKg(t)}
              </SvgText>
            </React.Fragment>
          ))}
          {trend && (
            <Line x1={xs[0]} y1={y(trend[0])} x2={xs[xs.length - 1]} y2={y(trend[1])} stroke={theme.accent} strokeOpacity={0.4} strokeWidth={2} strokeDasharray="6 5" />
          )}
          {points.length > 1 && (
            <Polyline points={points.map((pt, i) => `${xs[i]},${y(pt.v)}`).join(' ')} fill="none" stroke={theme.accent} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
          )}
          {active !== null && <Line x1={xs[sel]} x2={xs[sel]} y1={PAD_T} y2={height - PAD_B} stroke={theme.text} strokeOpacity={0.35} strokeWidth={1} />}
          {points.map((pt, i) => (
            <Circle key={i} cx={xs[i]} cy={y(pt.v)} r={i === sel ? 7 : pt.isRecord ? 5.5 : 3.5} fill={pt.isRecord ? '#E0A400' : theme.accent} stroke={theme.card} strokeWidth={i === sel ? 2 : 1} />
          ))}
          <SvgText x={PAD_L} y={height - 6} fontSize={11} fill={theme.text} fillOpacity={0.6} textAnchor="start">
            {shortDate(points[0].d)}
          </SvgText>
          {points.length > 1 && (
            <SvgText x={width - PAD_R} y={height - 6} fontSize={11} fill={theme.text} fillOpacity={0.6} textAnchor="end">
              {shortDate(points[points.length - 1].d)}
            </SvgText>
          )}
        </Svg>
      </View>
      <View style={{ marginTop: 8, padding: 12, borderRadius: 14, backgroundColor: theme.accentSoft }}>
        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16 }}>
          {shortDate(p.d)}: {formatKg(p.v)} {unit}
          {p.isRecord ? '  (new record)' : ''}
        </Text>
        <Text style={{ color: theme.text, opacity: 0.75, marginTop: 2 }}>
          {p.sets.map((s) => (s.wt > 0 ? `${formatKg(s.wt)} x ${s.reps}` : `${s.reps} reps`)).join('   ')}
        </Text>
        {active === null && points.length > 1 && (
          <Text style={{ color: theme.text, opacity: 0.55, marginTop: 4, fontSize: 12 }}>Drag a finger along the line to see each session.</Text>
        )}
      </View>
    </View>
  );
}
