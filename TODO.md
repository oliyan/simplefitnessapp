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

## My Progress page: make it welcoming and fun

Status: **built** (Overview, Exercises, Charts and History tabs, a page per exercise). Test cases are `PRG-xx` in `docs/TEST_CASES.md` (section 10); the number crunching is checked by `node -r sucrase/register tools/progress-tests/progressStats.test.ts`; `tools/sample-data/make_sample_db.py` makes a believable history to look at it with.

Done from the original brief:

- Overview first: streak, sessions this week, badges, a plain sentence about the last 30 days, the week recap (shareable as a picture), a 12 week consistency grid, most improved and recent records, best lifts and body weight (moved up from the bottom), muscle balance with a front and back body map, ten calm milestones, a one-time celebration for a new record (off when the phone has "Remove animations" on).
- Exercises: one searchable list with a tiny trend line and percent for each, muscle filter chips, and a page per exercise with a switch between estimated max, heaviest set and total lifted, time frame chips, a scrub chart (drag a finger), gold record dots, a trend line, faint dotted lines for breaks of two weeks or more, a plain sentence, a comparison with the period before, tiles, last session set by set, and records.
- Charts tab keeps the full tools with plain names (Estimated max, Effort score, Each set, Duration), time frame buttons above the chart with 3 months as the default, the explanation behind an (i) button, a sentence under the chart, an opening view of the most recently trained lift, and colour-blind safe colours.
- History tab with a visible delete button on each plan, friendly empty states, skeleton loaders, pull to refresh, one-time hints, 44 dp tap targets, screen reader labels.
- Decisions: kg only, share is opt-in (the person taps Share and picks where it goes), badges stay calm and few.

Still open:

- A dotted target line on a chart "when one exists": the app has no target weight per exercise to draw, so it needs a target concept first.
- Group the Charts tab's nine chart types into two or three friendly questions ("Am I getting stronger?", "Am I doing enough?", "Am I balanced?").
- Split `screens/GraphsWorkoutDetails.tsx` (about 4,000 lines, the three modes repeat the same block) into one component per chart plus shared pieces, and cache the data between tab switches.
- Coach voice for the progress text in builds that have one (the text is neutral today).
- Watch real use: show it to 3 people who are not into fitness apps and see where they pause.
