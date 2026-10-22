<div align="center">

<img src="assets/urudhi-icon.png" alt="Urudhi logo" width="140">

# **Urudhi**

**by ஒளியன் கலைக்கூடம்**

</div>

Urudhi is a small, quiet fitness app: build a plan, put it on your calendar, do the workout, and watch yourself get stronger. Everything is stored on your phone. An optional **AI Coach** can write a plan for you and leave notes before a workout, using your own Anthropic API key.

> Urudhi is a fork of [Simple Fitness](https://github.com/basarsubasi/simplefitnessapp) by Başar Subaşı, released under the MIT License.

<table align="center">
  <tr>
    <td align="center"><img src="docs/screenshots/01-home.png" width="190" alt="Home dashboard"><br><sub><b>Home</b><br>Today, your week, streak</sub></td>
    <td align="center"><img src="docs/screenshots/05-calendar.png" width="190" alt="Calendar"><br><sub><b>Calendar</b><br>Everything scheduled</sub></td>
    <td align="center"><img src="docs/screenshots/06-ai-plan-form.png" width="190" alt="AI plan form"><br><sub><b>AI plan form</b><br>Tap, don't type</sub></td>
    <td align="center"><img src="docs/screenshots/04-schedule-a-plan.png" width="190" alt="Schedule a plan"><br><sub><b>Schedule a plan</b><br>4, 8 or 12 weeks</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/03-plan-with-weekdays.png" width="190" alt="A plan with weekdays"><br><sub><b>A plan</b><br>Each day has a weekday</sub></td>
    <td align="center"><img src="docs/screenshots/07-start-workout.png" width="190" alt="Start workout with coach note"><br><sub><b>Start workout</b><br>With the coach's note</sub></td>
    <td align="center"><img src="docs/screenshots/02-workouts.png" width="190" alt="Workout Plans"><br><sub><b>Workout Plans</b><br>Create, import, generate</sub></td>
    <td align="center"><img src="docs/screenshots/08-settings.png" width="190" alt="Settings"><br><sub><b>Settings</b><br>Backup, theme, AI Coach</sub></td>
  </tr>
</table>

<table align="center">
  <tr>
    <td align="center"><img src="docs/screenshots/10-home-today.png" width="190" alt="Home"><br><sub><b>Home</b><br>Today first, weekly goal ring</sub></td>
    <td align="center"><img src="docs/screenshots/11-home-motivation.png" width="190" alt="Home cards"><br><sub><b>Home cards</b><br>One kind nudge at a time</sub></td>
    <td align="center"><img src="docs/screenshots/12-progress-overview.png" width="190" alt="Progress overview"><br><sub><b>Progress: Overview</b><br>Streak, recap, grid</sub></td>
    <td align="center"><img src="docs/screenshots/13-progress-exercise.png" width="190" alt="One exercise"><br><sub><b>One exercise</b><br>Drag to read each session</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/14-progress-goals.png" width="190" alt="Goal"><br><sub><b>Goals</b><br>Ring and dotted target</sub></td>
    <td align="center"><img src="docs/screenshots/15-progress-balance.png" width="190" alt="Muscle balance"><br><sub><b>Muscle balance</b><br>Front and back body map</sub></td>
    <td align="center"><img src="docs/screenshots/16-progress-milestones.png" width="190" alt="Milestones"><br><sub><b>Milestones</b><br>Calm, few, earned</sub></td>
    <td align="center"><img src="docs/screenshots/17-progress-charts.png" width="190" alt="Charts"><br><sub><b>Charts</b><br>Named by the question</sub></td>
  </tr>
</table>

**Contents:** [Features](#-features) · [Feature tour](#-feature-tour) · [Install](#-install) · [Using the app](#-using-the-app) · [AI Coach](#-ai-coach-optional) · [Privacy](#-privacy) · [Troubleshooting](#-troubleshooting) · [Build from source](#-build-from-source) · [License](#-license)

## 🚀 **Features**

- 🏠 **A calm Home** that answers "what do I do today?": today's workout with its size and the coach's first line, your week with a goal ring, one kind nudge at a time, and a peek at your progress.
- 🏋️ **Create workouts** with days, exercises, sets and reps. Give each day a weekday (for example Push on Monday).
- 📅 **Schedule a whole plan** in one go: pick a start date and 4, 8 or 12 weeks, and every day lands on its weekday.
- ⏱️ **Do a workout** with rest timers that vibrate, play a sound and notify you; weights and reps are filled in from last time; rate each set and add comments.
- 📊 **My Progress** with four tabs: an **Overview** (streak, week recap, 12-week grid, records, muscle balance on a body map, milestones, month in review), **Exercises** (a chart per exercise you can drag along), **Charts** (the full tools) and **History**.
- 🎯 **Goals and care:** a target weight per lift with a dotted line on the chart, a weekly session goal that follows your plan, a one-tap rest week that protects your streak, a kind welcome back after a break, gentle tips when a lift stalls, and a place for "why I started".
- 🔁 **Share** a workout as a small file and import workouts others have shared.
- 🤖 **AI Coach (optional):** a note before each workout, and AI-generated plans you can refine, save and schedule.
- ✨ **Made to feel good:** a deep-teal look in light and dark (light by default), a circular rest countdown, a celebration on every personal best, a short welcome on first launch, and a weekly summary you can share.
- 💌 **Personalise it** (optional): a name, a greeting on Home, a dedication, and short notes at nice moments, signed by whoever you like. The coach can carry that name too.
- ⏰ **Reminders** for a whole scheduled plan, at the time you choose.
- 🎨 Light and dark themes. Weights are in `kg`. Dates are `dd/mm/yyyy`, time is 12-hour, weeks start on Monday. English only.
- 💾 Export and import all your data.

## 🧭 **Feature tour**

Everything the app does, and where to find it.

| Where | What you will find |
|---|---|
| **Home > Today** | The workout for today with its size ("5 exercises, about 50 min, chest, shoulders") and the coach's first line if a note is saved. Start, Resume or Done. On a rest day: what is next, and a reminder that rest counts. |
| **Home > This week** | Monday to Sunday at a glance and a **ring toward the week's goal**. The goal is what your plan puts in the week; tap the ring to choose your own number from 1 to 7. |
| **Home > one kind card** | Never more than one at a time: a welcome back after a break of 10 days or more, a streak nudge late in the week, a goal that is nearly reached, a gentle tip for a lift that has stalled, the next badge, or your own "why I started". |
| **Home > Your progress** | A flame with your weeks in a row, one plain sentence ("Bench Press is up 12% in the last 2 months"), a tiny 4-week grid and a link into My Progress. A gold chip shows a new record for 7 days. |
| **Home > Getting started** | A four-step list for new users that ticks itself off and can be hidden. |
| **Home > Quick buttons** | Quick workout, Log a past one, New plan. |
| **After a workout** | The finish screen shows time, sets, **kg lifted**, any **new records**, your week streak and a link to My Progress. |
| **My Progress > Overview** | Weeks in a row, sessions this week, badges; a plain sentence about the last 30 days; the **week recap** and the **month in review**, each shareable as a picture; goals; the 12-week **consistency grid**; most improved and recent records; best lifts and body weight; **muscle balance** with a front and back body map; **milestones**; and **why I started**. |
| **My Progress > Exercises** | A searchable list of everything you have logged, each with a trend line and percent. Tap one for its page. |
| **One exercise** | Estimated max, heaviest set or total lifted; 4 weeks, 3 months, 1 year or all; a chart you drag a finger along; gold dots for records; a trend line; dotted lines for breaks; a plain sentence; a comparison with the period before; your **goal**; a tip if it has stalled. |
| **My Progress > Charts** | The full tools, grouped by question: **Getting stronger?** (by exercise), **Doing enough?** (by workout) and **Balanced?** (overall). Plain names (Estimated max, Effort score, Each set, Duration), time frames above the chart, an (i) button for the explanation, and colour-blind safe colours. |
| **My Progress > History** | Every logged session with date filter and CSV export, and a delete button for each plan's logs. |
| **Settings** | Theme, reminders, backup and restore, the optional AI Coach, personalisation. |

How the pieces behave:

- **Streaks count weeks.** A week counts when you log at least one workout. A new week with nothing logged yet does not break the streak.
- **Rest weeks.** If you are ill or away, mark the week as a rest week (on the streak card on Home, or on Overview). The streak holds: it neither grows nor breaks.
- **Records.** A set is a record when it lifts more than anything logged before for that exercise. The first time you do an exercise only sets the starting line.
- **Estimated max** is the most you could probably lift once, worked out as weight x (1 + reps / 30). It lets sessions with different reps be compared fairly.
- **Goals** are about the heaviest weight on one set. Pick a weight and optionally 4, 8 or 12 weeks. The app tells you gently whether you are on track, and never scolds.
- **Everything is kind.** Dips are described as normal ("A lighter spell is normal and you can build back"), breaks are never counted against you, and nothing nags.
- **Your data stays on the phone.** Goals, rest weeks and your "why" live in the same local settings file as your other choices. Sharing a recap hands a picture to the share sheet only when you tap Share.

## ⬇️ **Install**

Urudhi is not on any app store yet. Choose one:

- **Download:** get the latest APK from the [GitHub Releases](https://github.com/oliyan/urudhi/releases) page, copy it to your Android phone and open it. Android will ask you to allow installing from that source.
- **Build it yourself:** see [Build from source](#-build-from-source).

Android only for now.

## 📖 **Using the app**

The bottom bar has five tabs: **Home**, **Workout Plans** (clipboard), **Sessions** (dumbbell), **My Progress** and **Settings**.

### 1. The Home dashboard

Home is for today. It shows what to do now and whether the week is on track:

- **Today:** the workouts scheduled for today, each with a one-line size ("5 exercises, about 50 min") and the coach's first line if a note is saved. Tap **Start workout** (or **Resume**), or see **Done** once it is logged. On a rest day it shows what is next.
- **This week:** Monday to Sunday. A filled circle with a tick means done, a ringed circle means planned, a dashed circle means missed. The ring on the right fills toward the week's goal (your plan's sessions unless you chose a number: tap the ring). Tap the rest of the card to open the calendar.
- **One kind card** at most: a welcome back after a break, a streak nudge, a goal that is nearly there, a tip for a stalled lift, the next badge, or your own reason. See [Goals, streaks and motivation](#7-goals-streaks-and-motivation).
- **Your progress:** the weeks in a row, one sentence about how you are doing, a small 4-week grid and a link to My Progress. A gold chip appears for a week after a new record.
- **Getting started:** a short checklist for new users. It goes away when done, or tap **Hide**.
- **Quick workout, Log a past one, New plan** along the bottom.

On a fresh install Home shows a welcome card with buttons to create a workout or generate a plan. The bigger picture (graphs, records, badges, month in review) is in **My Progress**, not on Home.

### 2. Settings you may want to change (one time)

Open **Settings** (gear icon).

- **Theme:** switch between light and dark.
- **Notifications:** turn on to be able to set reminders for a scheduled workout.

Dates, the 12-hour clock and the Monday-first week are fixed; there is nothing to set.

### 3. Create a workout

1. Open **Workout Plans** and tap **Create new workout plan**.
2. Give it a name and add one or more **days** (for example "Push", "Pull", "Legs").
3. For each day, tap a **weekday** (M T W T F S S) if the day belongs to a particular day of the week. Tap it again to clear it. This is optional.
4. Add **exercises** with sets and reps, and tag each with a muscle group if you like.
5. Save it.

Other ways to get a workout:
- **Import** (the download-arrow button next to Create): load a `.json` file someone shared with you.
- **Generate a plan with AI:** see [AI Coach](#-ai-coach-optional).

To change a workout, open it and use the pencil icon (names, weekdays, exercises, order), the plus icon on a day to add an exercise, or the arrows to move a day. To share one, tap the share icon. To delete one, long-press it.

### 4. Put it on your calendar

**A whole plan.** Open the workout and tap **Schedule this plan**, or tap **Schedule a plan** on the calendar and choose one.

1. Check the **weekday for each day** (you can set or change them here; they are remembered).
2. Pick the **start date** and **how long**: 4, 8 or 12 weeks.
3. Read the **preview** (for example "Mon 19/10 · Push, Thu 22/10 · Pull ...").
4. Tap **Schedule N sessions**.

Dates that already have that workout day are skipped, so scheduling the same plan twice does not create duplicates. Days without a weekday are left out.

**A single workout.** On **Sessions**, tap a day, then **Schedule a Workout**, and pick the workout and the day. You can ask for a reminder at a time you choose (needs Notifications turned on in Settings).

The calendar fills in days with a logged workout, underlines today, outlines a planned day you have not tracked, and shades upcoming ones. Long-press a scheduled workout to delete it.

**Quick Workout** starts an unplanned session straight away. The same screen can also log a past day: choose an earlier date and it takes you to enter your numbers.

### 5. Do the workout

1. Start it from the **Home** dashboard, or tap the day on the calendar, tap the workout, then **Start Workout**.
2. On the overview, read the coach's note (if you use the AI Coach), set the **rest time between sets** and **between exercises**, then tap **Start Workout**. Weights and reps are filled in from your last session; vibration, sound and notifications are always on. The first time, Android asks to allow notifications so rest alerts work when the screen is off.
3. The bar at the top always shows the exercise you are on, the workout time and your sets (for example `2/3`). Below it are the **Form** notes (with a small YouTube icon for the exercise video, greyed out if there is none), then the coach's line for that exercise.
4. For each set, check the **weight** and **reps**, tap how it felt (**Easy / Medium / Hard**), add a **comment** if you like (for example "left shoulder pinching"), and tap **Complete Set**. Comments and ratings matter: the AI Coach reads them.
5. A rest timer runs between sets. Made a typo? Tap a finished set (the `✓` chips) to correct its weight or reps.
6. After the last set of an exercise you stay on the screen, with no timer running. Tap **Next exercise** to move on (the rest between exercises starts then), or **+ Add extra set** to do one more. Add extra set is greyed out until every set of the exercise is logged. An extra set starts blank, with the previous set shown as a grey hint, and you can change its **Exercise name** to log a different exercise than planned (for example dumbbell press instead of the machine). An extra set you don't complete is simply dropped.
7. **Skip to Next Exercise** moves on without finishing; the top-right menu jumps to any exercise, finished ones included (to add a set or fix a number).
8. The "Previous Workout" card shows what you did last time for the same exercise. Use its `<` `>` arrows to look back through up to 8 earlier sessions.
9. Tap **Finish Workout** when you are done. If some planned sets are still undone, you are asked to confirm. The summary screen appears and the workout (sets and total time) is already saved; **Done** just takes you back.

All weights are in kilograms.

### 6. Check your progress

Open **My Progress**. It has four tabs, and remembers the one you used last.

- **Overview.** Start here. Weeks in a row, sessions this week and badges earned; one plain sentence about the last 30 days; the **week recap** (or last week's if this one is empty) and the **month in review**, each with a **Share** button that sends a picture; your **goals**; a **consistency grid** of the last 12 weeks (darker means more lifted that day); **most improved** and recent **records**; **best lifts** and body weight; **muscle balance** (a front and back figure coloured by how much each muscle was trained, a sentence, and bars); and ten calm **milestones**. Pull down to refresh.
- **Exercises.** Everything you have logged in one searchable list, with filter chips for muscles. Each row shows the latest value, a small trend line and the percent change. Tap one for its page: choose **Estimated max**, **Heaviest set** or **Total lifted**, a time frame (**4 weeks, 3 months, 1 year, All**), **press and drag along the chart** to read each session, read the sentence under it, compare with the period before, and set a goal.
- **Charts.** The full chart tools, now named by the question each answers: **Getting stronger?** (by exercise), **Doing enough?** (by workout), **Balanced?** (overall). The time frame buttons sit above the chart (3 months first), the (i) button explains a chart, and a sentence under it says what it shows. It opens on what you trained most recently.
- **History.** Every logged session, with a date filter and an export button, and a trash button on each plan to delete its logs.

With fewer than 3 workouts logged, the Overview shows how far along you are and a faded sample of what is coming.

### 7. Goals, streaks and motivation

All of this is optional, local to the phone and kind in tone.

- **A goal for a lift.** Open an exercise in My Progress > Exercises, find **Goal** and tap **Set a goal**. Pick the weight you want to lift on one set and, if you like, 4, 8 or 12 weeks. The page shows a ring and a sentence ("52.5 of 60 kg, 70% of the way. 8 weeks left, on track."), and the **Heaviest set** chart draws a dotted gold line at the target. Reaching it turns the ring green. The Overview lists your goals, and Home mentions one when you are within reach.
- **A weekly goal.** By default it is the number of sessions your plan puts in the week. Tap the ring on Home to pick your own number (1 to 7) or go back to **Follow my plan**.
- **Streak care.** From Thursday on, if nothing is logged yet this week and you have a streak, Home reminds you: "3 days left this week. One session keeps your 9 week streak."
- **Rest week.** Ill, travelling or busy? Tap **Mark this week as a rest week** (on that card on Home, or on Overview). Your streak holds. Tap **Undo** to remove it.
- **Welcome back.** After 10 days or more without a session, Home greets you warmly and suggests starting a little lighter. It never counts the days against you.
- **A little stuck?** If a lift has not gone up in about 4 weeks while you trained it three times or more, you get one gentle tip: an easier week, one more rep per set, a close variation, sleep and food, or a slower lowering. **Hide this for 4 weeks** on the exercise page quiets it.
- **Next badge.** When a milestone is a session or three away, Home says so.
- **Why I started.** On Overview tap **Write it** and note, in a line or two, why you are doing this. It appears on Overview, and on Home on calm days.
- **Month in review.** A card on Overview with sessions, active days, kg lifted, records, the change against last month (only for a finished month), your heaviest lift and most trained muscle. It shows the month just ended during the first days of a new month. **Share** sends it as a picture.
- **After a workout.** The finish screen adds kg lifted, new records, and your week streak.

### 8. Personalise it (optional)

**Settings → Personalise** lets you set a **name**, who the notes are **signed by**, a **greeting** for Home, a **dedication** shown once on first launch, and six short **notes** that appear at nice moments (a workout planned, a workout finished, the first workout, a streak, a personal best, a rest day). If you set a signer, the coach is called *Advice from <name>*. **Replay welcome** shows the first-launch screens again.

### 9. Back up your data

**Settings → Data Management → Export Data** saves a copy of your whole database. **Import Data** restores one. Importing **replaces** everything currently on the phone, so export first if you are unsure.

## 🤖 **AI Coach (optional)**

The AI Coach uses Anthropic's Claude models through **your own API key**. Urudhi has no server; requests go from your phone straight to Anthropic and are billed to your Anthropic account. Without a key nothing is sent anywhere.

### Setting it up

1. Create an account at [console.anthropic.com](https://console.anthropic.com). An API account is separate from a Claude Pro subscription, which does not include API access.
2. Add credit under **Billing**. A few dollars lasts a long time (see [Cost](#cost-and-limits)).
3. Create an **API key** (choose the default workspace) and copy it.
4. In Urudhi open **Settings → AI Coach**, paste the key and tap **Save key**.
5. Tap **Test connection**. You should see "Connected - the key works."

The key is kept in your phone's secure storage. **Delete key** removes it.

### What it does

**Coach's note before a workout.** When you open today's workout, the overview shows a short note based on your recent logs: injuries or pain you commented on, lifts that felt Hard or Easy repeatedly, stalled lifts, and a long break since you last trained that muscle (after a couple of weeks off it suggests easing back in, not adding weight). Advice is always in kg. Exercises with something specific also show their own note on that exercise's screen. If nothing stands out, no note appears. A note is written once per workout per day, only for today's workout, and then kept; reopening it costs nothing.

**Generate a plan.** Open **Workout Plans → Generate a plan with AI** and answer by tapping:

- **About you:** experience level (Beginner, Intermediate, Advanced), main goal (Build muscle, Lose fat, Get stronger, General fitness), and any number of focus areas (or **All**).
- **Your week:** the training days (Mon to Sun), time per session (30, 45, 60 or 90 minutes), and the split (or let the coach decide).
- **Preferences:** intensity (Easy start, Steady, Push me), your equipment, your saved injuries (shown, edited in Settings) and a box for likes and dislikes.

Then:

1. Tap **Generate plan** (it needs at least one training day) and wait up to a minute. A **DRAFT** appears; nothing is saved yet. Each day carries a weekday that matches your training days.
2. Anything unusually high (very many sets or reps) is flagged.
3. To change it, type what you want ("swap barbell squats for leg press", "add more arms") and tap **Refine**. Tap **Undo last refinement** to go back one step.
4. Edit the **plan name** if you like and tap **Save plan**. It becomes a normal workout.
5. The app asks whether to **schedule it now**; say yes to jump to [Schedule a plan](#4-put-it-on-your-calendar).
6. Leaving without saving asks for confirmation and the draft is lost.

**Training profile** (Settings → AI Coach). Set your usual **equipment** and write your **injuries and constraints** in plain words. The coach respects these in every plan and note.

**Body composition (InBody).** Tap **Import InBody CSV** and pick a CSV export of your InBody measurement history (it needs a header row with at least `Date` and `Weight(kg)` columns). The latest scan and the change since the previous one are included in AI requests. Importing the same file again changes nothing. **Delete body data** removes it.

### Cost and limits

- Coach notes use a small, cheap model: a few hundredths of a cent each.
- Plan generation and refinement use a larger model: a few cents each.
- Typical use for one person is well under a dollar a month.
- **Monthly AI spending limit** (Settings → AI Coach): the app estimates what you have used this month and stops AI requests when the limit is reached. The default is $2 and you can change it. It resets each calendar month. This is the app's own estimate; also set a spend limit in the Anthropic console, which is the real cap.

## 🔒 **Privacy**

Your data stays on your phone. If you use the AI Coach, the relevant workout logs and comments, your plan requests, injury notes and imported body data are sent to Anthropic with your key. See the full [Privacy Policy](Privacy%20Policy).

## 🩺 **Troubleshooting**

| You see | What it means and what to do |
|---|---|
| "Anthropic rejected your API key" | The key is wrong or was deleted. Create a new one in the Anthropic console and save it again. |
| "No API key set" | Add a key in Settings → AI Coach. |
| "Your Anthropic account is out of credits" | Add credit under Billing at console.anthropic.com. |
| "You've reached your monthly AI limit" | Raise the limit in Settings → AI Coach, or wait for next month. |
| "Rate limit reached" | Wait the number of seconds shown and try again. |
| "Couldn't reach the AI service" | Check your internet connection and try again. |
| "The AI's reply wasn't a usable workout plan" | Rare. Tap Generate again or reword your request. |
| The Generate plan button is greyed out | Pick at least one training day. |
| No coach's note appears | Normal when nothing stands out, when the workout isn't today's, when no key is saved, or on a brand-new install with no logs and no saved constraints. |
| No rest alert when the screen is off | Allow notifications for Urudhi in Android settings, and check the phone is not in a battery-saving mode that stops the app. |
| A scheduled plan skipped some days | Days without a weekday are left out, and dates that already had that workout day are not duplicated. |
| App crashes on an emulator right after installing | Use an APK built with x86_64 support (the default in this repo), or an arm64 emulator image. |

## 🛠️ **Build from source**

You need Node.js, **JDK 17**, and the Android SDK (set `ANDROID_HOME` to its folder).

```bash
git clone https://github.com/oliyan/urudhi.git
cd urudhi
npm install
cd android
./gradlew assembleRelease        # on Windows: gradlew.bat assembleRelease
```

The APK is written to `android/app/build/outputs/apk/release/app-release.apk`. It contains arm64 (phones) and x86_64 (emulator) libraries, and is signed with the Expo debug key: fine for your own devices, but create your own keystore before publishing anywhere.

JDK 17 matters: newer JDKs such as 25 or 26 fail with this project's Gradle version. The first build downloads a lot and takes several minutes; later builds take about a minute. The `setup.sh`, `build.sh` and `fastbuild.sh` scripts are written for Linux.

To install on a connected device or running emulator: `adb install -r app/build/outputs/apk/release/app-release.apk`.

The code is React Native (Expo) with TypeScript. App text lives in `locales/en/translation.json`.

### Tests and tools

- **Number checks.** The progress, goal, streak and recap maths are plain functions with scripts that check them: `node -r sucrase/register tools/progress-tests/progressStats.test.ts` and `node -r sucrase/register tools/progress-tests/motivation.test.ts`. No phone needed.
- **Sample history.** `python tools/sample-data/make_sample_db.py sample.db [days_back] [weeks]` writes a database with about 12 weeks of believable workouts (add `0 52` for a year). Copy it to a phone or emulator and use **Settings > Import Data** to see the Progress and Home screens filled in. A second argument moves the newest session back, which is how to see the welcome-back card. It replaces everything in the app, so use a test install.
- **Manual test list.** `docs/TEST_CASES.md` has the cases to run by hand on a phone, and `docs/TEST_RESULTS.md` the results so far.
- **Exercise videos.** The list of form videos is `data/exercise-videos.json` (also published separately; see `config/videoList.ts`), and `docs/VIDEO_RESEARCH.md` explains how it was made.

## 📜 **License**

MIT - see [LICENSE](LICENSE). Original work © 2024 Başar Subaşı; modifications © 2026 Ravisankar Pandian.
