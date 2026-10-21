import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Ellipse, Rect } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { MuscleLoad } from '../../utils/progressStats';

// A simple front and back figure. Each muscle group is coloured by how many sets it had lately:
// a pale outline for none, a stronger teal the more it was trained.

interface Props {
  loads: MuscleLoad[];
}

export default function BodyMap({ loads }: Props) {
  const { theme } = useTheme();
  const max = Math.max(1, ...loads.map((l) => l.sets));
  const setsOf = (m: string) => {
    // "legs" has no region of its own: it lights up quads, hamstrings, glutes and calves a little.
    const direct = loads.find((l) => l.muscle === m)?.sets ?? 0;
    const legs = ['quads', 'hamstrings', 'glutes', 'calves'].includes(m) ? (loads.find((l) => l.muscle === 'legs')?.sets ?? 0) / 2 : 0;
    const core = m === 'abs' ? loads.find((l) => l.muscle === 'core')?.sets ?? 0 : 0;
    return direct + legs + core;
  };
  const fill = (m: string) => {
    const n = setsOf(m);
    if (n <= 0) return theme.type === 'dark' ? 'rgba(234,244,242,0.10)' : 'rgba(16,32,30,0.08)';
    const a = 0.3 + 0.7 * Math.min(1, n / max);
    return theme.type === 'dark' ? `rgba(45,212,191,${a})` : `rgba(15,118,110,${a})`;
  };
  const skin = theme.type === 'dark' ? 'rgba(234,244,242,0.10)' : 'rgba(16,32,30,0.08)';

  const figure = (side: 'front' | 'back') => {
    const f = side === 'front';
    return (
      <Svg width={118} height={230} viewBox="0 0 118 230">
        <Ellipse cx={59} cy={18} rx={14} ry={16} fill={skin} />
        <Rect x={53} y={32} width={12} height={9} rx={3} fill={skin} />
        {/* shoulders */}
        <Ellipse cx={34} cy={50} rx={13} ry={11} fill={fill('shoulders')} />
        <Ellipse cx={84} cy={50} rx={13} ry={11} fill={fill('shoulders')} />
        {/* chest or back */}
        {f ? (
          <>
            <Rect x={40} y={42} width={17} height={28} rx={8} fill={fill('chest')} />
            <Rect x={61} y={42} width={17} height={28} rx={8} fill={fill('chest')} />
            <Rect x={46} y={73} width={26} height={40} rx={9} fill={fill('abs')} />
          </>
        ) : (
          <>
            <Rect x={40} y={42} width={38} height={44} rx={12} fill={fill('back')} />
            <Rect x={44} y={88} width={30} height={22} rx={9} fill={fill('back')} />
          </>
        )}
        {/* upper arms */}
        <Rect x={17} y={58} width={14} height={36} rx={7} fill={fill(f ? 'biceps' : 'triceps')} />
        <Rect x={87} y={58} width={14} height={36} rx={7} fill={fill(f ? 'biceps' : 'triceps')} />
        {/* forearms */}
        <Rect x={14} y={97} width={13} height={38} rx={6.5} fill={fill('forearms')} />
        <Rect x={91} y={97} width={13} height={38} rx={6.5} fill={fill('forearms')} />
        {/* hips */}
        {!f && <Rect x={42} y={112} width={34} height={22} rx={10} fill={fill('glutes')} />}
        {f && <Rect x={44} y={116} width={30} height={14} rx={7} fill={skin} />}
        {/* thighs */}
        <Rect x={40} y={137} width={17} height={50} rx={8} fill={fill(f ? 'quads' : 'hamstrings')} />
        <Rect x={61} y={137} width={17} height={50} rx={8} fill={fill(f ? 'quads' : 'hamstrings')} />
        {/* calves */}
        <Rect x={41} y={190} width={15} height={34} rx={7} fill={fill('calves')} />
        <Rect x={62} y={190} width={15} height={34} rx={7} fill={fill('calves')} />
      </Svg>
    );
  };

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start' }}>
      <View style={{ alignItems: 'center' }}>
        {figure('front')}
        <Text style={{ color: theme.text, opacity: 0.6, fontSize: 12 }}>Front</Text>
      </View>
      <View style={{ width: 14 }} />
      <View style={{ alignItems: 'center' }}>
        {figure('back')}
        <Text style={{ color: theme.text, opacity: 0.6, fontSize: 12 }}>Back</Text>
      </View>
    </View>
  );
}
