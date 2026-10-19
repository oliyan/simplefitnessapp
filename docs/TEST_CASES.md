# Urudhi — Phone Test Cases

**Build under test:** branch `workout-screen` at commit `e6d7c01` (includes the AI Coach work and the `minimal` changes)
**APK:** `Urudhi-test-e6d7c01.apk`
**Time needed:** about 110 minutes if you do it all; the 🔴 cases alone (62 of them) take about 70 minutes.
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
| 3 | Have your **Anthropic API key** ready (or plan to skip sections 12–17). | AI tests need it. |
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

*Set up first: schedule `T-Plan` for the coming weeks (section 7) and log at least one workout (section 9).*

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| HOM-01 | 🔴 | Open Home on a day with a scheduled workout. | **Today** card lists it with a **Start workout** button. | ☐ | |
| HOM-02 | 🔴 | Tap **Start workout**. | Opens that workout's start screen. **Back** returns to the **calendar** (not a blank or stuck screen). | ☐ | |
| HOM-03 | 🔴 | After logging today's workout, return to Home. | That session shows **Done ✓**. The *This week* circle for today is filled with a tick. | ☐ | |
| HOM-04 | 🟡 | Look at **This week**. | Monday to Sunday. Done = filled tick, planned = ring, missed (past, not logged) = dashed, rest = faint. Today underlined. "X of Y done" matches. | ☐ | |
| HOM-05 | 🟡 | Tap the **This week** card. | Opens the calendar. | ☐ | |
| HOM-06 | 🟡 | Check **Week streak** after logging in this week only. Then (if you have older logs) compare with how many consecutive weeks you trained. | Counts weeks (Mon–Sun) in a row with at least one logged workout. A new week with nothing logged yet does **not** reset it. | ☐ | |
| HOM-07 | 🟡 | Check **Lifted this week**. | Roughly the sum of weight × reps of this week's logged sets. Shows a comparison with last week (or "No data from last week yet"). | ☐ | |
| HOM-08 | 🟡 | Log a set heavier than you have ever lifted on one exercise (you need an earlier log of that exercise first). Return to Home. | It appears under **Recent personal records** with the weight × reps and "Today". | ☐ | |
| HOM-09 | 🟡 | Look at personal records for an exercise you have only ever done once. | Not listed (the first time only sets the starting point). | ☐ | |
| HOM-10 | 🟡 | On a rest day (nothing scheduled today). | Card reads **Rest day** and shows the next workout ("Next: Tomorrow · Pull"), or offers *Schedule a plan* if nothing is scheduled. | ☐ | |
| HOM-11 | ⚪ | Tap **Recent personal records**. | Opens My Progress. | ☐ | |
| HOM-12 | ⚪ | Scroll the page to the bottom. | **GitHub** button opens the repo in a browser. | ☐ | |
| HOM-13 | ⚪ | Make two sessions on the same day (one done, one not). | Both appear in *Today*, each with the right status. | ☐ | |

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
| WKT-01 | 🔴 | My Workouts → **Create a new workout**. Build `T-Plan` as described in section 0. Save. | It appears in the list. Opening it shows both days and their exercises with muscle-group tags. | ☐ | |
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
| SHR-02 | 🔴 | Delete that workout, then My Workouts → **import** button and pick the file. | The workout returns with all days, exercises **and weekdays**. | ☐ | |
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
| CAL-01 | 🔴 | Open **My Calendar**. | Month view, weeks start **Monday**. Legend: Today, Logged, Untracked, Upcoming. | ☐ | |
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
| RUN-11 | 🔴 | Finish all sets and tap **Finish Workout**. | A completion screen with total time and sets completed. The session shows as logged on the calendar and on Home. | ☐ | |
| RUN-12 | 🟡 | Start a workout, complete a couple of sets, then **swipe the app away** from recents and reopen the workout. | **Check, not expected to be perfect:** your logged sets are safe in the logs (calendar), but the workout screen starts again from set 1 and does not tick the sets you already did. Note exactly what you see. | ☐ | |
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
| WRK-10 | 🔴 | Add an extra set, complete it, add another, complete it, and so on 2–3 times. | After each one the count is always logged/total (`4/5`, then `5/5`, then `5/6` when you add another...). It never jumps around. Each extra set is saved. | ☐ | |
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

---

