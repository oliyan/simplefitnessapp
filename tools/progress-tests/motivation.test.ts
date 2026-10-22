// Run with:  node -r sucrase/register tools/progress-tests/motivation.test.ts
import assert from 'assert';
import {
  normaliseGoals, DEFAULT_GOALS, weeklyTarget, goalProgress, streakGuard, comeback, nextMilestone, findPlateau,
  pickHomeCard, homeInsight, checklistSteps, monthReview, reviewMonthFor, weekKey, LiftGoal,
} from '../../utils/motivation';
import { weeklyStreak } from '../../utils/dashboardStats';
import { badges, ProgSet, ProgSession } from '../../utils/progressStats';

const day = (y: number, m: number, d: number) => Math.floor(new Date(y, m - 1, d).getTime() / 1000);
const WED = new Date(2026, 9, 21); // Wed 21 Oct 2026
const THU = new Date(2026, 9, 22);
const SUN = new Date(2026, 9, 25);
const NOPE = /[–—]/;

let id = 0;
const sessions: ProgSession[] = [];
const sets: ProgSet[] = [];
const add = (d: number, name: string, muscle: string, rows: [number, number][]) => {
  let s = sessions.find((x) => x.d === d);
  if (!s) { s = { logId: ++id, d, name: 'Plan', day: 'Day', durationSec: 3000 }; sessions.push(s); }
  rows.forEach(([wt, reps], i) => sets.push({ d, name, wt, reps, setNo: i + 1, logId: s!.logId, muscle }));
};

// --- stored state is repaired, not trusted
assert.deepStrictEqual(normaliseGoals(undefined), DEFAULT_GOALS);
assert.deepStrictEqual(normaliseGoals('junk'), DEFAULT_GOALS);
const messy = normaliseGoals({ weeklySessions: 9, why: 5, lifts: [{ name: 'Bench', target: 60 }, { target: 5 }, null], restWeeks: ['x', 100], checklistHidden: 'yes' });
assert.strictEqual(messy.weeklySessions, null, 'out of range number is dropped');
assert.strictEqual(messy.why, '');
assert.strictEqual(messy.lifts.length, 1);
assert.deepStrictEqual(messy.restWeeks, [100]);
assert.strictEqual(messy.checklistHidden, false);
assert.strictEqual(normaliseGoals({ weeklySessions: 3 }).weeklySessions, 3);

// --- weekly target follows the plan unless the person set one
assert.strictEqual(weeklyTarget(3, null), 3);
assert.strictEqual(weeklyTarget(3, 4), 4);
assert.strictEqual(weeklyTarget(0, null), 0);

// --- streak with rest weeks: Mondays 28 Sep, 5 Oct, 12 Oct, 19 Oct all trained = 4
const mondays = [day(2026, 9, 28), day(2026, 10, 5), day(2026, 10, 12), day(2026, 10, 19)];
mondays.forEach((d, i) => add(d, 'Bench Press', 'chest', [[40 + i, 8], [40 + i, 8], [40 + i, 6]]));
const rows = sessions.map((s) => ({ workout_log_id: s.logId, workout_date: s.d, workout_name: 'P', day_name: 'D', logged: 1 }));
assert.strictEqual(weeklyStreak(rows, WED), 4);
const skipOct5 = rows.filter((r) => r.workout_date !== day(2026, 10, 5));
assert.strictEqual(weeklyStreak(skipOct5, WED), 2, 'a missed week breaks it');
assert.strictEqual(weeklyStreak(skipOct5, WED, [day(2026, 10, 5)]), 3, 'a rest week holds it without counting');
assert.strictEqual(weeklyStreak(rows, new Date(2026, 9, 28), [day(2026, 10, 26)]), 4, 'a rest week now keeps the streak');

// --- streak guard
const noThisWeek = sessions.filter((s) => s.d < day(2026, 10, 19));
assert.strictEqual(streakGuard(sessions, SUN, []), null, 'already trained this week');
assert.strictEqual(streakGuard(noThisWeek, WED, []), null, 'Wednesday is early enough');
const g = streakGuard(noThisWeek, THU, [])!;
assert.strictEqual(g.daysLeft, 4);
assert.match(g.message, /^4 days left this week\. One session keeps your 3 week streak\.$/);
assert.match(streakGuard(noThisWeek, SUN, [])!.message, /^Last day of the week/);
assert.strictEqual(streakGuard(noThisWeek, THU, [day(2026, 10, 19)]), null, 'rest week set');
assert.strictEqual(streakGuard([], THU, []), null);

// --- comeback
assert.strictEqual(comeback(sessions, WED), null, 'trained two days ago');
const later = new Date(2026, 10, 12); // 24 days after 19 Oct
assert.match(comeback(sessions, later)!.message, /^Welcome back! Start a little lighter/);
assert.match(comeback(sessions, new Date(2026, 9, 31))!.message, /short break is nothing/);
assert.match(comeback(sessions, new Date(2026, 11, 30))!.message, /long break/);
assert.strictEqual(comeback([], WED), null);
assert.ok(!NOPE.test(comeback(sessions, later)!.message));

