# Exercise videos

Status: **first version done.** `data/exercise-videos.json` holds 30 entries (29 exercises plus one cool-down routine), each live and 120 seconds or under. 10 were checked against their subtitles, the rest by title and description. Anu's plan uses these links. The app looks links up by name when a plan is saved (`utils/exerciseVideos.ts`) and can fetch a newer list from `VIDEO_LIST_URL` (`config/videoList.ts`, empty until a public repo or gist exists). What remains is under "To finish".

## What was asked for

For **Anu's private build** (branch `anu`, plan `assets/seed/anu-plan.json`):

- A video link (`web_link`) on every exercise **except** the warm-up routine, the treadmill warm-up and the treadmill or elliptical cardio entries.
- **Cool-down stretches are required** (they list three stretches a day, different each day).
- Choose the **most viewed** clip, but check that it really matches the exercise: scrub the **subtitles** of the clip against the exercise and the variation in her form notes (machine versus barbell, seated versus lying, and so on).
- **English only.** No gender preference. Only the content matters.
- **Short form only.** Vertical Shorts are nice to have, not required.
- Some of her existing links were dead, so all of them were to be re-researched.

For the **main app** (later, see `TODO.md`): the same idea as a shipped exercise-to-video list, so AI-made plans get links too. AI plans always have `web_link` set to null today.

## What was done

Scripts are in `tools/video-research/` (Python 3, `pip install yt-dlp youtube-transcript-api`, run with `PYTHONIOENCODING=utf-8` on Windows):

1. `research.py`: for each exercise it searches YouTube (`yt-dlp`, no API key), keeps clips of 8 to 120 seconds, ranks them by views, and fetches each clip's subtitles to score them against the exercise name and variation words (`SPEC` at the top lists the search phrase, required words and words to avoid for each exercise).
2. `info.py`: pulls details for the top clips (size, description, upload date, tags).
3. `shortlist.json`: the top 3 relevant clips for 30 exercises, most viewed first (relevance judged from title, description and tags, because the subtitles could not be fetched, see below).
4. `verify.py`: the next step, not completed. It fetches the subtitles of every shortlisted clip slowly and saves them to `verified.json`.

## Findings

