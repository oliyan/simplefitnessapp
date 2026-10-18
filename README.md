<div align="center">

<img src="assets/urudhi-icon.png" alt="Urudhi logo" width="140">

# **Urudhi**

**by ஒளியன் கலைக்கூடம்**

</div>

Urudhi is a fitness app for creating, scheduling and tracking your workouts. Everything is stored on your phone. An optional **AI Coach** can write you a plan and give you notes before a workout, using your own Anthropic API key.

> Urudhi is a fork of [Simple Fitness](https://github.com/basarsubasi/simplefitnessapp) by Başar Subaşı, released under the MIT License.

**Contents:** [Features](#-features) · [Install](#-install) · [Using the app](#-using-the-app) · [AI Coach](#-ai-coach-optional) · [Privacy](#-privacy) · [Troubleshooting](#-troubleshooting) · [Build from source](#-build-from-source) · [License](#-license)

## 🚀 **Features**

- 🏋️ **Create workouts** with days, exercises, sets and reps, or start from a featured workout.
- ✏️ **Edit** workouts at any time.
- 📅 **Schedule** workouts on a calendar, including recurring ones.
- ⏱️ **Do a workout** with rest timers, per-set weight, reps, difficulty rating and comments.
- 📊 **Track progress** with logs and graphs.
- 🤖 **AI Coach (optional):** a coach's note before each workout, notes on individual exercises, and AI-generated plans you can refine and save.
- 🌍 Date and weight formats (`dd-mm-yyyy` / `mm-dd-yyyy`, `kg` / `lbs`), light and dark themes, 21 languages.
- 💾 Export and import all your data.

## ⬇️ **Install**

Urudhi is not on any app store yet. Choose one:

- **Download:** get the latest APK from the [GitHub Releases](https://github.com/oliyan/urudhi/releases) page, copy it to your Android phone and open it. Android will ask you to allow installing from that source.
- **Build it yourself:** see [Build from source](#-build-from-source).

Android only for now. The first time you open the app it shows the Home screen with three cards: workouts, calendar and progress.

## 📖 **Using the app**

The bottom bar has five tabs: **Home**, **My Workouts** (dumbbell icon), **My Calendar**, **My Progress** and **Settings**.

### 1. Set your preferences (one time)

1. Open **Settings** (gear icon).
2. Choose your **date format**, **time format**, **weight unit** (kg or lbs), **first day of the week** and **language**.
3. Optionally switch the **theme** to dark.

### 2. Create a workout

1. Open **My Workouts**.
2. Tap **Create a new workout**, give it a name, add one or more **days** (for example "Push", "Pull", "Legs") and add **exercises** to each day with sets and reps. You can tag each exercise with a muscle group.
3. Save it. It now appears in your workout list.

Other ways to get a workout:
- **Featured Workouts:** ready-made plans grouped as Beginner, Intermediate and Advanced.
- **Import** (the download-arrow button next to Create): load a workout from a `.json` file someone shared with you.
- **Generate a plan with AI:** see [AI Coach](#-ai-coach-optional).

To change a workout, open it and use the pencil icon, or the plus icon on a day to add an exercise. To share one, tap the share icon on its card. To delete one, long-press it.

### 3. Schedule it

1. Open **My Calendar**.
2. Tap a day, then **Schedule a Workout**, and pick the workout and the day of it.
3. Use **Recurring Workouts** to repeat a workout on certain weekdays automatically.
4. **Quick Workout** starts an unplanned session straight away.

Days with a logged workout are filled in, today is underlined, and a day with a plan you haven't tracked has an outline. Long-press a scheduled workout to delete it.

### 4. Do the workout

1. Tap a day on the calendar, tap the workout, then **Start Workout**. (**Log Weights Manually** lets you enter numbers afterwards instead.)
2. On the overview, set the rest times between sets and between exercises, and choose the toggles: auto-fill weights and reps from last time, vibration, sound and notifications. Then tap **Start Workout**.
3. For each set, check the **weight** and **reps**, add a **comment** if you like (for example "left shoulder pinching"), and tap **Complete Set**. Rate how it felt when asked. Comments and ratings matter: the AI Coach reads them.
4. A rest timer runs between sets. Use **+ Add Extra Set** to add a set, **Skip to Next Exercise** to move on, or the three-line menu at the top right to jump to any exercise.
5. The "Previous Workout" box shows what you did last time for the same exercise.
6. Tap **Finish Workout** when you are done.

### 5. Check your progress

Open **My Progress**, pick a workout, and see your logs and graphs (weight progression by sets, reps, and workout time). Tap a point on a graph for details.

### 6. Back up your data

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

**Coach's note before a workout.** When you open today's workout, the overview shows a short note based on your recent logs: injuries or pain you commented on, lifts that felt Hard or Easy repeatedly, stalled lifts. Exercises with something specific also show their own note on that exercise's screen. If nothing stands out, no note appears. A note is written once per workout per day, only for today's workout, and then kept; reopening it costs nothing.

**Generate a plan.**
1. Open **My Workouts → Generate a plan with AI**.
2. Fill in your goals, the split you prefer (or let the coach decide), your training days, time per session, equipment and anything else.
3. Tap **Generate plan** and wait up to a minute. A **DRAFT** appears; nothing is saved yet.
4. Read it. Anything unusually high (very many sets or reps) is flagged.
5. To change it, type what you want ("swap barbell squats for leg press", "add more arms") and tap **Refine**. Tap **Undo last refinement** to go back one step.
6. Edit the **plan name** if you like and tap **Save plan**. It becomes a normal workout you can schedule and edit.
7. Leaving without saving asks for confirmation and the draft is lost.

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
| No coach's note appears | Normal when nothing stands out, when the workout isn't today's, when no key is saved, or on a brand-new install with no logs and no saved constraints. |
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

## 🌍 **Languages**

🇨🇿 🇩🇪 🇩🇰 🇬🇷 🇬🇧 🇪🇸 🇫🇮 🇫🇷 🇮🇹 🇯🇵 🇰🇷 🇳🇱 🇳🇴 🇵🇱 🇵🇹 🇷🇺 🇸🇮 🇸🇪 🇹🇷 🇺🇦 🇨🇳

The AI Coach screens are in English for now; other languages show the English text there. To help translate or improve a language, please open an issue at https://github.com/oliyan/urudhi/issues.

## 📜 **License**

MIT — see [LICENSE](LICENSE). Original work © 2024 Başar Subaşı; modifications © 2026 Ravisankar Pandian.