// --- lift goals
const goal: LiftGoal = { name: 'Bench Press', target: 50, by: day(2026, 12, 31), createdAt: day(2026, 9, 1), startValue: 38 };
const gp = goalProgress(goal, sets, WED); // best 43
assert.strictEqual(gp.best, 43);
assert.ok(Math.abs(gp.pct - 5 / 12) < 1e-9);
assert.strictEqual(gp.achieved, false);
assert.strictEqual(gp.weeksLeft, 11); // 71 days, rounded up
assert.strictEqual(gp.pace, 'on');
assert.match(gp.sentence, /^43 of 50 kg, 42% of the way\. 11 weeks left, on track\.$/);
const behind = goalProgress({ ...goal, createdAt: day(2026, 8, 1), by: day(2026, 11, 15) }, sets, WED);
assert.strictEqual(behind.pace, 'behind');
assert.match(behind.sentence, /a little behind, still within reach\.$/);
const done = goalProgress({ ...goal, target: 40 }, sets, WED);
assert.ok(done.achieved && done.pct === 1);
assert.match(done.sentence, /^Goal reached: 43 kg on Bench Press\. Well done!$/);
const noDate = goalProgress({ ...goal, by: null }, sets, WED);
assert.strictEqual(noDate.pace, 'none');
assert.ok(!/left/.test(noDate.sentence));
const past = goalProgress({ ...goal, by: day(2026, 10, 1) }, sets, WED);
assert.match(past.sentence, /date has passed, and it is fine to move it/);
assert.strictEqual(goalProgress({ ...goal, name: 'Nothing' }, sets, WED).best, 0);

// --- milestones
const eight: ProgSession[] = Array.from({ length: 8 }, (_, i) => ({ logId: i + 100, d: day(2026, 9, 1) + i * 86400, name: 'P', day: 'D', durationSec: null }));
const m = nextMilestone(badges(eight, [], WED))!;
assert.strictEqual(m.badge.id, 'ten');
assert.strictEqual(m.message, '2 more sessions to the "10 sessions" badge.');
assert.strictEqual(nextMilestone(badges([], [], WED)), null, 'nothing is close with no history');

// --- plateau: squat flat for 4 weeks while trained 3 times
const flat: ProgSet[] = [];
let fid = 500;
[day(2026, 8, 28), day(2026, 9, 7), day(2026, 9, 28), day(2026, 10, 5), day(2026, 10, 12), day(2026, 10, 19)].forEach((d) => {
  fid++;
  flat.push({ d, name: 'Squat', wt: 50, reps: 8, setNo: 1, logId: fid, muscle: 'legs' });
});
const pl = findPlateau(flat, WED)!;
assert.strictEqual(pl.name, 'Squat');
assert.ok(pl.tip.length > 20 && !NOPE.test(pl.tip));
assert.strictEqual(findPlateau(flat, WED, { Squat: day(2026, 11, 20) }), null, 'hidden for a while');
assert.strictEqual(findPlateau(sets, WED), null, 'a rising bench is not a plateau');

// --- the one card
const guardSessions: ProgSession[] = [...noThisWeek, { logId: 900, d: day(2026, 10, 16), name: 'Plan', day: 'Day', durationSec: 3000 }]; // trained last Friday
const baseGoals = { ...DEFAULT_GOALS };
assert.strictEqual(pickHomeCard({ sessions: [], sets: [], today: WED, goals: baseGoals, doneToday: false }), null);
assert.strictEqual(pickHomeCard({ sessions, sets, today: later, goals: baseGoals, doneToday: false })!.kind, 'comeback');
assert.strictEqual(pickHomeCard({ sessions: guardSessions, sets, today: THU, goals: baseGoals, doneToday: false })!.kind, 'guard');
assert.strictEqual(pickHomeCard({ sessions: guardSessions, sets, today: THU, goals: { ...baseGoals, restWeeks: [day(2026, 10, 19)] }, doneToday: false })!.kind, 'rested');
const nearGoal = { ...baseGoals, lifts: [{ ...goal, target: 44, startValue: 38 }] };
assert.strictEqual(pickHomeCard({ sessions, sets, today: WED, goals: nearGoal, doneToday: false })!.kind, 'goal');
assert.notStrictEqual(pickHomeCard({ sessions: guardSessions, sets, today: THU, goals: baseGoals, doneToday: true })?.kind, 'guard', 'no guard once today is done');
const why = pickHomeCard({ sessions: sessions.slice(0, 1), sets: sets.slice(0, 3), today: new Date(2026, 9, 2), goals: { ...baseGoals, why: 'For my kids' }, doneToday: false });
assert.ok(why !== null);

// --- home insight
assert.ok(homeInsight(sessions, sets, WED, []).length > 10);
assert.ok(!NOPE.test(homeInsight(sessions, sets, WED, [])));

// --- checklist
const steps = checklistSteps({ plans: 1, scheduled: 0, logged: 0, visitedProgress: false });
assert.deepStrictEqual(steps.map((s) => s.done), [true, false, false, false]);

// --- month review
assert.deepStrictEqual(reviewMonthFor(new Date(2026, 9, 3)), { year: 2026, month: 8 }, 'first days show last month');
assert.deepStrictEqual(reviewMonthFor(new Date(2026, 0, 2)), { year: 2025, month: 11 }, 'January looks back to December');
assert.deepStrictEqual(reviewMonthFor(WED), { year: 2026, month: 9 });
const mr = monthReview(sessions, sets, WED, 2026, 9);
assert.strictEqual(mr.label, 'October');
assert.strictEqual(mr.partial, true);
assert.strictEqual(mr.key, '2026-10');
assert.strictEqual(mr.sessions, 3);
assert.strictEqual(mr.topMuscle, 'chest');
assert.strictEqual(mr.bestLift!.wt, 43);
assert.match(mr.text, /^October so far on Urudhi\n3 sessions on 3 days\n/);
assert.ok(!NOPE.test(mr.text));
assert.strictEqual(monthReview(sessions, sets, new Date(2026, 10, 2), 2026, 9).partial, false);
assert.strictEqual(monthReview([], [], WED, 2026, 9).sessions, 0);
assert.strictEqual(weekKey(WED), day(2026, 10, 19));

console.log('motivation: all checks passed');
