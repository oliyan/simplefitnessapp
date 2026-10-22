import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Share, Alert, AccessibilityInfo, Vibration, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../context/ThemeContext';
import { loadSettings, saveSettings } from '../../utils/settingsStorage';
import {
  ProgSession, ProgSet, heroSummary, consistencyGrid, recentRecords, mostImproved, muscleLoads, balanceSentence, badges,
  weeklyRecap, freshRecord, formatKg, shortDate, metricUnit, AREA_OF,
} from '../../utils/progressStats';
import ProgressHighlights from '../ProgressHighlights';
import Ring from '../goals/Ring';
import SimpleEditor from '../goals/SimpleEditor';
import useGoals from '../../utils/useGoals';
import { goalProgress, findPlateau, monthReview, reviewMonthFor, weekKey } from '../../utils/motivation';
import Celebration from '../Celebration';
import BodyMap from './BodyMap';
import FirstVisitTip from './FirstVisitTip';

interface Props {
  sessions: ProgSession[];
  sets: ProgSet[];
  onOpenExercise: (name: string) => void;
  onFindExercises: () => void;
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function OverviewTab({ sessions, sets, onOpenExercise, onFindExercises }: Props) {
  const { theme } = useTheme();
  const today = useMemo(() => new Date(), []);
  const [celebration, setCelebration] = useState<string | null>(null);
  const recapRef = useRef<View>(null);
  const monthRef = useRef<View>(null);
  const [capturing, setCapturing] = useState(false);
  const [editingWhy, setEditingWhy] = useState(false);
  const { goals, update } = useGoals();
  const rest = goals.restWeeks;
  const thisWeek = weekKey(today);
  const resting = rest.includes(thisWeek);

  const hero = useMemo(() => heroSummary(sessions, sets, today, rest), [sessions, sets, today, rest]);
  const grid = useMemo(() => consistencyGrid(sessions, sets, today, 12), [sessions, sets, today]);
  const records = useMemo(() => recentRecords(sets, 4), [sets]);
  const improved = useMemo(() => mostImproved(sets, today), [sets, today]);
  const loads = useMemo(() => muscleLoads(sets, today, 30), [sets, today]);
  const shelf = useMemo(() => badges(sessions, sets, today, rest), [sessions, sets, today, rest]);
  const recap = useMemo(() => weeklyRecap(sessions, sets, today, 'Urudhi', rest), [sessions, sets, today, rest]);
  const ym = reviewMonthFor(today);
  const review = useMemo(() => monthReview(sessions, sets, today, ym.year, ym.month, 'Urudhi'), [sessions, sets, today]);
  const plateau = useMemo(() => findPlateau(sets, today, goals.plateauHidden), [sets, today, goals.plateauHidden]);

  // Celebrate a new personal record once, the first time the page is opened after it happened.
  useEffect(() => {
    let active = true;
    (async () => {
      const fresh = freshRecord(sets, today);
      if (!fresh) return;
      const key = `${fresh.name}|${fresh.d}|${fresh.wt}`;
      const saved = await loadSettings();
      if (saved?.lastSeenRecord === key) return;
      await saveSettings({ lastSeenRecord: key });
      // Honour the phone's "reduce motion" choice: no animation or buzz for those who turned it on.
      const reduce = await AccessibilityInfo.isReduceMotionEnabled();
      if (!active || reduce) return;
      setCelebration(`New record! ${fresh.name} ${formatKg(fresh.wt)} kg x ${fresh.reps}`);
      Vibration.vibrate(40);
    })();
    return () => {
      active = false;
    };
  }, [sets, today]);

  const card = [styles.card, { backgroundColor: theme.card, borderColor: theme.border }];
  const heading = [styles.heading, { color: theme.text }];
  const muted = { color: theme.text, opacity: 0.65 };

  // Shares the recap card as a picture; if the phone cannot, shares the same numbers as plain text.
  // Nothing leaves the phone until the person taps Share and picks where it goes.
  const shareCard = async (ref: React.RefObject<View>, fallbackText: string, dialogTitle: string) => {
    try {
      if (ref.current && (await Sharing.isAvailableAsync())) {
        // The Share button hides itself while the picture is taken, so it is not in the picture.
        setCapturing(true);
        await new Promise((resolve) => setTimeout(resolve, 80));
        const uri = await captureRef(ref, { format: 'png', quality: 1 });
        setCapturing(false);
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle });
        return;
      }
    } catch (error) {
      setCapturing(false);
      console.error('Sharing the picture failed, sharing text instead:', error);
    }
    try {
      await Share.share({ message: fallbackText });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };
  const shareRecap = () => shareCard(recapRef, recap.text, 'Share your week');
  const shareMonth = () => shareCard(monthRef, review.text, 'Share your month');

