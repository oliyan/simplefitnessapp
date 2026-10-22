# Urudhi - Phone Test Cases

**Build under test:** branch `workout-screen` at commit `fed968f` (includes the AI Coach work and the `minimal` changes)
**APK:** `Urudhi-test-fed968f.apk`
**Time needed:** about 110 minutes if you do it all; the 🔴 cases alone (74 of them) take about 85 minutes.
**New in this build:** section 9A (the reworked workout screen) and a few changed cases in sections 3, 9 and 13. Weights are now kg only.

---

## How to use this document

- Work top to bottom, or jump to a section. Each case has **Steps**, **Expected**, and a **Result** column for you to mark `✅` (pass), `❌` (fail) or `➖` (skipped), plus a **Notes** column.
- **Expected** is what the app is designed to do. If something differs, that is a finding even if it looks harmless. Write down what you saw.
- Priority: 🔴 must test · 🟡 should test · ⚪ nice to have.
- Tip: keep a second note open and jot the ID of anything odd (for example `SCH-04 preview showed 7 sessions, expected 8`). A bug report template is at the end.

### What was tested already (so you know where to look hardest)

Tested on an Android emulator only, with fake data: Home, calendar, scheduling a plan (including the duplicate guard), the AI plan form, generating a plan with a real key, saving it, coach notes, the spending limit. **Never tested on a real phone, with your real data, or in dark mode.** Real-phone things (vibration, sound, notifications with the screen off, battery behaviour, your own InBody file) are where I most expect surprises.

---

## 0. Before you start

| # | Do this | Why |
|---|---|---|
| 1 | If this phone already has Urudhi (or the old Simple Fitness), open it and use **Settings → Data Management → Export Data**. Save the file somewhere safe (Drive, email to yourself). | The new build changes the database slightly. Export first so you can always go back. |
| 2 | Copy the APK to the phone and open it. Allow "install from this source" if asked. | |
| 3 | Have your **Anthropic API key** ready (or plan to skip sections 12-17). | AI tests need it. |
| 4 | Have **Wi-Fi/mobile data toggles** handy. | Offline tests. |
| 5 | Know where your **InBody CSV** is on the phone (or use the sample in Appendix B). | InBody tests. |
| 6 | Charge the phone and keep volume up. | Rest-timer sound tests. |

**Sample data to create once** (used by several cases): a workout named **`T-Plan`** with two days:

- Day **`Push`**: Bench Press 3 × 8 (Chest), Shoulder Press 3 × 10 (Shoulders)
- Day **`Pull`**: Barbell Row 3 × 8 (Back), Bicep Curl 3 × 12 (Biceps)

---

## 1. Install and first launch

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| INS-01 | 🔴 | Install the APK over an existing Urudhi, then open it. | Opens normally. Your old workouts, calendar entries and logs are all still there. | ☐ | |
| INS-02 | 🟡 | On a spare phone or after uninstalling: fresh install, open. | Home shows a **Welcome to Urudhi** card with *Create a workout* and *Generate a plan with AI*, not an empty dashboard. | ☐ | |
| INS-03 | 🟡 | Open the app, press the Home button, reopen from recents. | Returns to where you were. No crash, no blank screen. | ☐ | |
| INS-04 | ⚪ | Check the app name and icon on the home screen and in the app drawer. | Name **Urudhi**, new logo. | ☐ | |

---

## 2. Home dashboard

*Set up first: schedule `T-Plan` for the coming weeks (section 7) and log at least one workout (section 9). To see Home with a long history, load the sample data described in section 10.*

