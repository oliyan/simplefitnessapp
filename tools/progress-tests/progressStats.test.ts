// Run with:  node -r sucrase/register tools/progress-tests/progressStats.test.ts
import assert from 'assert';
import {
  estimate1RM, exerciseSeries, insightFor, heroSummary, consistencyGrid, mostImproved, badges, muscleLoads,
  balanceSentence, weeklyRecap, formatLifted, formatKg, inFrame, trendLine, exerciseSummaries, ProgSet, ProgSession,
} from '../../utils/progressStats';

const day = (y: number, m: number, d: number) => Math.floor(new Date(y, m - 1, d).getTime() / 1000);
const TODAY = new Date(2026, 9, 21); // Wed 21 Oct 2026
let logId = 0;
const sessions: ProgSession[] = [];
const sets: ProgSet[] = [];
const add = (d: number, name: string, muscle: string, rows: [number, number][]) => {
  let s = sessions.find((x) => x.d === d);
  if (!s) { s = { logId: ++logId, d, name: 'Plan', day: 'Day', durationSec: 3000 }; sessions.push(s); }
  rows.forEach(([wt, reps], i) => sets.push({ d, name, wt, reps, setNo: i + 1, logId: s!.logId, muscle }));
};
// Bench and rows every Monday for 6 weeks, rising 40 -> 50; one plank-only day.
// Simple explicit data: Mondays 14 Sep, 21 Sep, 28 Sep, 5 Oct, 12 Oct, 19 Oct
const mondays = [day(2026, 9, 14), day(2026, 9, 21), day(2026, 9, 28), day(2026, 10, 5), day(2026, 10, 12), day(2026, 10, 19)];
mondays.forEach((d, i) => {
  add(d, 'Bench Press', 'chest', [[40 + 2 * i, 8], [40 + 2 * i, 8], [40 + 2 * i, 6]]);
  add(d, 'Barbell Row', 'back', [[30, 10], [30, 10]]);
});
add(day(2026, 10, 20), 'Plank', 'abs', [[0, 40], [0, 45]]);

// --- maths
assert.strictEqual(estimate1RM(100, 1), 100);
assert.strictEqual(estimate1RM(60, 10), 80);
assert.strictEqual(estimate1RM(0, 10), 0);
assert.strictEqual(estimate1RM(50, 0), 0);
assert.strictEqual(formatLifted(1200), '1,200 kg');
assert.strictEqual(formatLifted(8400), '8.4 tonnes');
assert.strictEqual(formatKg(42.5), '42.5');
assert.strictEqual(formatKg(1234.4), '1,234');

// --- series
const bench = exerciseSeries(sets, 'Bench Press', 'e1rm');
assert.strictEqual(bench.length, 6);
assert.ok(bench[5].v > bench[0].v);
assert.strictEqual(bench[0].isRecord, false, 'first session is a baseline, not a record');
assert.ok(bench.slice(1).every((p) => p.isRecord));
assert.strictEqual(exerciseSeries(sets, 'Bench Press', 'weight')[5].v, 50);
assert.strictEqual(exerciseSeries(sets, 'Bench Press', 'volume')[0].v, 40 * 8 + 40 * 8 + 40 * 6);
const plank = exerciseSeries(sets, 'Plank', 'reps');
assert.strictEqual(plank.length, 1);
assert.strictEqual(plank[0].v, 45);
assert.strictEqual(exerciseSeries(sets, 'Nothing', 'e1rm').length, 0);

// --- frames and trend
assert.strictEqual(inFrame(bench, '4w', TODAY).length, 4); // 28 days back from 21 Oct = 23 Sep: four Mondays
assert.strictEqual(inFrame(bench, 'all', TODAY).length, 6);
const tl = trendLine(bench)!;
assert.ok(tl[1] > tl[0]);
assert.strictEqual(trendLine(bench.slice(0, 2)), null);