  const heat = (level: number, future: boolean) => {
    if (future) return 'transparent';
    if (level === 0) return theme.type === 'dark' ? 'rgba(234,244,242,0.08)' : 'rgba(16,32,30,0.07)';
    const a = [0, 0.3, 0.6, 1][level];
    return theme.type === 'dark' ? `rgba(45,212,191,${a})` : `rgba(15,118,110,${a})`;
  };

  const earned = shelf.filter((b) => b.earned).length;
  const maxLoad = Math.max(1, ...loads.map((l) => l.sets));
  const AREA_COLOR: Record<string, string> = { push: '#0F766E', pull: '#3B82F6', lower: '#E0A400', core: '#A855F7' };

  return (
    <View>
      <Celebration message={celebration} onDone={() => setCelebration(null)} />
      <FirstVisitTip id="overview" text="Tap a record, a badge or a highlight to explore it. Pull down to refresh." />

      {/* Hero */}
      <View style={card}>
        <View style={styles.heroRow}>
          <View style={styles.heroCell}>
            <Ionicons name="flame" size={26} color={hero.streak > 0 ? '#F97316' : theme.text} style={{ opacity: hero.streak > 0 ? 1 : 0.35 }} />
            <Text style={[styles.heroNumber, { color: theme.text }]}>{hero.streak}</Text>
            <Text style={[styles.heroLabel, muted]}>{hero.streak === 1 ? 'week in a row' : 'weeks in a row'}</Text>
          </View>
          <View style={styles.heroCell}>
            <Ionicons name="barbell" size={26} color={theme.accent} />
            <Text style={[styles.heroNumber, { color: theme.text }]}>{hero.sessionsThisWeek}</Text>
            <Text style={[styles.heroLabel, muted]}>{hero.sessionsThisWeek === 1 ? 'session this week' : 'sessions this week'}</Text>
          </View>
          <View style={styles.heroCell}>
            <Ionicons name="trophy" size={26} color="#E0A400" />
            <Text style={[styles.heroNumber, { color: theme.text }]}>{earned}</Text>
            <Text style={[styles.heroLabel, muted]}>of {shelf.length} badges</Text>
          </View>
        </View>
        <Text style={[styles.sentence, { color: theme.text }]}>{hero.sentence}</Text>
        <TouchableOpacity
          onPress={() => update({ restWeeks: resting ? rest.filter((w) => w !== thisWeek) : [...rest, thisWeek] })}
          accessibilityRole="button"
          style={{ marginTop: 8, minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={{ color: theme.accent, fontWeight: '700' }}>
            {resting ? 'Rest week is on, your streak is safe. Tap to undo.' : 'Ill or away this week? Mark it as a rest week.'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Weekly recap */}
      <View ref={recapRef} collapsable={false} style={card}>
        <View style={styles.rowBetween}>
          <Text style={heading}>{recap.label}</Text>
          <TouchableOpacity onPress={shareRecap} accessibilityRole="button" accessibilityLabel="Share this recap" style={[styles.pill, { borderColor: theme.border, opacity: capturing ? 0 : 1 }]}>
            <Ionicons name="share-social-outline" size={16} color={theme.accent} />
            <Text style={{ color: theme.accent, fontWeight: '700', marginLeft: 6 }}>Share</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statRow}>
          <Stat value={String(recap.sessions)} label={recap.sessions === 1 ? 'session' : 'sessions'} color={theme.text} />
          <Stat value={String(recap.sets)} label="sets" color={theme.text} />
          <Stat value={recap.volume > 0 ? formatKg(recap.volume) : '0'} label="kg lifted" color={theme.text} />
          <Stat value={String(recap.records)} label={recap.records === 1 ? 'record' : 'records'} color={theme.text} />
        </View>
        {recap.topLift && (
          <Text style={[muted, { marginTop: 8 }]}>
            Heaviest: {recap.topLift.name}, {formatKg(recap.topLift.wt)} kg x {recap.topLift.reps}
          </Text>
        )}
        <Text style={{ color: theme.accent, fontWeight: '800', fontSize: 12, textAlign: 'right', marginTop: 8 }}>Urudhi</Text>
      </View>

      {/* Month in review */}
      <View ref={monthRef} collapsable={false} style={card}>
        <View style={styles.rowBetween}>
          <Text style={heading}>{review.label}{review.partial ? ' so far' : ' in review'}</Text>
          <TouchableOpacity onPress={shareMonth} accessibilityRole="button" accessibilityLabel="Share this month" style={[styles.pill, { borderColor: theme.border, opacity: capturing ? 0 : 1 }]}>
            <Ionicons name="share-social-outline" size={16} color={theme.accent} />
            <Text style={{ color: theme.accent, fontWeight: '700', marginLeft: 6 }}>Share</Text>
          </TouchableOpacity>
        </View>
        {review.sessions === 0 ? (
          <Text style={muted}>No sessions in {review.label} yet. One workout is all it takes to start the month.</Text>
        ) : (
          <>
            <View style={styles.statRow}>
              <Stat value={String(review.sessions)} label={review.sessions === 1 ? 'session' : 'sessions'} color={theme.text} />
              <Stat value={String(review.activeDays)} label="active days" color={theme.text} />
              <Stat value={formatKg(review.volume)} label="kg lifted" color={theme.text} />
              <Stat value={String(review.records)} label={review.records === 1 ? 'record' : 'records'} color={theme.text} />
            </View>
            {review.change !== null && Math.abs(review.change) >= 1 && (
              <Text style={[muted, { marginTop: 8 }]}>{Math.abs(Math.round(review.change))}% {review.change > 0 ? 'more' : 'less'} lifted than the month before.</Text>
            )}
            {review.bestLift && <Text style={[muted, { marginTop: 4 }]}>Heaviest: {review.bestLift.name}, {formatKg(review.bestLift.wt)} kg x {review.bestLift.reps}</Text>}
            {review.topMuscle && <Text style={[muted, { marginTop: 4 }]}>Most trained: {review.topMuscle}</Text>}
          </>
        )}
        <Text style={{ color: theme.accent, fontWeight: '800', fontSize: 12, textAlign: 'right', marginTop: 8 }}>Urudhi</Text>
      </View>

      {/* Goals */}
      <View style={card}>
        <Text style={heading}>Goals</Text>
        {goals.lifts.length === 0 ? (
          <>
            <Text style={muted}>A goal turns training into a game you can win. Pick a lift and a weight to aim for.</Text>
            <TouchableOpacity onPress={onFindExercises} style={[styles.goalLink, { backgroundColor: theme.buttonBackground }]}>
              <Text style={{ color: theme.buttonText, fontWeight: '800' }}>Choose an exercise</Text>
            </TouchableOpacity>
          </>
        ) : (
          goals.lifts.slice(0, 4).map((g) => {
            const p = goalProgress(g, sets, today);
            return (
              <TouchableOpacity key={g.name} onPress={() => onOpenExercise(g.name)} style={styles.goalRow} accessibilityRole="button">
                <Ring size={52} stroke={6} progress={p.pct} color={p.achieved ? '#28A745' : undefined}>
                  <Text style={{ color: theme.text, fontWeight: '800', fontSize: 12 }}>{Math.round(p.pct * 100)}%</Text>
                </Ring>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: theme.text, fontWeight: '800' }} numberOfLines={1}>{g.name}</Text>
                  <Text style={[muted, { fontSize: 13 }]} numberOfLines={2}>{p.sentence}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.text} />
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Consistency */}
      <View style={card}>
        <Text style={heading}>Consistency</Text>
        <Text style={[muted, { marginBottom: 10 }]}>The last 12 weeks. Darker means more lifted that day.</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <View style={{ marginRight: 6, justifyContent: 'space-between' }}>
            {WEEKDAYS.map((d, i) => (
              <Text key={i} style={[styles.dayLetter, muted]}>{d}</Text>
            ))}
          </View>
          {grid.map((col, w) => (
            <View key={w} style={{ marginRight: w === grid.length - 1 ? 0 : 4 }}>
              {col.map((cell, i) => (
                <View
                  key={i}
                  accessible
                  accessibilityLabel={`${shortDate(cell.d)}: ${cell.sessions === 0 ? 'no workout' : `${cell.sessions} workout`}`}
                  style={[styles.cell, { backgroundColor: heat(cell.level, cell.future), marginBottom: i === 6 ? 0 : 4 }]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Records and most improved */}
      {(records.length > 0 || improved) && (
        <View style={card}>
          <Text style={heading}>Highlights</Text>
          {improved && (
            <TouchableOpacity onPress={() => onOpenExercise(improved.name)} style={[styles.highlight, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="rocket" size={22} color={theme.accent} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: theme.text, fontWeight: '800' }}>Most improved: {improved.name}</Text>
                <Text style={muted}>
                  Up {Math.round(improved.pct)}% in 2 months, {formatKg(improved.from)} to {formatKg(improved.to)} {metricUnit(improved.metric)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.text} />
            </TouchableOpacity>
          )}
          {records.map((r) => (
            <TouchableOpacity key={`${r.name}${r.d}`} onPress={() => onOpenExercise(r.name)} style={styles.recordRow}>
              <Ionicons name="trophy" size={20} color="#E0A400" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '700' }} numberOfLines={1}>{r.name}</Text>
                <Text style={muted}>{shortDate(r.d)}</Text>
              </View>
              <Text style={{ color: theme.accent, fontWeight: '800' }}>{formatKg(r.wt)} kg x {r.reps}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {plateau && (
        <TouchableOpacity onPress={() => onOpenExercise(plateau.name)} style={[card, { backgroundColor: theme.accentSoft }]} accessibilityRole="button">
          <Text style={heading}>A little stuck on {plateau.name}?</Text>
          <Text style={{ color: theme.text, lineHeight: 20 }}>It has not gone up in about 4 weeks, which happens to everyone. {plateau.tip}</Text>
        </TouchableOpacity>
      )}

      {/* Best lifts and body weight */}
      <ProgressHighlights />

      {/* Muscle balance */}
      <View style={card}>
        <Text style={heading}>Muscle balance</Text>
        <Text style={[muted, { marginBottom: 10 }]}>Sets per muscle in the last 30 days.</Text>
        <BodyMap loads={loads} />
        <Text style={[styles.sentence, { color: theme.text, marginTop: 12 }]}>{balanceSentence(loads)}</Text>
        {loads.slice(0, 6).map((l) => (
          <View key={l.muscle} style={styles.barRow}>
            <Text style={[styles.barName, { color: theme.text }]}>{l.muscle[0].toUpperCase() + l.muscle.slice(1)}</Text>
            <View style={[styles.barTrack, { backgroundColor: theme.accentSoft }]}>
              <View style={{ width: `${Math.max(6, (l.sets / maxLoad) * 100)}%`, height: 10, borderRadius: 5, backgroundColor: AREA_COLOR[AREA_OF[l.muscle] ?? 'push'] }} />
            </View>
            <Text style={[styles.barValue, { color: theme.text }]}>{l.sets}</Text>
          </View>
        ))}
      </View>

      {/* Why I started */}
      <View style={card}>
        <View style={styles.rowBetween}>
          <Text style={heading}>Why I started</Text>
          <TouchableOpacity onPress={() => setEditingWhy(true)} accessibilityRole="button" style={[styles.pill, { borderColor: theme.border }]}>
            <Ionicons name="create-outline" size={16} color={theme.accent} />
            <Text style={{ color: theme.accent, fontWeight: '700', marginLeft: 6 }}>{goals.why ? 'Edit' : 'Write it'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={goals.why ? { color: theme.text, fontSize: 16, lineHeight: 23, fontStyle: 'italic' } : muted}>
          {goals.why || 'Write down, in a line or two, why you are doing this. It will be here for the days you need a reminder.'}
        </Text>
      </View>

      {/* Badges */}
      <View style={card}>
        <Text style={heading}>Milestones</Text>
        <Text style={[muted, { marginBottom: 10 }]}>Quiet little rewards for showing up. Tap one to see what it takes.</Text>
        <View style={styles.badgeWrap}>
          {shelf.map((b) => (
            <TouchableOpacity
              key={b.id}
              onPress={() => Alert.alert(b.title, b.earned ? 'Earned. Well done!' : `${b.hint}.\nYou are at ${b.progress}.`)}
              accessibilityRole="button"
              accessibilityLabel={`${b.title}, ${b.earned ? 'earned' : b.progress}`}
              style={styles.badge}
            >
              <View style={[styles.badgeCircle, { backgroundColor: b.earned ? theme.accentSoft : 'transparent', borderColor: b.earned ? theme.accent : theme.border }]}>
                <Ionicons name={b.icon as any} size={26} color={b.earned ? theme.accent : theme.text} style={{ opacity: b.earned ? 1 : 0.25 }} />
              </View>
              <Text style={{ color: theme.text, fontSize: 11, textAlign: 'center', opacity: b.earned ? 1 : 0.55, marginTop: 4 }} numberOfLines={2}>{b.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <SimpleEditor
        visible={editingWhy}
        title="Why I started"
        hint="A line or two for the hard days. It stays on this phone."
        initial={goals.why}
        placeholder="For my health, for my kids, to feel strong..."
        onSave={(v) => {
          update({ why: v });
          setEditingWhy(false);
        }}
        onClose={() => setEditingWhy(false)}
      />

      <TouchableOpacity onPress={onFindExercises} style={[styles.linkButton, { backgroundColor: theme.buttonBackground }]}>
        <Text style={{ color: theme.buttonText, fontWeight: '800', fontSize: 16 }}>See each exercise</Text>
      </TouchableOpacity>
    </View>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ color, fontSize: 22, fontWeight: '900' }}>{value}</Text>
      <Text style={{ color, opacity: 0.65, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 14 },
  heading: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12, minHeight: 36 },
  heroRow: { flexDirection: 'row' },
  heroCell: { flex: 1, alignItems: 'center' },
  heroNumber: { fontSize: 30, fontWeight: '900', marginTop: 2 },
  heroLabel: { fontSize: 12, textAlign: 'center' },
  sentence: { fontSize: 15, lineHeight: 21, marginTop: 12 },
  statRow: { flexDirection: 'row', marginTop: 6 },
  cell: { width: 18, height: 18, borderRadius: 5 },
  dayLetter: { fontSize: 11, height: 18, lineHeight: 18, marginBottom: 4 },
  highlight: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, marginTop: 6, marginBottom: 6 },
  recordRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, minHeight: 48 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  barName: { width: 90, fontSize: 13 },
  barTrack: { flex: 1, height: 10, borderRadius: 5, marginHorizontal: 8 },
  barValue: { width: 28, textAlign: 'right', fontSize: 13, fontWeight: '700' },
  badgeWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  badge: { width: '20%', alignItems: 'center', marginBottom: 12, minHeight: 48 },
  badgeCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  goalLink: { borderRadius: 16, paddingVertical: 12, alignItems: 'center', marginTop: 10, minHeight: 44, justifyContent: 'center' },
  goalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, minHeight: 56 },
  linkButton: { borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginBottom: 20 },
});