Home is for today: what to do now and whether the week is on track. The long view (graphs, records, badges) is in My Progress; Home only gives a peek and a link.

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| HOM-01 | 🔴 | Open Home on a day with a scheduled workout. | **Today** card lists it with a **Start workout** button, and under the name one line such as "5 exercises, about 50 min, chest, shoulders". | ☐ | |
| HOM-02 | 🔴 | Tap **Start workout**. | Opens that workout's start screen. **Back** returns to the **calendar** (not a blank or stuck screen). | ☐ | |
| HOM-03 | 🔴 | After logging today's workout, return to Home. | That session shows **Done**. The *This week* circle for today is filled with a tick. | ☐ | |
| HOM-04 | 🟡 | Look at **This week**. | Monday to Sunday. Done = filled tick, planned = ring, missed (past, not logged) = dashed, rest = faint. Today underlined. Next to the heading, "2 of 3 sessions" and a ring with "2/3". | ☐ | |
| HOM-05 | 🟡 | Tap the **This week** card (not the ring). | Opens the calendar. | ☐ | |
| HOM-06 | 🟡 | Look at the **Your progress** card (needs at least one logged session). | A flame with the weeks in a row, one plain sentence ("Bench Press is up 12% in the last 2 months"), a tiny 4-week grid and **See my progress**. Tapping it opens My Progress. It matches the Overview tab. | ☐ | |
| HOM-07 | 🟡 | Check Home for things that moved to My Progress. | No **Lifted this week** card, no **Recent personal records** list and no **Share my week** button on Home (the recap and its Share are on the Overview tab). | ☐ | |
| HOM-08 | 🟡 | Log a set heavier than you have ever lifted on one exercise (you need an earlier log of that exercise first). Return to Home. | A gold chip "New record: Squat, 60 kg x 8" shows above the progress card for 7 days. Tapping it opens that exercise's page. | ☐ | |
| HOM-09 | 🟡 | Look at records for an exercise you have only ever done once. | No chip (the first time only sets the starting point). | ☐ | |
| HOM-10 | 🟡 | On a rest day (nothing scheduled today). | Card reads **Rest day** with the next workout ("Next: Tomorrow, Pull") plus its size line, and "Rest is part of the plan. A relaxed walk counts too." Or it offers *Schedule a plan* if nothing is scheduled. | ☐ | |
| HOM-12 | ⚪ | Scroll the Home page to the bottom, then open Settings and scroll to **Community**. | Home has no GitHub button. The **GitHub** button in Settings opens the repo in a browser. | ☐ | |
| HOM-13 | ⚪ | Make two sessions on the same day (one done, one not). | Both appear in *Today*, each with the right status. | ☐ | |
| HOM-14 | 🟡 | Open Home in the morning, afternoon and evening (or change the phone's clock), with a name set and no custom greeting. | "Good morning, Priya!", "Good afternoon, ...", "Good evening, ...". A custom greeting (for example on a personal build) is shown as written. | ☐ | |
| HOM-15 | 🟡 | With a coach note already saved for today's workout (open the Start screen once with the AI Coach on), return to Home. | Today's card also shows the note's first sentence in italics. Home itself never calls the AI. | ☐ | |
| HOM-16 | 🔴 | Tap the **ring** on This week. | A small sheet "Sessions per week": **Follow my plan** (selected by default) and 1 to 7. Picking 4 changes the ring to "x/4" and the text adds "(your goal)". **Follow my plan** goes back to the plan's number. | ☐ | |
| HOM-17 | 🟡 | Reach the weekly goal. | The ring turns green with a tick and the text reads "Goal met: 3 of 3 sessions". | ☐ | |
| HOM-18 | 🟡 | Look at the bottom of Home. | Three quick buttons: **Quick workout**, **Log a past one**, and (where AI plans are on) **New plan**. Each opens the right screen: Quick workout opens today's log, Log a past one opens it dated yesterday, New plan opens the plan generator. | ☐ | |
| HOM-19 | 🟡 | New user: create a plan, schedule it, finish a workout, open My Progress, checking Home between steps. | A **Getting started** card lists 4 steps and ticks them off as done. It disappears when all are done, or when you tap **Hide**. | ☐ | |
| HOM-20 | 🟡 | Check how many motivation cards show at once. | Never more than one (welcome back, streak, goal, stuck tip, next badge or your reason; see section 10A). | ☐ | |

---

## 3. Settings

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| SET-01 | 🟡 | Open Settings. | You see: **Notifications**, **Theme**, **Data Management**, **AI Coach**. There is **no** language, date format, time format, first-day-of-week or weight-unit setting. | ☐ | |
| SET-02 | 🟡 | Look at weights on Home, the workout screen, the calendar log and Progress. | Everything is in **kg**. There is no way to switch to lbs. | ☐ | |
| SET-03 | 🔴 | Check dates and times across the app (calendar, logs, scheduler). | Dates look like `18/10/2026`; the calendar starts on **Monday**; times are 12-hour with AM/PM. | ☐ | |
| SET-04 | 🟡 | Close and reopen the app. | The theme is remembered. | ☐ | |

---

## 4. Creating and editing workouts

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| WKT-01 | 🔴 | Workout Plans → **Create new workout plan**. Build `T-Plan` as described in section 0. Save. | It appears in the list. Opening it shows both days and their exercises with muscle-group tags. | ☐ | |
| WKT-02 | 🟡 | Try to save with an empty workout name. | A clear error; nothing is saved. | ☐ | |
| WKT-03 | 🟡 | Try to save with a day that has no name, or an exercise with 0 sets or 0 reps. | A clear error; nothing is saved. | ☐ | |
| WKT-04 | 🟡 | Try to create a second workout with the exact name `T-Plan`. | Refused with a clear message (names must be unique), no crash. | ☐ | |
| WKT-05 | 🔴 | Open a workout → pencil (edit). Rename a day, change an exercise's sets, drag an exercise to a new position. Save. | Changes persist and show in the workout page. | ☐ | |
| WKT-06 | 🟡 | On the workout page, tap **+** on a day and add an exercise (name, sets, reps, muscle group, optional link and note). | Exercise appears. A bookmark icon shows if you added a note; a link icon shows if you added a link. | ☐ | |
| WKT-07 | 🟡 | Use the **↑ / ↓** arrows on a day to move it. | The day order changes and stays changed after leaving and reopening. | ☐ | |
| WKT-08 | 🟡 | Long-press a day → delete. Long-press an exercise → delete. | Asks for confirmation. Deleting removes it. | ☐ | |
| WKT-09 | 🔴 | Long-press a whole workout in the list → delete. | Asks for confirmation. It disappears; its **future** scheduled sessions disappear from the calendar; **past logs stay** (check Progress). | ☐ | |
| WKT-10 | 🟡 | Rename a workout that has future sessions scheduled. | Calendar entries show the new name. | ☐ | |

---

## 5. Weekdays on days

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| WDY-01 | 🔴 | Create or edit a workout. Under each day you should see seven round buttons **M T W T F S S**. Pick **M** for Push and **Th** for Pull. Save. | On the workout page the days read **Push · Mon** and **Pull · Thu**. | ☐ | |
| WDY-02 | 🟡 | Edit the workout, tap the selected weekday again. | It clears (no weekday). Page shows the day name only. | ☐ | |
| WDY-03 | 🟡 | Give two days the same weekday. | Allowed (for example morning/evening sessions). | ☐ | |
| WDY-04 | 🟡 | Move a day with the ↑/↓ arrows. | Its weekday moves with it. | ☐ | |
| WDY-05 | 🟡 | Create a day and leave the weekday empty. | Saved with no weekday. Later it can be set in the editor or in the scheduler. | ☐ | |

---

## 6. Sharing and importing a workout

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| SHR-01 | 🔴 | On a workout with weekdays set, tap the **share** icon and send the file to yourself (Drive/email/WhatsApp). | A `UrudhiWorkout_<name>.json` file is shared. | ☐ | |
| SHR-02 | 🔴 | Delete that workout, then Workout Plans → **import** button and pick the file. | The workout returns with all days, exercises **and weekdays**. | ☐ | |
| SHR-03 | 🟡 | Import the same file again. | Refused because the name already exists, with a clear message. | ☐ | |
| SHR-04 | 🟡 | Import the **older-format** sample from Appendix A (no weekday field). | Imports fine; days have no weekday. | ☐ | |
| SHR-05 | ⚪ | Import a file that is not a workout (any random `.json` or `.txt`). | A clear failure message; no crash; nothing added. | ☐ | |

---

## 7. Schedule a plan

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| SCH-01 | 🔴 | Open `T-Plan` (Push = Mon, Pull = Thu) → **Schedule this plan**. | Screen shows both days with their weekdays pre-filled, today as the start date, **4 weeks** selected. | ☐ | |
| SCH-02 | 🔴 | Read the **Preview**. | Lists sessions on the correct weekdays, for example "Mon 19/10 · Push", "Thu 22/10 · Pull". Count and first/last dates make sense for 4 weeks. | ☐ | |
| SCH-03 | 🔴 | Tap **Schedule N sessions**. | "Plan scheduled: N sessions added to your calendar." The calendar shows them as upcoming on the right dates. | ☐ | |
| SCH-04 | 🔴 | Tap a scheduled day on the calendar → the workout. | All its exercises, sets and reps are listed. | ☐ | |
| SCH-05 | 🔴 | Schedule the same plan again, same dates. | "0 sessions added; N were already on your calendar." No duplicates on the calendar. | ☐ | |
| SCH-06 | 🟡 | Switch to **8 weeks** then **12 weeks**. | Preview and button count update. | ☐ | |
| SCH-07 | 🟡 | Change the start date to a future date (tap the date). | Preview moves. You cannot pick a past date. | ☐ | |
| SCH-08 | 🟡 | Change a day's weekday in the scheduler, schedule, then reopen the workout. | The new weekday is remembered on the workout. | ☐ | |
| SCH-09 | 🟡 | Clear every weekday in the scheduler. | Preview says to pick a weekday; the button is greyed out. | ☐ | |
| SCH-10 | 🟡 | Leave one day without a weekday and schedule. | That day is left out; a note says how many days are not scheduled. | ☐ | |
| SCH-11 | 🔴 | From the **calendar** tap **Schedule a plan** (not from a workout). | You first choose a plan, then the same screen as above. | ☐ | |
| SCH-12 | 🟡 | Start the scheduler, then press the Android back button. | Returns without scheduling anything. | ☐ | |
| SCH-13 | 🟡 | Schedule across a **month change** and across **year end** if you can (12 weeks from December). | Dates are correct (no skipped or doubled day). | ☐ | |
| SCH-14 | 🟡 | The old **Recurring Workouts** button. | It is gone from the calendar. Sessions you had created earlier with it remain on the calendar. | ☐ | |

---

## 8. Calendar

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| CAL-01 | 🔴 | Open **Sessions**. | Month view, weeks start **Monday**. Legend: Today, Logged, Untracked, Upcoming. | ☐ | |
| CAL-02 | 🟡 | Check the day styles. | Logged = filled dark; today = underlined; a past planned day you did not log = outlined ("untracked"); upcoming = shaded. | ☐ | |
| CAL-03 | 🟡 | Swipe to previous/next month with the arrows. | Works; scheduled sessions show in the right months. | ☐ | |
| CAL-04 | 🔴 | Tap a day with a workout. | A list of that day's workouts opens; tap one to see its exercises. | ☐ | |
| CAL-05 | 🔴 | Tap a day → **Schedule a Workout**. Choose a workout and a day, and schedule it. (Try once with **Enable Notifications** and a time.) | It appears on that day. With reminders on, a notification arrives at the chosen time (needs Notifications on in Settings). | ☐ | |
| CAL-06 | 🟡 | Try to schedule the same workout day on the same date twice. | Warns about a duplicate; nothing added. | ☐ | |
| CAL-07 | 🟡 | Long-press a scheduled workout → delete. | Asks for confirmation; removed from the calendar. | ☐ | |
| CAL-08 | 🔴 | Tap **Quick Workout**, pick a workout and day, with the date as **Today**. | Goes straight to the start screen for that session. | ☐ | |
| CAL-09 | 🟡 | Quick Workout with an **earlier date**. | Takes you to a screen to enter weights/reps for that past session. After saving it shows as logged on that date. | ☐ | |
| CAL-10 | 🟡 | Quick Workout with a **future date**. | Schedules it and returns to the calendar. | ☐ | |

---

## 9. Doing a workout (best done in the real gym)

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| RUN-01 | 🔴 | Start a scheduled workout. Look at the start screen. | Shows the workout, number of exercises and sets, the exercise list, and **only two settings**: rest time between sets and between exercises (defaults 30 s and 60 s). There are **no** toggles for auto-fill, vibration, sound or notifications. | ☐ | |
| RUN-02 | 🔴 | Tap **Start Workout** for the first time on this phone. | Android asks to allow notifications. Choose **Allow**. | ☐ | |
| RUN-03 | 🔴 | Do the first set of an exercise you have logged before. | Weight and reps are **filled in from your last session** for the same exercise and set number. You can edit them. | ☐ | |
| RUN-04 | 🔴 | Fill in weight and reps, tap **Easy / Medium / Hard** on the screen, then **Complete Set**. | No pop-up. The set is saved and a **rest timer** counts down. | ☐ | |
| RUN-05 | 🔴 | Let the rest timer finish with the screen on. | The phone **vibrates** and plays a **sound**; the next set appears. | ☐ | |
| RUN-06 | 🔴 | Start a rest timer, then **lock the phone / switch to another app**. | A **notification** arrives when the rest ends, with the screen off. (If it doesn't, note your phone model; battery-saver settings are a likely cause.) | ☐ | |
| RUN-07 | 🟡 | Add a comment on a set ("left shoulder pinching") and complete it. | Saved. It shows in the logs later. | ☐ | |
| RUN-08 | 🟡 | Check the **Previous Workout** card on an exercise you have done before. | Shows what you did last time for it. (Browsing older sessions is WRK-17.) | ☐ | |
| RUN-09 | 🟡 | Finish all sets of an exercise, then tap **+ Add extra set**. | One more set is added. (The full set of rules is in section 9A.) | ☐ | |
| RUN-10 | 🟡 | Tap **Skip to Next Exercise**, then use the top-right menu to jump to a specific exercise. | Navigation works, nothing is lost. | ☐ | |
| RUN-11 | 🔴 | Finish all sets and tap **Finish Workout**. | A summary with total time and sets completed. **Nothing more to press to save:** leave with Done or Back, and the session shows as logged on the calendar and on Home, with its total time. | ☐ | |
| RUN-12 | 🔴 | Start a workout, complete a couple of sets (add an extra one too), then **swipe the app away** from recents and reopen the workout and tap Start Workout. | The sets you already logged are **ticked** (chips show ✓, counts like `2/4`), extra and renamed sets are back, and you continue from the first set not done. Nothing is logged twice. | ☐ | |
| RUN-13 | 🟡 | Start a workout, press Back mid-way. | Asks before leaving or keeps your progress; no data lost. | ☐ | |
| RUN-14 | 🟡 | Rest-time fields: enter `0`, then a large value like `600`, then leave one blank. | `0` and `600` accepted; blank/invalid shows a clear message. | ☐ | |
| RUN-15 | ⚪ | Do the same exercise twice on different days and compare the suggested weight/badge after Easy/Hard ratings. | A weight suggestion appears after a few sessions (if shown). | ☐ | |
| RUN-16 | 🟡 | A workout with an exercise that has a **link** and a **note**. | The note shows in the **Form** card and the YouTube icon in its corner opens the URL. | ☐ | |

---

## 9A. The workout screen (reworked in this build)

Do these during a workout, ideally one with at least three exercises. Set the rest times to a few seconds on the start screen so you are not waiting.

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| WRK-01 | 🔴 | Start a workout and look at the **top bar**. | It shows the **exercise name**, the **workout time** (running) and **logged/total sets** (for example `0/4 sets`). The workout name is not shown there. After each set the count goes up. | ☐ | |
| WRK-02 | 🔴 | Scroll the exercise screen from the top. | In this order: **Form** card (notes, small YouTube icon in the top-right corner), **Coach's note** (only if it has a line for this exercise), set chips (`1 2 3 4`), weight and reps, **How was this set?** chips, comment, buttons. There is **no bookmark icon**, no separate links row and no "sets remaining" row. | ☐ | |
| WRK-03 | 🟡 | Open an exercise that has **no video link**, then one that has. | Without a link the YouTube icon is **greyed out and does nothing**. With a link it is red and opens the video. An exercise without notes shows "No form notes for this exercise." | ☐ | |
| WRK-04 | 🔴 | On a fresh set, look at **Complete Set**. Fill in weight, then reps, then tap Easy/Medium/Hard. | It stays **greyed out** until weight, reps **and** a difficulty are set. No difficulty is pre-selected. Tapping the selected one again clears it. | ☐ | |
| WRK-05 | 🔴 | Complete a set that is not the last of its exercise. | Saved with no pop-up, the rest timer starts, then the next set appears with its chip highlighted and the previous set's numbers shown as **grey hints** in the empty fields. | ☐ | |
| WRK-06 | 🔴 | Complete the **last set** of an exercise. | You stay on the screen. It shows the logged weight × reps, **Next exercise** and **+ Add extra set**. **No timer is running.** Tapping Next exercise starts the rest between exercises, then the next exercise opens. | ☐ | |
| WRK-07 | 🔴 | While an exercise still has unlogged sets, look at **+ Add extra set**. | It is **greyed out and cannot be tapped.** | ☐ | |
| WRK-08 | 🔴 | After the last set, tap **+ Add extra set**. | A new blank set appears (for example `4/5 sets` in the top bar, a 5th chip). An **Exercise name** field appears above the Form card, with the hint "Change the name to log a different exercise". Weight and reps are empty with grey hints. Form notes and the coach line of the original exercise are still shown. | ☐ | |
| WRK-09 | 🔴 | With that extra set open (don't complete it), tap **Skip to Next Exercise**, or open the top-right menu and pick another exercise. | The **top bar and the exercise name change correctly** to the other exercise. Open the menu again: the unfinished extra set is gone and the earlier exercise still shows its original count. (This was a bug in the old version.) | ☐ | |
| WRK-10 | 🔴 | Add an extra set, complete it, add another, complete it, and so on 2-3 times. | After each one the count is always logged/total (`4/5`, then `5/5`, then `5/6` when you add another...). It never jumps around. Each extra set is saved. | ☐ | |
| WRK-11 | 🔴 | Add an extra set and change its name to something else (for example `Dumbbell Press`). | The top bar shows the new name and `0/1 sets`. The Form card says there are no notes, the original coach line disappears, and the video icon greys out. Complete it. It is saved. | ☐ | |
| WRK-12 | 🟡 | On an extra set, type another name, then type the **original** name back. | The original notes, video link and coach line come back. | ☐ | |
| WRK-13 | 🔴 | Log a set with a wrong number. Tap its **✓ chip**, change weight and reps in the pop-up, then **Save changes**. | The new numbers show. Open the day on the calendar afterwards: the log shows the **corrected** values. Nothing else changed. | ☐ | |
| WRK-14 | 🟡 | In that pop-up, set reps to `0` or clear the weight, then save. | A message says the numbers are not valid and nothing is saved. | ☐ | |
| WRK-15 | 🔴 | Open the top-right menu mid-workout. | Every exercise is listed with `logged/total` sets. The current one is highlighted. A renamed extra set appears as its own row. Tapping a **finished** exercise opens it (with Add extra set and the ✓ chips); tapping an unfinished one opens its first undone set. | ☐ | |
| WRK-16 | 🔴 | Tap **Finish Workout** while some planned sets are still undone. | A pop-up: "You haven't done N planned set(s). Finish the workout anyway?" with **Go back** and **Finish anyway**. Go back leaves everything as it was. Finish anyway completes the workout. If every set is done there is no pop-up. | ☐ | |
| WRK-17 | 🟡 | On an exercise you have done on several days, look at the **Previous Workout** card. Tap `<` and `>`. | It shows the date and `1/n`. `<` goes to older sessions (up to 8), `>` comes back. Each arrow is greyed out at its end. An exercise with no history shows "No earlier sessions" and both arrows greyed. | ☐ | |
| WRK-18 | 🟡 | On an extra set, type the name of an exercise you have done before. | After a moment the Previous Workout card shows that exercise's history. | ☐ | |
| WRK-19 | 🟡 | Finish the **last exercise** of the workout. | The main button says **Finish workout** (not Next exercise), and **+ Add extra set** is still available. | ☐ | |
| WRK-20 | 🔴 | After finishing, open the workout from the calendar. | All logged sets are there, including extra ones and corrected ones. A renamed extra set appears under its own name. Sets Completed on the finish screen equals the number you logged. | ☐ | |
| WRK-21 | 🟡 | Put the app in the background in the middle of typing a set, then come back. | The numbers you typed and your position are unchanged. | ☐ | |
| WRK-22 | ⚪ | Do WRK-02, WRK-04 and WRK-08 in **dark theme**. | Chips, hints and the greyed-out button are readable. | ☐ | |
| WRK-23 | 🔴 | Finish a workout in which you beat your best on an exercise. | The finish screen shows time, sets completed and **kg lifted**, a gold card "A new record!" (or "2 new records!") listing each lift, a line such as "9 weeks in a row. Keep it going!" (and "3 sessions this week" from the second), and a **See my progress** link that opens My Progress. **Done** still returns as before. | ☐ | |
| WRK-24 | 🟡 | Finish a first-ever workout, or one without any new record. | No record card (the first time only sets the baseline); the streak line reads "Week 1 of your streak. A fine start." for a first week. | ☐ | |
| RES-01 | 🔴 | Start a workout, log 2 sets, then leave (Back → Exit). Look at **Home** and the **calendar day**. | The session is **not** shown as Done. Home's Today card says **Resume workout**; the calendar day offers **Resume workout** (not just a log). The Exit message says your logged sets are saved. | ☐ | |
| RES-02 | 🔴 | Tap **Resume workout**, then Start Workout. | The 2 logged sets are ticked (`✓1 ✓2`), you land on set 3, counts are right (`2/4`), and nothing is logged twice. The workout timer continues from the time you had before leaving (it does not restart at 00:00:00). | ☐ | |
| RES-03 | 🔴 | Finish the workout with **Finish Workout**. The summary appears; leave it with Done **or** the Back button. | Home shows **Done ✓** for it and no Resume button remains. | ☐ | |
| RES-04 | 🟡 | A workout logged by hand with **Log Weights Manually**. | It is shown as logged, never as Resume. | ☐ | |

---

## 9B. Look, feel and personal touches

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| UIX-01 | 🔴 | Open the app on a **fresh install** (or Settings → Personalise → **Replay welcome**). | A short welcome: (a dedication page if you set one), *Plan your week*, *Train, one set at a time*, and a page about the coach. **Next**, **Skip** and **Get started** work. It does not reappear after that. | ☐ | |
| UIX-02 | 🔴 | Look at every main screen in **dark** and in **light**: Home, Workout Plans, Sessions, Progress, Settings, a workout in progress. | One deep-teal accent on buttons, selected chips, the ribbon, the tab bar and progress bars. Text is readable everywhere; nothing is white-on-white or black-on-black. A fresh install starts in **light**. | ☐ | |
| UIX-03 | 🔴 | Settings → **Personalise**: enter a name, a signer, a greeting. Go to Home. | The greeting is the large line at the top of Home (Tamil text shows correctly). Urudhi and the Odiyan line move below it. | ☐ | |
| UIX-04 | 🔴 | With a signer set, open Settings and a workout start screen. | The section and the coach's card are called **Advice from <signer>**. With the signer empty it says **AI Coach**. | ☐ | |
| UIX-05 | 🔴 | Finish a workout. | The summary check animates in, and (if notes are set) a note appears under the summary, signed by the signer. | ☐ | |
| UIX-06 | 🟡 | On Home: with a workout planned today, with all done, on a rest day, and on a streak of 2+ weeks. | A note card appears in each case with the matching note from Personalise. A personal best in the last day shows the *personal record* note first. | ☐ | |
| UIX-07 | 🔴 | Log a set **heavier than anything you have logged before** for an exercise (it needs an earlier log of that exercise). | A "New personal best!" banner pops in at the top for a couple of seconds and the phone gives a stronger vibration. | ☐ | |
| UIX-08 | 🔴 | Complete a set that is not the last. Watch the rest screen. | A **circular countdown** with the seconds in the middle; the arc shrinks. **+15s** adds time and the ring grows. | ☐ | |
| UIX-09 | 🟡 | On a blank set (an extra set, or a first set you have never done) after a previous set. | A **Same as last: 70 kg × 8** button appears; tapping it fills weight and reps. It is not shown when the fields are already filled. | ☐ | |
| UIX-10 | 🔴 | Schedule a plan with **Remind me at…**, choose a time, schedule. Then look at a scheduled day in the calendar. | Sessions are added. At the chosen time on a session day a notification arrives (needs Notifications on in Settings). Deleting that session cancels its reminder. | ☐ | |
| UIX-11 | 🟡 | Home with at least 5 logged workouts and no backup in the last 30 days **since your last export, or since the first launch if you never exported**. A brand-new install never shows it on the first day. | A **Back up your data** card: **Back up now** opens Settings, **Later** hides it for a week. After you export, it stays away for 30 days. | ☐ | |
| UIX-12 | 🟡 | Home, after you have logged a workout: tap **Share my week**. | The share sheet opens with a short text summary (workouts done, weight lifted, streak). | ☐ | |
| UIX-13 | 🟡 | My Progress, scroll down. | A **Best lifts** card (up to 6 heaviest lifts). If you imported InBody scans (two or more), a **Body weight** line chart too. | ☐ | |
| UIX-14 | 🟡 | Open **Workout Plans** with no plans (delete them all or use a fresh install). | A friendly "No plans yet" card instead of an empty list. | ☐ | |
| UIX-15 | 🟡 | Home: look at the week circles and today card. | Today card is tinted teal with a large Start/Resume button; missed days are soft, not harsh dashes. | ☐ | |

---

## 10. My Progress

The Progress tab now has four tabs: **Overview**, **Exercises**, **Charts** and **History**. To see them filled in without weeks of training, load the sample history: `python tools/sample-data/make_sample_db.py sample.db`, copy it to the phone (`adb push sample.db /sdcard/Download/SimpleDB.db`), then **Settings > Import data**. It replaces everything, so use a test install. The numbers behind the cards are checked by `node -r sucrase/register tools/progress-tests/progressStats.test.ts`.

### 10.1 The page and its tabs

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| PRG-01 | 🔴 | Open **My Progress** (first time). | Title, then four tabs: **Overview, Exercises, Charts, History**. **Overview** is selected and is the first thing you see (no dropdowns). | ☐ | |
| PRG-02 | 🟡 | Tap **History**, switch to another bottom tab, come back. | It reopens on **History** (the last tab you used is remembered). | ☐ | |
| PRG-03 | 🔴 | Fresh install, no workouts logged. Open each tab. | Overview and Exercises show a friendly picture, "Your progress starts with the first workout", a bar "0 of 3 workouts logged" and a faded sample of what you will see. Charts shows its empty message. History says you are not tracking any workouts. No crash. | ☐ | |
| PRG-04 | 🟡 | Log one workout, then open Overview. | Streak, sessions this week and badges are filled in, and the "1 of 3 workouts logged" bar still shows below with the sample. | ☐ | |
| PRG-05 | ⚪ | Open My Progress on a phone with a big history. | Pulsing grey placeholder cards appear for a moment, then the real cards replace them without the page jumping. | ☐ | |
| PRG-06 | 🟡 | Log a workout, go to My Progress, pull the page down. | The spinner shows and the numbers update. | ☐ | |

### 10.2 Overview

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| PRG-10 | 🔴 | Open Overview with history loaded. | Order: the three big numbers (weeks in a row, sessions this week, badges), the week recap, Consistency, Highlights, **Best lifts** and **Body weight**, Muscle balance, Milestones, then the **See each exercise** button. Best lifts is no longer at the bottom of a long page. | ☐ | |
| PRG-11 | 🔴 | Compare the weeks in a row and sessions this week with Home. | The same numbers. The sentence under them says how much you lifted in the last 30 days, in tonnes once it is large (for example "8.4 tonnes"). | ☐ | |
| PRG-12 | 🟡 | Read the sentence in these situations: more than the previous 30 days; less; about the same; nothing logged. | "...X% more than the 30 before", "...a bit less than the 30 before. Easy weeks happen.", "...about the same...", "No weight logged in the last 30 days...". Never scolding. | ☐ | |
| PRG-13 | 🔴 | Look at the recap card, then tap **Share**. | It reads **This week** (or **Last week** if nothing was logged yet this week) with sessions, sets, kg lifted and records, and the heaviest lift. The share sheet opens with the recap **as a picture** (without the Share button in it, and with a small "Urudhi" in the corner). If the phone cannot share a picture it shares the same numbers as plain text. Nothing is shared until you tap Share and pick where it goes. | ☐ | |
| PRG-14 | 🟡 | Look at **Consistency**. | 12 columns (weeks, oldest left) and 7 rows (M to S). Days you trained are teal, darker for more lifted. Days after today are empty. It matches the calendar. | ☐ | |
| PRG-15 | 🟡 | With 3 or more sessions of one exercise in the last 60 days and a real rise (3% or more), look at **Highlights**. | A **Most improved** card names it with the rise in percent. Tapping it opens that exercise. With flat lifts the card is absent. | ☐ | |
| PRG-16 | 🟡 | Look at the records under Highlights. | At most 4 records, newest first, each with a trophy, date, and weight x reps. Tapping one opens that exercise. | ☐ | |
| PRG-17 | 🔴 | Beat your best on an exercise, then open My Progress. | A banner "New record! ..." shows once with a short buzz. Leave and come back: it does not show again for the same record. | ☐ | |
| PRG-18 | ⚪ | Turn on the phone's **Remove animations**, then repeat PRG-17 with a new record. | No banner and no buzz. | ☐ | |
| PRG-19 | 🔴 | Look at **Muscle balance**. | A front and a back figure with the muscles you trained coloured teal (stronger for more sets) and the rest pale. Under it one sentence and up to six bars with the number of sets. | ☐ | |
| PRG-20 | 🟡 | Check the balance sentence with: mostly push work; mostly pull; no leg work; an even mix; under 12 sets. | "Push work is well ahead...", "Pull work is well ahead...", "No leg work in the last 30 days...", "Push and pull are balanced...", "Log a few more sessions...". | ☐ | |
| PRG-21 | 🟡 | Look at **Milestones**. | Ten badges. Earned ones are teal, the rest faint. Tapping an unearned one says what it takes and where you are ("7 of 10"). Tapping an earned one says so. | ☐ | |
| PRG-22 | ⚪ | Tap **See each exercise**. | Switches to the Exercises tab. | ☐ | |
| PRG-23 | 🟡 | Open My Progress for the first time, then the Exercises tab. Tap **Got it** on each hint, then leave and return. | One short hint shows on Overview and one on Exercises. After Got it, each stays gone for good. | ☐ | |

### 10.3 Exercises

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| PRG-30 | 🔴 | Open **Exercises**. | One row per logged exercise, most recently trained first. Each shows the name, latest value, date, number of sessions, a small trend line and a percent (green up, red down, grey for flat). | ☐ | |
| PRG-31 | 🟡 | Type in the search box, then tap the x. | The list narrows as you type, "No exercise matches that." when nothing does, and the x clears it. | ☐ | |
| PRG-32 | 🟡 | With more than one muscle group logged, tap the muscle chips. | The list filters to that muscle. **All** brings it back. | ☐ | |
| PRG-33 | 🟡 | Find a bodyweight exercise (for example Plank). | Its latest value is in **reps**, not kg. | ☐ | |
| PRG-34 | 🔴 | Tap a row. | That exercise's own page opens (10.4). | ☐ | |

### 10.4 One exercise

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| PRG-40 | 🔴 | Open an exercise with several sessions. | Name at the top, a back arrow, a switch between **Estimated max / Heaviest set / Total lifted**, time frame chips **4 weeks / 3 months / 1 year / All**, a chart, a sentence, three tiles, last session set by set, and Records. | ☐ | |
| PRG-41 | 🟡 | Tap each metric. | The chart and numbers change. A bodyweight exercise has only **Reps** and no switch. | ☐ | |
| PRG-42 | 🟡 | Note the opening time frame, then tap each chip. | It opens on **3 months** when that has at least 2 sessions, otherwise on **All**. A frame with no sessions says "No sessions in this time frame" and **Show everything** fixes it. | ☐ | |
| PRG-43 | 🟡 | Look at the chart. | A few gridlines with kg labels, dates under both ends, gold larger dots for records, a faint dashed trend line when there are 3 or more points. A break of two weeks or more between sessions is drawn as a faint dotted line instead of a steep climb. With more than 30 sessions the dots get smaller. | ☐ | |
| PRG-44 | 🔴 | Press and drag a finger along the chart. | The nearest session's dot grows, a card shows its date, value and every set, and **the page does not scroll** while you drag. Letting go keeps the last one. | ☐ | |
| PRG-45 | 🔴 | Read the sentence under the chart for a rising, a falling, a flat and a one-session exercise. | "Up 12% in 8 weeks. Best: 52.5 kg on 3 Mar.", "Down 20% ... A lighter spell is normal and you can build back.", "Holding steady ...", "One session so far ... Log it again to see a line." | ☐ | |
| PRG-46 | 🟡 | Tap the (i) button. | A short plain explanation of the chosen metric. Tap again to hide it. | ☐ | |
| PRG-47 | 🟡 | Look at the three tiles and the lists. | **Best**, **Latest**, **Sessions** (with the percent since the first). Last session lists each set. **Records** lists up to 5, newest first. | ☐ | |
| PRG-48 | 🟡 | Open an exercise with only one logged session. | A big number and "Log it once more and a line appears." No broken chart. | ☐ | |
| PRG-49 | 🟡 | On an exercise with history older than the chosen time frame, look under the sentence. | A second softer line: "Against the 3 months before: best 111 kg then, 129 kg now, up 16%." It is absent for **All** and when there is nothing before. | ☐ | |

### 10.5 Charts (the full tools)

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| PRG-50 | 🔴 | Open **Charts**. | A ribbon **Getting stronger? / Doing enough? / Balanced?** (captions By exercise, By workout, Overall) at the top, staying on top in every mode. No second title, no Best lifts card and no View Logs button on this tab. | ☐ | |
| PRG-51 | 🔴 | Open Charts on a phone with history. | It opens already showing the most recently trained workout, day and exercise with a graph drawn (not empty dropdowns), measured as **Estimated max**. | ☐ | |
| PRG-52 | 🟡 | Look at the metric buttons and their heading. | Heading **What to show**. Names are plain: **Each set, Effort score, Estimated max, Reps**, and in By workout **Duration**. | ☐ | |
| PRG-53 | 🔴 | Look above the chart. | The time frame buttons **Week, Month, 3 Months, Year, All Time** sit directly above the chart with no heading. **3 Months** is selected first. Changing it redraws the chart. | ☐ | |
| PRG-54 | 🟡 | Look under the chart, then tap the (i) next to the title. | No long explanation box by default. The (i) shows it and hides it again. | ☐ | |
| PRG-55 | 🟡 | Read the line under the chart in each mode. | A plain sentence such as "Up 12% over this time frame." (or the average session length for Duration). Nothing shown for pie style charts. | ☐ | |
| PRG-56 | 🟡 | Tap a dot on a chart. | The session details popup still opens (as before). | ☐ | |
| PRG-57 | 🟡 | In **By workout** and **Overall** try every metric and the muscle charts. | Each still renders with data and does not crash. | ☐ | |
| PRG-58 | 🟡 | Open **Each set** (or By workout with several days) so several colours show. | Colours stay easy to tell apart for someone who cannot tell red from green (orange, sky blue, green, yellow, blue, vermilion, pink, grey...). | ☐ | |

### 10.6 History and logs

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| PRG-60 | 🔴 | Open **History**. | **All Logs** and one row per plan that has logs. | ☐ | |
| PRG-61 | 🔴 | Tap the **trash** icon on a plan row, then confirm. Then repeat with a long press on another row. | Both ask first, then delete that plan's logged sets. Overview and Exercises show the lower numbers when you go back. | ☐ | |
| PRG-62 | 🟡 | Open **All Logs**: expand a session; tap an exercise to edit a set; save. | Edits persist and the charts and Overview update. | ☐ | |
| PRG-63 | 🟡 | In All Logs, set a **start and end date**. | List filters to that range. | ☐ | |
| PRG-64 | 🟡 | Tap the **export** icon in the logs. | A CSV file is created and the share sheet opens. Dates in it read `dd-mm-yyyy`. | ☐ | |

### 10.7 Look, feel and care

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| PRG-70 | 🔴 | Switch to the dark theme and visit all four tabs and an exercise page. | Everything is readable: cards, chart lines, gold dots, body map, badges. | ☐ | |
| PRG-71 | 🟡 | Set the phone's font size to large and look at the tabs, hero numbers and cards. | Nothing is cut off or overlaps. | ☐ | |
| PRG-72 | ⚪ | With TalkBack on, move over the tabs, a heat cell and a badge. | Tabs say selected; each heat cell says the date and whether you trained; each badge says earned or how far. | ☐ | |
| PRG-73 | ⚪ | Tap the small controls: the (i), time frame chips, trash icon, search clear. | Each is easy to hit (about 44 dp), no mis-taps. | ☐ | |
| PRG-74 | 🔴 | On a build with a personal coach voice, open the Progress tab. | The same page works. No text mentions AI or a name that should not be there. | ☐ | |
| PRG-75 | 🟡 | Scroll Overview and switch tabs with 12 weeks of history. | Smooth, no freezes, tab switches take under a second. | ☐ | |
| PRG-76 | 🟡 | Look at every number on these pages. | Only kg (never lb); thousands have a comma (1,250); no more than one decimal. | ☐ | |
| PRG-77 | 🟡 | Read all the new text. | No dashes used as punctuation (only commas, colons, plain hyphens). | ☐ | |
| PRG-78 | 🟡 | Make a year of history (`python tools/sample-data/make_sample_db.py year.db 0 52`), import it and use all four tabs. | About 140 sessions and 2,000 sets load in a second or two; scrolling, tabs and the exercise chart stay smooth. | ☐ | |

---

## 10A. Goals, streak care and motivation

These need history to show up. Use the sample data from section 10 (`make_sample_db.py`; its newest session can be moved back with the second argument to test the comeback card, for example `python make_sample_db.py old.db 20`).

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| GOL-01 | 🔴 | Open an exercise you lift with weight (My Progress > Exercises > one). Under the chart find **Goal** and tap **Set a goal**. | A sheet "Goal for <exercise>" shows your heaviest so far, a target weight (a sensible default a little above it) and date chips **4 weeks, 8 weeks, 12 weeks, No date**. | ☐ | |
| GOL-02 | 🔴 | Save a goal of 60 kg for 8 weeks. | The Goal card shows a ring with the percent, "60 kg on one set" and a sentence such as "52.5 of 60 kg, 70% of the way. 8 weeks left, on track." The chart switches to **Heaviest set** and shows a gold dotted line "Goal 60". | ☐ | |
| GOL-03 | 🟡 | Make the goal harder than your pace (for example a very near date), or let the date pass. | The sentence says "a little behind, still within reach", or "The date has passed, and it is fine to move it". Never scolding. | ☐ | |
| GOL-04 | 🟡 | Lift the target on one set (or set a goal at or below your heaviest). | Ring turns green at 100% and the sentence reads "Goal reached: 60 kg on <exercise>. Well done!". | ☐ | |
| GOL-05 | 🟡 | Tap **Edit**, change the weight, keep **No date** selected. | Saves with the date you already had. **Remove goal** deletes it. | ☐ | |
| GOL-06 | 🟡 | On a different metric (Estimated max) with a goal set, look at the Goal card. | A **Show on chart** link switches to Heaviest set, where the dotted line is drawn. | ☐ | |
| GOL-07 | 🟡 | Open **Overview**. | A **Goals** card lists up to 4 goals with a ring and sentence each; tapping one opens the exercise. With none, it explains goals and has **Choose an exercise**. | ☐ | |
| GOL-08 | 🟡 | Set a goal that is within 20 percent of done (you at least 80% there). Open Home. | The one motivation card reads "Nearly there: <exercise>" with the sentence. Tapping opens the exercise. | ☐ | |
| GOL-09 | 🔴 | Skip this week's training until Thursday or later, with a streak of 1 or more weeks. Open Home. | The card "Keep your streak going": "3 days left this week. One session keeps your 9 week streak." On Sunday: "Last day of the week. One session today keeps your 9 week streak." It does not show Monday to Wednesday, or once you trained this week. | ☐ | |
| GOL-10 | 🔴 | On that card tap **Ill or away? Mark this week as a rest week**. | The card becomes "Rest week is on. Your streak is safe..." with **Undo**. The streak number stays the same on Home and Overview (it holds, it does not grow). Next week, if you train, the streak carries on. | ☐ | |
| GOL-11 | 🟡 | On Overview tap "Ill or away this week? Mark it as a rest week", then tap it again. | It turns on ("Rest week is on, your streak is safe. Tap to undo.") and back off. Home agrees. | ☐ | |
| GOL-12 | 🔴 | Use data whose newest session is 10 or more days old (`make_sample_db.py old.db 12`). Open Home. | The card titled "Welcome back": 10 to 20 days "A short break is nothing...", 21 to 41 days "Start a little lighter...", 42 or more days "A long break is just part of the story...". Never a count of missed days. | ☐ | |
| GOL-13 | 🟡 | Train on an exercise for 4 weeks without any rise in its best (or use data that is flat). Open Overview and that exercise. | A card "A little stuck on <exercise>?" with one gentle tip (easier week, one more rep, a variation, sleep and food, slower lowering). **Hide this for 4 weeks** on the exercise page hides it, and it comes back later. | ☐ | |
| GOL-14 | 🟡 | Be 1 to 3 sessions from a badge (for example 8 of 10 sessions) with nothing more urgent. Open Home. | "Your next badge": "2 more sessions to the "10 sessions" badge." Tapping opens My Progress. | ☐ | |
| GOL-15 | 🟡 | Overview: tap **Write it** on **Why I started**, type a line, save. Then open Home on a calm day. | The line appears on Overview in italics and on Home as "Why you started" when nothing more urgent is showing. **Edit** changes it; saving an empty line clears it. It stays on the phone. | ☐ | |
| GOL-16 | 🟡 | Overview: look at the month card. | "October so far" (or the month just ended in the first 5 days of a month, titled "... in review"): sessions, active days, kg lifted, records, change against the month before, heaviest lift and most trained muscle. | ☐ | |
| GOL-17 | 🟡 | Tap **Share** on the month card. | The share sheet opens with the card as a picture (no Share button in it, "Urudhi" in the corner); the text version is used if the phone cannot share a picture. | ☐ | |
| GOL-18 | ⚪ | In a month with no sessions, open the month card. | "No sessions in <month> yet. One workout is all it takes to start the month." | ☐ | |
| GOL-19 | 🟡 | Check every motivation text. | Warm, never scolding, no dashes used as punctuation, English only (or the personal build's own voice for the notes). | ☐ | |
| GOL-20 | 🟡 | Close and reopen the app. | Goals, the weekly number, rest weeks, hidden tips, "Why I started" and the dismissed checklist are all still there. | ☐ | |
| GOL-21 | ⚪ | Charts tab: look at the three buttons at the top. | They are named by question: **Getting stronger? (By exercise)**, **Doing enough? (By workout)**, **Balanced? (Overall)**. They behave as before. | ☐ | |
| GOL-22 | ⚪ | Switch between Overview, Exercises and back several times. | The numbers appear at once (no spinner after the first load) and refresh a moment later. | ☐ | |

---

## 11. Backup and restore

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| BKP-01 | 🔴 | Settings → Data Management → **Export Data**. Save the file. | A `Urudhi-dd-mm-yyyy.db` file is shared. | ☐ | |
| BKP-02 | 🔴 | Make a visible change (delete a workout). Then **Import Data** with the file from BKP-01. Confirm. Restart the app when told. | The deleted workout is back; everything matches the moment of export. | ☐ | |
| BKP-03 | 🟡 | Import Data and press **Cancel** at the confirmation. | Nothing changes. | ☐ | |
| BKP-04 | 🟡 | Import a **database exported from the old (pre-redesign) version**, if you have one. | Imports; workouts, days, logs all present; the app works normally (new columns are added automatically). Scheduling a plan works for these workouts. | ☐ | |
| BKP-05 | ⚪ | Try to import a file that is not a database. | A clear failure message; your data is untouched. | ☐ | |

---

## 12. AI Coach - key and connection

*Skip sections 12-17 if you don't want to use your key.*

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| AIK-01 | 🔴 | Settings → AI Coach. Paste your key, tap **Save key**. | "API key saved on this device." The text box clears (the key is never shown again). | ☐ | |
| AIK-02 | 🔴 | Tap **Test connection**. | "Connected - the key works." | ☐ | |
| AIK-03 | 🟡 | Delete the key, paste a **wrong** key (change a few characters), test. | A clear message that Anthropic rejected the key. | ☐ | |
| AIK-04 | 🟡 | **Delete key** (button next to Save key). | Status resets; AI features ask for a key. | ☐ | |
| AIK-05 | 🟡 | Save a valid key again after the previous tests. | Works as in AIK-02. | ☐ | |
| AIK-06 | 🟡 | Export your data (Settings) and open the file in a text editor or hex viewer, search for part of your key. | The key is **not** in the export. | ☐ | |

---

## 13. AI Coach - notes before a workout

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| CCH-01 | 🔴 | With a valid key and some logs (ideally with comments such as "pinching" or ratings "Hard"), open **today's** workout start screen. | A **Coach's note** card shows "Reviewing your recent training…" then a short note. | ☐ | |
| CCH-02 | 🟡 | Leave and reopen the same workout the same day. | The same note appears instantly. No new charge (check *Used this month* in Settings). | ☐ | |
| CCH-03 | 🟡 | Open an exercise screen during the workout. | If the coach had a specific point for it, a short note shows on that exercise. | ☐ | |
| CCH-04 | 🟡 | Open a workout scheduled for a **future or past** day. | No new note is generated (only today's workout gets one). | ☐ | |
| CCH-05 | 🟡 | New workout with no history and no saved injuries. | No note appears (normal). | ☐ | |
| CCH-06 | 🟡 | Remove the key and open today's workout. | No note, no error pop-up. | ☐ | |
| CCH-07 | 🟡 | Open a workout for a muscle group you have **not trained for 2+ weeks** (a note is written once per day, so use a day that has no note yet). | The note does **not** say to keep adding weight. It suggests easing back in or starting near your last loads. | ☐ | |
| CCH-08 | 🔴 | Read any coach note. | Weights are in **kg**. The note never says lb, lbs or pounds. | ☐ | |

---

## 14. AI Coach - generate a plan

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| GEN-01 | 🔴 | Workout Plans → **Generate a plan with AI**. | A form with sections **About you** (experience, main goal, focus areas), **Your week** (training days, time per session, split), **Preferences** (intensity, equipment, injuries, likes/dislikes). | ☐ | |
| GEN-02 | 🔴 | Before choosing any day, look at the **Generate plan** button. | Greyed out, with "Pick at least one training day." | ☐ | |
| GEN-03 | 🟡 | Select four or more focus areas, then tap **All**, then **All** again. | No limit. **All** selects every area; tapping it again clears them. | ☐ | |
| GEN-04 | 🟡 | Check the **Injuries and constraints** card. | Shows what you saved under Settings → AI Coach, or a hint to add some. | ☐ | |
| GEN-05 | 🔴 | Pick Mon / Wed / Fri, a goal, 60 min, and **Generate plan**. | A spinner, then (within about a minute) a **DRAFT** with a name and one day per training day. Each day shows its weekday (for example "Upper A · Mon"). | ☐ | |
| GEN-06 | 🔴 | Read the draft against your inputs. | Number of days matches your training days; focus areas get extra attention; nothing uses equipment you did not select; nothing aggravates a saved injury. Note anything that does. | ☐ | |
| GEN-07 | 🔴 | Type "swap one exercise for a dumbbell version" under **Ask for changes** → **Refine**. | A revised draft; only what you asked changed. | ☐ | |
| GEN-08 | 🟡 | Tap **Undo last refinement**. | Goes back one step. | ☐ | |
| GEN-09 | 🔴 | Edit the plan name and tap **Save plan**. | "Plan saved. Put it on your calendar now?" | ☐ | |
| GEN-10 | 🔴 | Choose **Schedule it**. | The scheduler opens with the AI's weekdays pre-filled. | ☐ | |
| GEN-11 | 🟡 | Choose **Not now**. | The saved plan opens as a normal workout with weekdays. | ☐ | |
| GEN-12 | 🟡 | Save a second plan with the **same name** as an existing workout. | A clear message that the name is taken; nothing lost; you can rename and retry. | ☐ | |
| GEN-13 | 🟡 | With a draft showing, press Back. | Asks to discard; Cancel keeps it, Discard leaves. | ☐ | |
| GEN-14 | 🟡 | Refine five or more times. | A gentle note that many rounds have been used. | ☐ | |
| GEN-15 | ⚪ | Try unusual choices: 5-day Push/Pull/Legs, or **Bodyweight only**, or 30-minute sessions. | The plan is still sensible (or clearly says why not). | ☐ | |
| GEN-16 | ⚪ | Try "Let the coach decide" with 2 days and with 6 days. | Reasonable splits (for example upper/lower for 2). | ☐ | |
| GEN-17 | 🔴 | Generate any plan and open a few exercises (and a warm-up or cardio entry). | Every exercise has a **thorough** form note: why, setup, how to do it with tempo, and what to avoid (about 3 to 6 sentences). Warm-up, cardio and stretching entries are numbered steps with counts. No em dashes. The same holds after **Refine**. | ☐ | |
| GEN-18 | 🟡 | Fresh install: on the first welcome page ("How do I call you?") type a name and finish. Then open Settings > Personalise: the Name field shows it. Then generate a plan and look at Home. | Home greets you with *Hi, <name>!*. The name is used in the notes at nice moments and may appear in a coach note or plan note. | ☐ | |
| GEN-19 | 🟡 | Create a plan by hand with an exercise the video list knows (for example "Plank" or "Goblet Squat"), then start that workout. Also generate an AI plan. | The known exercise has a lit YouTube icon that opens its clip. An exercise the list does not know has the greyed icon. AI plans that use a listed name get the link too. | ☐ | |

---

## 15. AI Coach - profile and body data

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| PRF-01 | 🟡 | Settings → AI Coach: toggle some **equipment** chips; type an **injury** (for example "left shoulder hurts on overhead pressing"); tap elsewhere. Close and reopen the app. | Both are remembered. | ☐ | |
| PRF-02 | 🟡 | Generate a plan with that injury saved. | Notes mention working around it; no overhead pressing. | ☐ | |
| INB-01 | 🔴 | **Import InBody CSV**: pick your real export (or the Appendix B sample). | "Imported N scans" style message; the card shows how many scans and the latest date. | ☐ | |
| INB-02 | 🟡 | Import the same file again. | No duplicates (counts unchanged). | ☐ | |
| INB-03 | 🟡 | Generate a plan after importing. | Works. (Whether the plan *uses* the numbers is up to the model; just confirm nothing breaks.) | ☐ | |
| INB-04 | 🟡 | Import a CSV that has the wrong columns (any other CSV). | A clear error; existing data untouched. | ☐ | |
| INB-05 | 🟡 | **Delete body data**. | Scans are gone; the card says none stored. | ☐ | |
| INB-06 | 🔴 | **Your real InBody export** (not the sample): does it import? | Imports without error and the latest weight shown matches your scan. If it fails, send the first two lines of the file (the header line and one row) so the parser can be fixed. | ☐ | |

---

## 16. AI Coach - spending limit

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| LIM-01 | 🔴 | Settings → AI Coach: find **Monthly AI spending limit** and the "Used this month" line. | Shows spend, limit (default **$2.00**) and number of requests. | ☐ | |
| LIM-02 | 🟡 | Make an AI request (Test connection) and come back. | The request count goes up by 1; the spend moves by a tiny amount. | ☐ | |
| LIM-03 | 🟡 | Set the limit to `0.01` and **Save**, then try Test connection. | Blocked with "You've reached your monthly AI limit…". The request count does **not** go up. | ☐ | |
| LIM-04 | 🟡 | Set the limit back to `2` and test again. | Works. | ☐ | |
| LIM-05 | ⚪ | Try invalid limits: `0`, `-5`, `abc`, `5000`. | Rejected with a message (allowed range up to 1000). | ☐ | |

---

## 17. AI failure modes

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| ERR-01 | 🔴 | **Airplane mode** on, then Generate plan (or Test connection). | A plain "couldn't reach the AI service" style message; the app does not freeze or crash. Turn it off again afterwards. | ☐ | |
| ERR-02 | 🟡 | Turn airplane mode on **while a plan is generating**. | An error message after the timeout; nothing saved; you can retry. | ☐ | |
| ERR-03 | 🟡 | (Only if you are happy to) use a key with **no credit**. | "Your Anthropic account is out of credits." | ☐ | |
| ERR-04 | ⚪ | Use the app normally with **no key at all**. | Everything except AI works; AI buttons explain a key is needed. | ☐ | |

---

## 18. Dark theme

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| DRK-01 | 🔴 | Settings → **Switch to Dark**. Visit each screen: Home, Workout Plans, a workout, the editor, scheduler, calendar, start screen, workout in progress, progress graphs, logs, settings, AI plan form and draft. | Text is readable everywhere (no dark-on-dark or white-on-white). The new **Home** cards, **weekday buttons**, the **scheduler**, and the **AI form** chips are the new things, so look hardest there. | ☐ | |
| DRK-02 | 🟡 | Switch back to light. | Back to normal; setting remembered after restart. | ☐ | |

---

## 19. Robustness

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| ROB-01 | 🟡 | Rotate the phone on Home, the scheduler and a workout. | Nothing breaks (the app may be portrait-only). | ☐ | |
| ROB-02 | 🟡 | Change the phone's **font size** to large (Android settings), and open Home, the AI form and the scheduler. | Text may be larger but nothing is cut off or overlapping to the point of being unusable. | ☐ | |
| ROB-03 | ⚪ | Change the phone **date/time** to tomorrow and open the app. | Home and calendar treat "today" as the new date. (Change it back afterwards.) | ☐ | |
| ROB-04 | ⚪ | Very long workout/exercise names (60+ characters). | Wrap or shrink; no overflow off the screen. | ☐ | |
| ROB-05 | ⚪ | Use the app for a week of normal life. | Note any slowness, crashes, or anything annoying. This is the real test. | ☐ | |

---

## 20. Known gaps (so you are not surprised)

- **Reminders for scheduled plans:** "Schedule a plan" does not set notifications. Reminders exist only when scheduling a single workout and choosing *Enable Notifications*.
- **Recurring Workouts** no longer exist. Sessions created by them earlier stay, but no new ones appear automatically. Use *Schedule a plan* instead.
- **English only.** Other languages and the date/time/week formats were removed on purpose.
- **Featured Workouts** were removed on purpose; use *Generate a plan with AI* or create your own.
- **AI plans are one repeating week** (the scheduler repeats it). There is no automatic progression week to week; weights come from your last session.
- **Not tested by me:** dark mode, a real phone, your real InBody export, alerts with the screen off, importing an old database, the welcome card.

---

## Appendix A - Sample shared workout (older format, no weekday)

Save this as `old-format-test.json` on the phone (any text editor) and import it in SHR-04.

```json
{
  "workout_name": "Old Format Test",
  "days": [
    {
      "day_name": "Day A",
      "exercises": [
        { "exercise_name": "Squat", "sets": 3, "reps": 8, "web_link": null, "muscle_group": "legs", "exercise_notes": null },
        { "exercise_name": "Plank", "sets": 3, "reps": 1, "web_link": null, "muscle_group": "abs", "exercise_notes": "Hold 45 seconds" }
      ]
    }
  ]
}
```

## Appendix B - Sample InBody CSV

Save as `inbody-sample.csv` and import it in INB-01. (The first row is the header. Dates are `YYYYMMDDHHMMSS`.)

```csv
Date,Weight(kg),Skeletal Muscle Mass(kg),Soft Lean Mass(kg),Body Fat Mass(kg),BMI(kg/m²),Percent Body Fat(%),Basal Metabolic Rate(kcal),InBody Score,Waist Hip Ratio,Visceral Fat Level(Level)
20260404120000,82.0,33.0,55.0,21.0,26.1,25.6,1650,70,0.92,9
20260808120522,79.5,34.0,56.0,18.0,25.3,22.6,1690,74,0.90,8
20260903090000,78.9,34.4,56.4,17.1,25.1,21.7,1705,76,0.89,7
```

## Appendix C - Bug report template

Copy this for each problem and send it to me (or paste it into a note):

```
ID:            (for example SCH-05)
Phone/Android: (for example Pixel 7, Android 15)
What I did:
What I expected:
What happened:
Screenshot:    (yes/no)
Happens every time?  (always / sometimes / once)
```

## Summary sheet

| Section | 🔴 count | Done | Failed | Notes |
|---|---|---|---|---|
| 1 Install | 1 | | | |
| 2 Home | 4 | | | |
| 3 Settings | 1 | | | |
| 4 Workouts | 3 | | | |
| 5 Weekdays | 1 | | | |
| 6 Sharing | 2 | | | |
| 7 Schedule a plan | 6 | | | |
| 8 Calendar | 4 | | | |
| 9 Doing a workout | 8 | | | |
| 9A Workout screen (incl. RES) | 18 | | | |
| 9B Look, feel, personal | 7 | | | |
| 10A Goals and motivation | 5 | | | |
| 10 Progress | 19 | | | |
| 11 Backup | 2 | | | |
| 12-17 AI Coach | 15 | | | |
| 18 Dark theme | 1 | | | |

**Total 🔴 cases: 99.**