## 10. My Progress and logs

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| PRG-01 | 🔴 | Open **My Progress**. | Three graph types: **Exercise Stats**, **Workout Stats**, **Overall Stats**; a **Select Workout** menu; **View Logs**. | ☐ | |
| PRG-02 | 🔴 | Select a workout you have logged and look at each graph type. | Graphs render with your data; no crash; empty states are readable if there is no data. | ☐ | |
| PRG-03 | 🟡 | Tap a point on a graph. | Shows details for that session. | ☐ | |
| PRG-04 | 🟡 | **View Logs**: expand a session; tap an exercise to edit a set; save. | Edits persist and the graphs update. | ☐ | |
| PRG-05 | 🟡 | In View Logs, set a **start and end date**. | List filters to that range. | ☐ | |
| PRG-06 | 🟡 | Tap the **export** icon in View Logs. | A CSV file is created and the share sheet opens. Dates in it read `dd-mm-yyyy`. | ☐ | |

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

## 12. AI Coach — key and connection

*Skip sections 12–17 if you don't want to use your key.*

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| AIK-01 | 🔴 | Settings → AI Coach. Paste your key, tap **Save key**. | "API key saved on this device." The text box clears (the key is never shown again). | ☐ | |
| AIK-02 | 🔴 | Tap **Test connection**. | "Connected - the key works." | ☐ | |
| AIK-03 | 🟡 | Delete the key, paste a **wrong** key (change a few characters), test. | A clear message that Anthropic rejected the key. | ☐ | |
| AIK-04 | 🟡 | **Delete key** (button next to Save key). | Status resets; AI features ask for a key. | ☐ | |
| AIK-05 | 🟡 | Save a valid key again after the previous tests. | Works as in AIK-02. | ☐ | |
| AIK-06 | 🟡 | Export your data (Settings) and open the file in a text editor or hex viewer, search for part of your key. | The key is **not** in the export. | ☐ | |

---

## 13. AI Coach — notes before a workout

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

## 14. AI Coach — generate a plan

| ID | Pri | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| GEN-01 | 🔴 | My Workouts → **Generate a plan with AI**. | A form with sections **About you** (experience, main goal, focus areas), **Your week** (training days, time per session, split), **Preferences** (intensity, equipment, injuries, likes/dislikes). | ☐ | |
| GEN-02 | 🔴 | Before choosing any day, look at the **Generate plan** button. | Greyed out, with "Pick at least one training day." | ☐ | |
| GEN-03 | 🟡 | Select four focus areas. | The fourth is ignored (maximum 3). | ☐ | |
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

---

## 15. AI Coach — profile and body data

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

## 16. AI Coach — spending limit

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
| DRK-01 | 🔴 | Settings → **Switch to Dark**. Visit each screen: Home, My Workouts, a workout, the editor, scheduler, calendar, start screen, workout in progress, progress graphs, logs, settings, AI plan form and draft. | Text is readable everywhere (no dark-on-dark or white-on-white). The new **Home** cards, **weekday buttons**, the **scheduler**, and the **AI form** chips are the new things, so look hardest there. | ☐ | |
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
- **Reopening a workout after closing the app:** the workout screen restarts from set 1 and does not tick the sets you already logged (they are safe in the logs). This was already the case before this build.
- **English only.** Other languages and the date/time/week formats were removed on purpose.
- **Featured Workouts** were removed on purpose; use *Generate a plan with AI* or create your own.
- **AI plans are one repeating week** (the scheduler repeats it). There is no automatic progression week to week; weights come from your last session.
- **Not tested by me:** dark mode, a real phone, your real InBody export, alerts with the screen off, importing an old database, the welcome card.

---

## Appendix A — Sample shared workout (older format, no weekday)

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

## Appendix B — Sample InBody CSV

Save as `inbody-sample.csv` and import it in INB-01. (The first row is the header. Dates are `YYYYMMDDHHMMSS`.)

```csv
Date,Weight(kg),Skeletal Muscle Mass(kg),Soft Lean Mass(kg),Body Fat Mass(kg),BMI(kg/m²),Percent Body Fat(%),Basal Metabolic Rate(kcal),InBody Score,Waist Hip Ratio,Visceral Fat Level(Level)
20260404120000,82.0,33.0,55.0,21.0,26.1,25.6,1650,70,0.92,9
20260808120522,79.5,34.0,56.0,18.0,25.3,22.6,1690,74,0.90,8
20260903090000,78.9,34.4,56.4,17.1,25.1,21.7,1705,76,0.89,7
```

## Appendix C — Bug report template

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
| 2 Home | 3 | | | |
| 3 Settings | 1 | | | |
| 4 Workouts | 3 | | | |
| 5 Weekdays | 1 | | | |
| 6 Sharing | 2 | | | |
| 7 Schedule a plan | 6 | | | |
| 8 Calendar | 4 | | | |
| 9 Doing a workout | 7 | | | |
| 9A Workout screen | 14 | | | |
| 10 Progress | 2 | | | |
| 11 Backup | 2 | | | |
| 12–17 AI Coach | 15 | | | |
| 18 Dark theme | 1 | | | |

**Total 🔴 cases: 62.**