- Existing links in her plan: 18 had a link. Two were **dead** (Pec Fly Machine, Reverse Pec Fly Machine) and were removed from her plan. Others are long-form clips, and two are poor matches: **Romanian deadlift** shows the barbell version, and **leg curl** shows the prone (lying) version.
- **Real vertical Shorts are rare** for form searches: only 3 of 194 clips were vertical. Clips labelled "#shorts" were mostly landscape, 10 to 120 seconds long and open on a normal watch page. In practice "short form" means those clips. A vertical Short can be found through a channel's Shorts tab (`yt-dlp https://www.youtube.com/@Channel/shorts`) but those are mostly commentary, not exercise demos.
- **YouTube blocked subtitle requests from this machine** (`IpBlocked` from `youtube-transcript-api`, HTTP 429 from `yt-dlp`) after about 200 requests in a few minutes. Search and metadata still worked. To resume: wait a day, then fetch **one request every 3 to 4 seconds** (`verify.py` already does, and stops after 3 blocks in a row).
- **Cool-down stretches:** most results are a single stretch, but each day lists three. Better to pick one **routine** clip (several stretches in one). Candidates found: WebMD "Best Post-Workout Stretches" (2:19, 436k views) and "Cool Down Exercises After Workout" from My One Minute Workouts (2:59, 236k). Check their subtitles for the stretches in her notes (chest opener, triceps, figure-4 glute, child's pose, cat-cow, hip flexor, hamstring, biceps).
- Equipment in her notes to match: hip thrust is **barbell** on a bench, back extension is the **45-degree bench**, rope pushdown and face pull use a **rope**, seated row uses a **V-handle**, leg press is a **seated machine**, step-up uses a **knee-height box**.

## Provisional picks (NOT verified against subtitles)

Most viewed relevant clip first; two alternatives per exercise. Do not use these blindly: run `verify.py`, read the subtitles, then decide.

| Exercise | Provisional pick | Channel | Length | Views | Alternatives |
|---|---|---|---|---|---|
| Incline Dumbbell Press | [How to do the INCLINE DUMBBELL BENCH PRESS! / 2 Minu](https://www.youtube.com/watch?v=IP4oeKh1Sd4) | Max Euceda | 120s | 1,033,205 | [ScottHermanFitne](https://www.youtube.com/watch?v=TThwNhMVspk), [Renaissance Peri](https://www.youtube.com/watch?v=5CECBjd7HLQ) |
| Dumbbell Overhead Tricep Extension | [How To: Dumbbell Seated Overhead Tricep Extension](https://www.youtube.com/watch?v=YbX7Wd8jQ-Q) | ScottHermanFitness | 115s | 3,566,398 | [ScottHermanFitne](https://www.youtube.com/watch?v=-Vyt2QdsR7E), [OPEX Fitness](https://www.youtube.com/watch?v=a9oPnZReIRE) |
| Lat Pulldown | [Wide-Grip Lat Pulldown / Back Exercise Guide](https://www.youtube.com/watch?v=lueEJGjTuPQ) | Bodybuilding.com | 65s | 1,593,718 | [Muscle & Motion](https://www.youtube.com/watch?v=trZQjegcRx0), [nutritioneering](https://www.youtube.com/watch?v=gZr4wiQTfMM) |
| Face Pulls | [Face Pulls / How To Perform Them Properly](https://www.youtube.com/watch?v=V8dZ3pyiCBo) | KAGED  | 116s | 2,049,636 | [PureGym](https://www.youtube.com/watch?v=0Po47vvj9g4), [Men's Health](https://www.youtube.com/watch?v=eFxMixk_qPQ) |
| Goblet Squat | [Goblet Squat](https://www.youtube.com/watch?v=mF5tnEBrdkc) | LivestrongWoman | 53s | 1,693,650 | [Physique Develop](https://www.youtube.com/watch?v=CkFzgR55gho), [Men's Health](https://www.youtube.com/watch?v=3gpXflqRiEc) |
| Leg Curl Machine | [Seated Leg Curl](https://www.youtube.com/watch?v=Orxowest56U) | Renaissance Periodiz | 11s | 957,361 | [SilverSneakers](https://www.youtube.com/watch?v=t9sTSr-JYSs), [Planet Fitness B](https://www.youtube.com/watch?v=fK0uZ3KRZRI) |
| Seated Dumbbell Shoulder Press | [Seated Dumbbell Shoulder Press](https://www.youtube.com/watch?v=HzIiNhHhhtA) | Renaissance Periodiz | 13s | 1,000,056 | [Max Euceda](https://www.youtube.com/watch?v=rO_iEImwHyo), [PureGym](https://www.youtube.com/watch?v=TsduLWuhlFM) |
| Plank | [How To: Plank](https://www.youtube.com/watch?v=pSHjTRCQxIw) | ScottHermanFitness | 77s | 22,461,983 | [P4P WORKOUTS ](https://www.youtube.com/watch?v=TvxNkmjdhMM), [Children's Hospi](https://www.youtube.com/watch?v=pvIjsG5Svck) |
| Dumbbell Bicep Curl | [How to Do a Dumbbell Biceps Curl / Arm Workout](https://www.youtube.com/watch?v=ykJmrZ5v0Oo) | Howcast | 109s | 8,287,987 | [ScottHermanFitne](https://www.youtube.com/watch?v=sAq_ocpRh_I), [LIVESTRONG](https://www.youtube.com/watch?v=av7-8igSXTs) |
| Dumbbell Step-up | [Dumbbell Step-up - How To](https://www.youtube.com/watch?v=9ZknEYboBOQ) | Bobby Maximus | 25s | 816,879 | [Marcus Filly](https://www.youtube.com/watch?v=37tVohr7LcE), [Cornerstone Phys](https://www.youtube.com/watch?v=wfhXnLILqdk) |
| Pec Fly Machine | [How to Do Chest Fly Exercises on a Machine](https://www.youtube.com/watch?v=Z57CtFmRMxA) | LIVESTRONG | 89s | 1,894,440 | [PureGym](https://www.youtube.com/watch?v=eGjt4lk6g34), [Idris](https://www.youtube.com/watch?v=K2VJ4HeXb4s) |
| Hip Thrust | [How To Do a Barbell Hip Thrust](https://www.youtube.com/watch?v=Zp26q4BY5HE) | Girls Gone Strong |  | 88s | 2,774,341 | [Mike | J2FIT Str](https://www.youtube.com/watch?v=29OfN4ztW_g), [Nuffield Health](https://www.youtube.com/watch?v=pUdIL5x0fWg) |
| Seated Row (Cable Machine) | [Seated Cable Row](https://www.youtube.com/watch?v=UCXxvVItLoM) | Renaissance Periodiz | 18s | 1,637,475 | [Bodybuilding.com](https://www.youtube.com/watch?v=xQNrFHEMhI4), [Bodybuilding.com](https://www.youtube.com/watch?v=IzoCF_b3cIY) |
| Back Extension | [How to Do Back Extensions](https://www.youtube.com/watch?v=ph3pddpKzzw) | LIVESTRONG | 84s | 2,894,412 | [Bodybuilding.com](https://www.youtube.com/watch?v=qtjJUWCnDyE), [Hailspt](https://www.youtube.com/watch?v=YGUOyLf6BUg) |
| Leg Press | [Instructional Fitness - Seated Leg Press](https://www.youtube.com/watch?v=Aq5uxXrXq7c) | Instructionalfitness | 97s | 897,984 | [Tri Cities Gold'](https://www.youtube.com/watch?v=VFk3RzndUEc), [Goodlife Health ](https://www.youtube.com/watch?v=8EMbB0tCn7Q) |
| Hip Abductor Machine | [Cable Hip Abduction & Adduction](https://www.youtube.com/watch?v=EHq78mQYLbI) | Just Raw Skill | 44s | 627,140 | [PureGym](https://www.youtube.com/watch?v=G_8LItOiZ0Q), [ScottHermanFitne](https://www.youtube.com/watch?v=2b97cvyH9sE) |
| Dumbbell Lateral Raise | [How To: Dumbbell Side Lateral Raise](https://www.youtube.com/watch?v=3VcKaXpzqRo) | ScottHermanFitness | 115s | 14,227,879 | [LIVESTRONG](https://www.youtube.com/watch?v=kDqklk1ZESo), [LIVESTRONG](https://www.youtube.com/watch?v=geenhiHju-o) |
| Side Plank | [How to Do a Side Plank / Ab Workout](https://www.youtube.com/watch?v=NXr4Fw8q60o) | Howcast | 114s | 3,127,776 | [Children's Hospi](https://www.youtube.com/watch?v=N_s9em1xTqU), [AskDoctorJo](https://www.youtube.com/watch?v=9dNL_mtObGQ) |
| Hammer Curl | [Dumbbell Hammer Curls Tutorial / CORRECT TECHNIQUE (](https://www.youtube.com/watch?v=OPqe0kCxmR8) | One Minute Tutorial | 64s | 1,334,906 | [Howcast](https://www.youtube.com/watch?v=EdWCF9-ZAJI), [Buff Dudes Worko](https://www.youtube.com/watch?v=BRVDS6HVR9Q) |
| Dumbbell Reverse Lunge | [How To Reverse Lunge](https://www.youtube.com/watch?v=xrPteyQLGAo) | PureGym | 15s | 2,126,484 | [OPEX Fitness](https://www.youtube.com/watch?v=Q2k3kYbtOcI), [Dr. Carl Baird](https://www.youtube.com/watch?v=Ry-wqegeKlE) |
| Tricep Rope Pushdown | [How To: Tricep Pushdown (Life Fitness Cable)](https://www.youtube.com/watch?v=2-LAMcpzODU) | ScottHermanFitness | 112s | 7,524,161 | [ScottHermanFitne](https://www.youtube.com/watch?v=vB5OHsJ3EME), [LIVESTRONG](https://www.youtube.com/watch?v=8WL0m0vLAPo) |
| Cable Glute Kickback | [How To: Cable Glute Kickback](https://www.youtube.com/watch?v=dU1R-AHW4IM) | Kia Khadem | 27s | 398,214 | [Seriously Strong](https://www.youtube.com/watch?v=ifP5sFBT7IE), [The Fit Chase](https://www.youtube.com/watch?v=qJxwJ1e1HxI) |
| Assisted Pull-up Machine | [How-To Use the "Dip/Chin Assist" machine](https://www.youtube.com/watch?v=8zFcJWD9Y_E) | Tri Cities Gold's Gy | 97s | 448,639 | [PureGym](https://www.youtube.com/watch?v=wFj808u2HWU), [LIVESTRONG](https://www.youtube.com/watch?v=W1BckzObbQc) |
| Dead Bug | [Core Exercise: Dead Bug](https://www.youtube.com/watch?v=g_BYB0R-4Ws) | Children's Hospital  | 98s | 5,714,450 | [Bodybuilding.com](https://www.youtube.com/watch?v=4XLEnwUr1d8), [Pursuit Physical](https://www.youtube.com/watch?v=o4GKiEoYClI) |
| Romanian Deadlift - Dumbbell | [Dumbbell Romanian (RDL) Deadlift /TECHNIQUE for Begi](https://www.youtube.com/watch?v=hQgFixeXdZo) | Mike | J2FIT Strengt | 79s | 4,000,355 | [ScottHermanFitne](https://www.youtube.com/watch?v=FQKfr1YDhEk), [PureGym](https://www.youtube.com/watch?v=plb5jEO4Unw) |
| Leg Extension | [How To Do A Leg Extension](https://www.youtube.com/watch?v=4ZDm5EbiFI8) | PureGym | 14s | 813,036 | [Hammer Strength](https://www.youtube.com/watch?v=MpEydcQ1oDw), [Yaralla Fitness ](https://www.youtube.com/watch?v=qYxo9ZFvHQE) |
| Reverse Pec Fly Machine | [Machine Reverse Flye](https://www.youtube.com/watch?v=5YK4bgzXDp0) | Renaissance Periodiz | 14s | 438,806 | [PureGym](https://www.youtube.com/watch?v=nlkF7_2O_Lw), [MyTraining App](https://www.youtube.com/watch?v=rtkvodbZfGY) |
| Bicycle Crunch | [How to Do the Bicycle](https://www.youtube.com/watch?v=9FGilxCbdz8) | LIVESTRONG | 85s | 5,543,980 | [Tone and Tighten](https://www.youtube.com/watch?v=1we3bh9uhqY), [Howcast](https://www.youtube.com/watch?v=Iwyvozckjak) |
| Bench Dips | [How to Do Triceps Bench Dips](https://www.youtube.com/watch?v=0326dy_-CzM) | LIVESTRONG | 108s | 3,691,618 | [P4P WORKOUTS ](https://www.youtube.com/watch?v=dl8_opV0A0Y), [ScottHermanFitne](https://www.youtube.com/watch?v=c3ZGl4pAwZ4) |
| Cool-down Stretches | [Best Post-Workout Stretches to Boost Recovery / WebM](https://www.youtube.com/watch?v=wrIZ3JxTZJY) | WebMD | 139s | 436,145 | [My One Minute Wo](https://www.youtube.com/watch?v=kXbryJUQTZc), [Nadia Valentina](https://www.youtube.com/watch?v=iDGWlH3ygWg) |

## To finish

1. Read the subtitles of the title-only entries, slowly (one request every 10 seconds or more, a few at a time, because YouTube blocks after about 35).
2. Replace the cool-down clip (a 65 second one with few views) with a better routine of 2 minutes or less that shows the stretches in her notes.
3. Leg curl: confirm the clip is the seated machine, not lying.
4. Host the list in a public repo or gist and set `VIDEO_LIST_URL`.
5. Re-check links every few months.