// --- insight sentences
assert.match(insightFor(bench, 'e1rm'), /^Up \d+% in 5 weeks\. Best: /);
assert.match(insightFor([], 'e1rm'), /Nothing logged/);
assert.match(insightFor(bench.slice(0, 1), 'e1rm'), /One session so far/);
const dip = [{ ...bench[0], v: 100 }, { ...bench[1], v: 80 }];
assert.match(insightFor(dip, 'e1rm'), /Down 20%.*lighter spell is normal/);
const flat = [{ ...bench[0], v: 100 }, { ...bench[1], v: 100 }];
assert.match(insightFor(flat, 'e1rm'), /Holding steady/);
assert.ok(!/[–—]/.test(insightFor(bench, 'e1rm')), 'no dashes');

// --- hero
const hero = heroSummary(sessions, sets, TODAY);
assert.strictEqual(hero.streak, 6, 'six Mondays in six weeks in a row');
assert.strictEqual(hero.sessionsThisWeek, 2); // Mon 19 and Tue 20
assert.ok(hero.volume30 > 0 && hero.volumePrev30 > 0);
assert.match(hero.sentence, /lifted/);
assert.match(heroSummary([], [], TODAY).sentence, /No weight logged/);

// --- consistency grid
const grid = consistencyGrid(sessions, sets, TODAY, 12);
assert.strictEqual(grid.length, 12);
assert.ok(grid.every((c) => c.length === 7));
assert.strictEqual(grid[11][0].d, day(2026, 10, 19));
assert.ok(grid[11][0].sessions === 1 && grid[11][0].level > 0);
assert.ok(grid[11][5].future, 'Saturday after Wednesday is in the future');
assert.strictEqual(grid[0].every((c) => c.level === 0), true);

// --- most improved
const mi = mostImproved(sets, TODAY)!;
assert.strictEqual(mi.name, 'Bench Press');
assert.ok(mi.pct > 3);
assert.strictEqual(mostImproved(sets.filter((s) => s.name === 'Barbell Row'), TODAY), null, 'flat lifts are not improved');

// --- muscles
const loads = muscleLoads(sets, TODAY, 30);
assert.strictEqual(loads.find((l) => l.muscle === 'chest')!.sets, 15); // five Mondays fall in the last 30 days, three sets each
assert.match(balanceSentence([{ muscle: 'chest', sets: 20 }, { muscle: 'back', sets: 4 }, { muscle: 'legs', sets: 6 }]), /Push work is well ahead/);
assert.match(balanceSentence([{ muscle: 'chest', sets: 8 }, { muscle: 'back', sets: 8 }, { muscle: 'legs', sets: 8 }]), /balanced/);
assert.match(balanceSentence([{ muscle: 'chest', sets: 3 }]), /a few more sessions/);
assert.match(balanceSentence([{ muscle: 'chest', sets: 10 }, { muscle: 'back', sets: 10 }]), /No leg work/);

// --- badges
const b = badges(sessions, sets, TODAY);
assert.strictEqual(b.length, 10);
const by = (id: string) => b.find((x) => x.id === id)!;
assert.ok(by('first').earned && !by('ten').earned && by('streak4').earned && !by('streak8').earned);
assert.ok(by('record').earned);
assert.strictEqual(by('ten').progress, '7 of 10');
assert.ok(badges([], [], TODAY).every((x) => !x.earned));

// --- recap
const recap = weeklyRecap(sessions, sets, TODAY, 'Urudhi');
assert.strictEqual(recap.label, 'This week');
assert.strictEqual(recap.sessions, 2);
assert.match(recap.text, /^This week on Urudhi\n2 sessions/);
assert.ok(recap.topLift && recap.topLift.name === 'Bench Press');
const idle = weeklyRecap(sessions.filter((s) => s.d < day(2026, 10, 19)), sets.filter((s) => s.d < day(2026, 10, 19)), TODAY);
assert.strictEqual(idle.label, 'Last week');
assert.ok(!/[–—]/.test(recap.text));

// --- exercise list
const list = exerciseSummaries(sets);
assert.strictEqual(list.length, 3);
assert.strictEqual(list[0].name, 'Plank', 'most recently trained first');
assert.strictEqual(list.find((l) => l.name === 'Plank')!.metric, 'reps');
assert.strictEqual(list.find((l) => l.name === 'Bench Press')!.spark.length, 6);

console.log('progressStats: all checks passed');
