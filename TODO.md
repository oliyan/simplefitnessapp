# To do

Things we agreed to do later. Nothing here is started except where a heading says so.

## Keep the hosted video list in step (hosted already)

`VIDEO_LIST_URL` in `config/videoList.ts` points at the public repo oliyan/urudhi-data (the same JSON file). To fix or add a link, edit the file there; the app picks it up the next time it opens online. Keep `data/exercise-videos.json` in this repo in step with it. This repo can go private without breaking anything.

## Grow and re-check the video list

- 29 of the 30 entries have been checked by title; 10 also by subtitles. Read the subtitles of the rest when YouTube allows it (one request every 10 seconds or slower, in small batches). See `docs/VIDEO_RESEARCH.md`.
- Replace the weak cool-down clip with a better routine of 2 minutes or less.
- Re-check that every link is alive every few months (`https://www.youtube.com/oembed?format=json&url=<link>` returns 200).
- Add exercises as new plans bring them in.

## Other ideas that came up

- Show the video link on the exercise name in the plan editor too.

## My Progress page: make it welcoming and fun (design brief)

Status: **proposal, nothing built.** Written after reading `screens/GraphsWorkoutDetails.tsx` (about 4,000 lines), `components/ProgressHighlights.tsx` and `screens/MyProgress.tsx`.

### What is wrong today

1. **It is a chart tool, not a progress page.** Opening the tab lands on a mode ribbon (Exercise, Workout, Overall stats), then a "Metric" row, then a chart, an explanation box, a "Time Frame" row, up to three dropdowns (workout, day, exercise), a tip, and only at the very bottom the best lifts, body weight and the "View Logs" button. A newcomer has to build a question before seeing any answer.
2. **The nice parts are buried.** Best lifts and body weight, the most motivating things, sit under everything.
3. **Jargon.** "CES", "1RM", "Sets graph", "Muscle distribution", "Overall muscle groups", "Day volume". Nothing says what the number means for the person.
4. **Too many choices at once.** Nine metric and chart types, four time frames, three dropdowns, all visible together.
5. **The chart does not talk.** No sentence like "up 12 percent in 8 weeks". The only summary is a small percentage next to the title. Tapping tiny dots is the only way to get detail.
6. **A permanent explanation box** under every chart takes space and is read once.
7. **No sense of reward.** No streak, no calendar of effort, no milestones, no celebration of a personal best here.
8. **Thin data is awkward.** With one or two sessions a line chart shows almost nothing and nothing explains why.
9. **Naming and navigation are confusing.** The tab is "My Progress", the log list inside is titled "Logs", and "View Logs" is a button at the bottom of a long scroll. Deleting logs is a hidden long-press.
10. **Maintenance.** One 4,000 line file with the three modes copy-pasted, so every improvement is expensive.

### The idea

Answer questions first, charts second. Three layers: **Overview** (feel good, 10 seconds), **Explore** (pick one thing, see it clearly), **History** (the raw logs).

### Phase 1: quick wins (small, mostly text and order)

- Move **Best lifts** and **Body weight** to the top, above the chart controls.
- Plain names with a one-line meaning: CES becomes "Effort score", 1RM becomes "Estimated max", Sets graph becomes "Each set", Time becomes "Duration". Keep the old term in the info text.
- Replace the permanent explanation box with an **(i) button** that opens it.
- Add one **plain sentence under every chart**: "Up 12% in 8 weeks. Best: 40 kg on 3 March." Same for dips: "Down this month, a lighter week is normal."
- **Smart defaults:** open on the exercise most recently trained, with the metric that fits it (estimated max for loaded lifts, reps for bodyweight, duration for cardio). Default time frame 3 months, not "month".
- Put the **time frame chips directly above the chart**, and make them a compact segmented control.
- **Better empty and thin-data states:** a friendly picture and "Log 3 workouts and your graphs appear here", plus a faded sample chart. With one or two points show the numbers as big text instead of a lonely line.
- Visible **"History"** entry (a tab or segment) instead of a bottom button; rename "Logs" to "History" everywhere.

### Phase 2: an Overview that feels good

- **Hero strip:** current streak (weeks), sessions this week against the plan, and this month's total weight lifted with the change against last month, in one friendly sentence ("You lifted 8.4 tonnes this month, 15% more than last month").
- **Consistency calendar:** a small heatmap of the last 12 weeks (darker = more work). It rewards showing up, which is what matters for beginners.
- **Recent personal records** as cards with a trophy, tap to see the exercise.
- **Most improved** lift this month.
- **Milestones and badges:** first workout, 10 and 25 sessions, first full week, 4 week streak, 1 tonne and 10 tonnes lifted, first bodyweight rep milestone. A calm badge shelf, not a game that nags.
- **Weekly recap card:** "Your week in numbers", shareable as an image (WhatsApp, Instagram), no personal data beyond what the person chooses. A monthly version later.
- Optional, AI builds only: a two sentence "coach's read of your month" using the same voice settings as the advice.
- Celebrate on open: a small confetti or glow the first time a new personal record is seen, with a light haptic. Respect a "reduce motion" setting.

### Phase 3: Explore that is easy to use

- Replace the three dropdowns with **one searchable exercise list**. Each row shows the name, last value, a tiny sparkline and the change. Tapping opens a clean detail page with the chart. This is the biggest simplification.
- **Chart interaction:** drag a finger to scrub values (no tiny dots), highlight personal records, show a faint trend line, mark missed weeks as gaps, show the planned target as a dotted line when one exists. Tooltip shows date, weight, reps and the session.
- **Compare:** "this month against last month", and for body weight "since you started".
- **Muscle balance** as a front and back **body map coloured by volume** instead of pie or bar charts, with a plain line such as "Push and pull are balanced" or "Hamstrings got little work this month".
- Group the nine chart types into two or three friendly questions: "Am I getting stronger?" (estimated max, each set), "Am I doing enough?" (volume, sessions, time), "Am I balanced?" (muscles, days).
- Weight unit switch (kg and lb) applied everywhere, and neat number formatting (1,250 kg, not 1250.0000).

### Phase 4: polish and care

- Skeleton loaders instead of a spinner; pull to refresh; smooth transitions between exercises.
- Large tap targets (at least 44 dp), readable sizes, good contrast in both themes, **colour-blind safe** set colours, and a text summary of each chart for screen readers.
- Light tooltips on first visit only ("Drag along the line to see each session").
- Friendly microcopy in the app's voice. In Anu's build the same screens use her coach's voice (set in the build files, never in main).
- Visible actions for deleting logs (a menu on each row), not only long-press.

### Under the hood

- Split `GraphsWorkoutDetails.tsx` into one component per chart plus shared pieces (chart frame, time frame chips, empty state). The three modes repeat the same block today.
- One data hook per question with caching, so tab switches are instant.
- Check long histories (a year of logs) stay smooth; sample points if needed.

### Order and how to know it worked

1. Phase 1 first (about 2 days), because it needs no new data.
2. Phase 2 next, because it is what makes the page feel rewarding.
3. Phase 3 is the largest change; do it behind the new Overview so the old charts stay available until it is ready.
4. Show the new version to **3 people who are not into fitness apps** and watch where they pause. Success: they can say how they are doing within 10 seconds, find a specific exercise's chart in 2 taps, and nobody asks what "CES" is.

### Open questions

- Which unit comes first for the default (kg only today)?
- Do we want sharing (images leaving the phone) in the open-source app, or only an opt-in button?
- Badges: calm and few, or a bigger game layer?
