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
