# To do

Things we agreed to do later. Nothing here is started.

## Host the exercise video list outside the app

The list ships inside the app (`data/exercise-videos.json`) and the app already knows how to fetch a newer copy: set `VIDEO_LIST_URL` in `config/videoList.ts`. What is left is to create a small **public** repo (or gist) that holds only that JSON file, and paste its raw URL there. The repo itself can go private later without breaking this, because the list lives elsewhere.

## Grow and re-check the video list

- 29 of the 30 entries have been checked by title; 10 also by subtitles. Read the subtitles of the rest when YouTube allows it (one request every 10 seconds or slower, in small batches). See `docs/VIDEO_RESEARCH.md`.
- Replace the weak cool-down clip with a better routine of 2 minutes or less.
- Re-check that every link is alive every few months (`https://www.youtube.com/oembed?format=json&url=<link>` returns 200).
- Add exercises as new plans bring them in.

## Other ideas that came up

- Show the video link on the exercise name in the plan editor too.
