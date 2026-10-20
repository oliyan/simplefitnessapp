# To do

Things we agreed to do later. Nothing here is started.

## Exercise videos for the main app's plans

Anu's private build gets a hand-researched video for every exercise (short, vertical clips preferred, English). The main app has nothing like that yet:

- AI-made plans always have `web_link` set to null, so the workout screen shows a greyed-out video icon.
- Idea: a curated exercise-to-video list shipped with the app (name, a few common spellings, the link). When a plan is saved (AI-made, shared or typed in), a known exercise name picks up its link automatically.
- Reuse the research method from Anu's build: search YouTube, keep short form videos, check the subtitles against the exercise and its variation, take the most viewed that passes, check each link still works.
- Keep the list in a data file, not in code, so links can be fixed without a release. Re-check the links every few months.

## Other ideas that came up

- Show the video link on the exercise name in the plan editor too.

## Anu's exercise videos (parked)

Her plan has links on 16 of its exercises (two dead ones were removed). The research for a proper set is half done, in `tools/video-research/`:

- `research.py` searches YouTube for each exercise and keeps short clips; `info.py` pulls their details; `shortlist.json` has the top 3 relevant clips for 30 exercises (most viewed first).
- Still to do: check the subtitles of the shortlist against each exercise (`verify.py`), pick one per exercise, and add the cool-down routine. Needs YouTube to stop blocking caption requests from this machine (we sent too many at once; wait a day, then go slowly, one request every few seconds).
- Findings: real vertical Shorts are rare for form searches (only 3 of 194 clips); most short clips are landscape and 10 to 120 seconds long. Three existing links were poor matches (Romanian deadlift shows the barbell version, leg curl shows the prone version, and long-form clips elsewhere).
- Cool-down stretches need a routine clip (several stretches in one); single-stretch clips cover only one of the three listed each day.
