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

## My Progress, Home and motivation: built

Status: **built**. What exists is described in the README (Feature tour and "Goals, streaks and motivation"). Test cases: `HOM-xx`, `PRG-xx` and `GOL-xx` in `docs/TEST_CASES.md`. The number crunching is checked by the scripts in `tools/progress-tests/`, and `tools/sample-data/make_sample_db.py` makes a believable history to look at it with.

Done: Overview, Exercises, Charts (grouped by question) and History tabs; a page per exercise with a scrub chart, goal, comparison with the period before and stall tips; goals per lift with a dotted target line; a weekly goal that follows the plan; rest weeks; welcome back; next badge; "why I started"; month in review; a thinner Home that points into Progress; a richer finish screen; cached progress data; colour-blind safe colours; picture sharing that only happens when you tap Share.

Still open:

- `screens/GraphsWorkoutDetails.tsx` is still about 4,000 lines. The ribbon, time frame buttons, help button and sentence are now small components in `components/progress/charts/`, but the chart renderers and their data code are still in the one file. Split them one chart at a time.
- Coach voice for the Home and Progress cards in builds that have one (the card text is neutral today; only the note at the top of Home uses the sender's voice).
- Watch real use: show it to 3 people who are not into fitness apps and see where they pause.
- Ideas not built: progress photos (decided against for now), a weekly challenge, plateau tips that use the person's own notes.
