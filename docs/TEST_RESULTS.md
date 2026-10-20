# Urudhi - Emulator Test Results

**Build:** `workout-screen` @ `fed968f` (APK `Urudhi-test-fed968f.apk`)
**Where:** Android emulator, 1080×2400, with the app's existing test data. Some workout-screen cases were first run on the earlier build `e6d7c01`; the code they touch did not change afterwards except for the resume feature, which was re-checked.
**Not covered:** real phone, real gym, screen-off behaviour, your real InBody file and old database. Those stay on your list.

Legend: ✅ passed · 🔧 failed, fixed in this build and re-checked · ⏭ not run (reason given) · ◐ partly checked

---

## Pass 1 - Core (must work or the app is broken)

| Area | Cases | Result |
|---|---|---|
| Install over existing data | INS-01 | ✅ |
| Home, today card, Done status | HOM-01, HOM-03 | ✅ |
| Home → Start workout → Back to calendar | HOM-02 | ✅ (checked on an earlier build) |
| Dates `dd/mm/yyyy`, Monday start | SET-03 | ✅ |
| Create workout, weekdays | WKT-01, WDY-01 | ✅ |
| Share a workout | SHR-01 | ✅ |
| Schedule a plan (preview, 8 sessions, duplicate guard) | SCH-01, 02, 03, 05 | ✅ |
| Calendar layout | CAL-01 | ✅ |
| Start screen has only rest times | RUN-01 | ✅ |
| Prefilled weights/reps, inline difficulty, rest timer, finish | RUN-03, 04, 11 | ✅ |
| Reopen after closing the app | RUN-12 | ✅ after the resume feature (see Findings) |
| Workout screen: top bar, card order, Complete gating | WRK-01, 02, 04 | ✅ |
| Rest → last set → Next exercise / Add extra set (no timer) | WRK-05, 06, 07 | ✅ |
| Extra set, count `3/4`, name field | WRK-08, 10 | ✅ |
| Skip / menu after an extra set: heading changes, extra dropped | WRK-09 | ✅ (your bug) |
| Rename an extra set and save it | WRK-11 | ✅ |
| Correct a logged set; log shows the new value | WRK-13 | ✅ |
| Menu lists exercises with counts; finished exercises open | WRK-15 | ✅ |
| Finish popup with undone sets | WRK-16 | ✅ |
| Logged sets show correctly on the calendar, renamed set under its own name | WRK-20 | 🔧 → ✅ |
| Resume a half-done workout (Home, calendar, ticked sets, completes cleanly) | RES-01, 02, 03 | ✅ |
| Settings contents (no weight unit), export file name | SET-01, BKP-01 | ✅ |

**Core result: all passed.** One bug found inside it (calendar grouped a renamed set under the wrong exercise) and fixed.

## Pass 2 - Primary

| Area | Cases | Result |
|---|---|---|
| Edit a workout, weekdays save and show (`Push · Mon`) | WKT-05 (weekday part) | ✅ |
| Validation: empty name, day without a name, exercise without sets | WKT-02, 03 | ✅ |
| Duplicate workout name | WKT-04 | 🔧 (said "Failed to create", now "A workout with this name already exists") |
| Delete a workout (list) | WKT-09 (delete part) | ✅ |
| Import old-format file; duplicate import refused | SHR-04, SHR-03 | ✅ |
| Scheduler: no weekday → button disabled; 8 / 12 weeks; across year end | SCH-09, 06, 13 | ✅ |
| Calendar: Quick Workout today, past date (manual log), duplicate guard | CAL-08, 09, 06 | ✅ |
| Rest-time fields: blank refused, `0` and `600` accepted | RUN-14 | 🔧 (alert title showed a raw key, now fixed) |
| Back mid-workout | RUN-13 | 🔧 (message said progress is lost; now says it is saved) |
| Progress: three graph types, workout graph renders | PRG-01, 02 | ✅ |
| Test connection, usage counter, limits, invalid limits | AIK-02, LIM-01..05 | ✅ |
| Coach note uses kg, no lb; time-gap rule in prompt | CCH-08 | ✅ (note read: kg only) |
| Generate plan: form, day gating, max 3 focus areas, draft with weekdays, injury respected | GEN-01, 02, 03, 05, 06 | ✅ |
| Refine, undo, save, "Schedule it" with weekdays prefilled | GEN-07, 08, 09, 10 | ✅ |
| Airplane mode: friendly error, no crash | ERR-01 | ✅ |
| InBody: import, wrong file refused, delete | INB-01, 04, 05 | ✅ |
| Training profile remembered | PRF-01 | ✅ |

## Pass 3 - Secondary

| Area | Cases | Result |
|---|---|---|
| Dark theme: Home and the workout screen readable | DRK-01 (partly), WRK-22 | ◐ ✅ |
| Previous Workout card: date, `1/1`, arrows greyed with one session | WRK-17 (one-session case) | ◐ |
| Form card without notes, video icon greyed | WRK-03 (no-link case) | ◐ |
| Sharing a non-workout file | SHR-05 | ✅ (the file picker will not offer it) |

## Pass 4 - Tertiary and not run

⏭ **Not run, and why**

| Cases | Reason |
|---|---|
| RUN-05, RUN-06 (vibration, sound, notification with screen off) | Needs a real phone |
| RUN-02 (permission prompt) | Already granted on this emulator |
| INB-06, BKP-04 (your real InBody file, old database) | Needs your files |
| AIK-03, 04, 05, 06, CCH-06, ERR-03 | Would delete or invalidate your saved key, which I do not have |
| INS-02, INS-04, BKP-02, 03, 05 | Needs a fresh install or database swap; skipped to protect the test data |
| WRK-17 (several sessions, `<` `>` stepping), WRK-18, WRK-19, WRK-21, WRK-12, WRK-14 | Not reached; logic is simple but unverified on screen |
| HOM-04..13, CAL-02..05, 07, 10, SCH-04, 07, 08, 10..12, 14, WKT-06..08, 10, WDY-02..05, PRG-03..06, GEN-11..16, CCH-01..05, 07, PRF-02, INB-02, 03 | Lower priority; not run in this session |
| DRK-01 on the other screens | Only Home and the workout screen checked |

---

## Findings from this run (all fixed in `fed968f`)

1. **Half-done workouts could not be resumed.** A workout with logged sets counted as Done and could not be reopened. Added **Resume workout** on Home and the calendar day (Workout_Log gets an `in_progress` column; hand-logged workouts are never marked).
2. **Calendar listed a renamed extra set under the planned exercise.** It now groups by the name the set was logged under, and numbers sets from 1.
3. **Missing English text.** 15 messages displayed their raw key (for example the rest-time alert title, "cancel", import failures, "no link"). Added.
4. **Exit message** said progress would be lost; it now says logged sets are saved.
5. **Duplicate workout name** gave a generic failure; now says the name exists.

## Still open / for your phone pass

- A workout saved with a name but **no days** is accepted (creates an empty workout). Harmless, but you may want it refused.
- Sets of a half-done workout left behind **before** this build have no resume marker and stay "logged".
- The Android date picker shows Sunday first. It is the system dialog and cannot be changed.
- The AI sometimes names a day oddly ("Pull & Legs (Back Focus)" in an upper-body plan). Content, not a bug.

---

## Pass 5 - AI features with a real key (fresh install, build `7616e6b`)

Run on a freshly wiped emulator, in the order a new user would meet things. The key was pasted by the owner. Cost: about $0.05 for 6 requests.

| Area | Cases | Result |
|---|---|---|
| Save key, test connection, usage counter | AIK-01, 02, LIM-02 | ✅ |
| Generate plan (Mon/Wed/Fri, chest + back) | GEN-01, 05, 06 | ✅ |
| Refine changes only what was asked; Undo restores the draft exactly | GEN-07, 08 | ✅ |
| Save the plan, then **Schedule it** with the AI's weekdays pre-filled, 12 sessions added | GEN-09, 10 | 🔧 → ✅ |
| Same name as an existing plan: clear message, nothing lost | GEN-12 | ✅ |
| Back with a draft: Cancel keeps it, Discard leaves | GEN-13 | ✅ |
| Coach note with no history: none, no error | CCH-05 | ✅ |
| Coach note with history (a Hard set, 7 days ago): written, mentions it, kg only | CCH-01, 08 | ✅ |
| Reopen the same workout: same note, no new request | CCH-02 | ✅ |
| Limit 0.01 blocks the next request; back to 2 works | LIM-03, 04 | ✅ |

### Bugs found and fixed in this pass

1. **Saving an AI plan failed on a fresh install** ("could not save"). The `weekday`, `web_link`, `muscle_group` and `exercise_notes` columns were only added when the Workout Plans tab had been opened. They are now added when the database opens, and again before a plan is written (`a2a1599`). "Create new workout plan" and importing a shared plan had the same problem.
2. **Scheduling a plan failed on a fresh install.** `notification_id` and `completion_time` were only added when the Sessions tab opened. Same fix (`7616e6b`).

### Notes

- A coach note is written once per day for a workout, and "nothing to say" is remembered too. If you open today's workout before you have any history, there is no note for that workout for the rest of the day.
- The note is made on the exercise screen after **Start Workout**, not on the first overview.
- On the overview, a long exercise name can make the muscle chip overlap the bookmark icon (cosmetic).
- Not run: AIK-03..06, ERR-02, ERR-03 (would remove the key), GEN-11, 14..16, CCH-03, 04, 06, 07, PRF-02, INB-*.

---

## Pass 6 - Remaining cases on the emulator (build `7fb6161`)

Run on the emulator after Pass 5, with real data: a scheduled plan, sessions logged on 12, 14, 16 and 19 Oct, and a second session left half-done.

| Area | Cases | Result |
|---|---|---|
| Home: week, today with two sessions, streak, lifted this week (+ % vs last week, maths checked by hand), records, share my week | HOM-04, 06, 07, 08, 13, UIX-12 | ✅ |
| Personal best banner, circular rest ring, "Same as last" chip, PB note on Home | UIX-07, 08, 09, 06 | ✅ (vibration needs a phone) |
| Calendar: day styles, month arrows, day list, long-press delete asks first, "Schedule a plan" asks for the plan first | CAL-02, 03, 04, 07, SCH-11 | ✅ |
| Scheduler: a day with no weekday is left out with a note; Back schedules nothing; the preview skips days that already have a session | SCH-10, 12 | ✅ |
| Scheduler reminder: Android registered an alarm for every session at the chosen time | UIX-10 | ◐ registered; firing not waited for |
| Edit plan: add exercise, move a day (weekday travels with it, order is kept) | WKT-06, 07, WDY-04 | ✅ |
| Progress: Best lifts card, View Logs, date range (needs both dates), edit a set, CSV export + share sheet | UIX-13, PRG-04, 05, 06 | ✅ |
| Workout screen: Previous Workout `<` `>` over 3 sessions, correcting a set with 0 reps is refused, menu shows counts, extra-set name restores notes and shows history | WRK-17, 14, 15, 12, 18 | ✅ |
| Finish button: only becomes "Finish workout" when nothing is left unlogged | WRK-19 | ✅ (by design) |
| Rotation (app stays portrait), large system font (usable) | ROB-01, 02 | ✅ / ◐ (one word breaks mid-way in the Today card) |
| Dark theme: Home, plans, editor, scheduler, calendar, start screen, workout, progress, logs, settings, AI form | DRK-01 | ✅ |

### Bugs found and fixed in this pass

1. **Editing a plan wiped the sets of a session already in progress.** Adding or editing an exercise rewrote the exercise list of every session from today onwards. That included today's half-done session, so its logged sets lost their link and Resume showed 0 sets. Sessions that already have logged sets are now left alone.
2. **Home opened the wrong workout** when a workout screen was already open on the Sessions tab (Resume on Push showed Legs). Each workout now has its own screen.
3. **"Finish Workout" label was tiny** on the workout screen, and the progress read `%5` instead of `5%`.
4. **Best lifts listed "0 kg × 12"** for exercises logged without a weight. Zero-weight sets are no longer listed. The View Logs button now uses the teal button colour.
5. **The edit-set pop-up in All Logs showed the date as `10/19/2026`.** It now reads like the rest of the app.

### Still not run

- Phone only: vibration, notification sound, reminders actually firing, screen-off behaviour, real gym use.
- UIX-11 (backup reminder card: needs 30 days since the last export) was checked on an earlier build only.
- BKP-02 (restore *your own* export): the export file cannot be read off the emulator. The same import path was run with an old-format database (BKP-04).

### Small things to know

- The Edit screen shows the end of a long name, not the start.
- Hand-logging (Track Weights) saves every shown set, so a blank weight is saved as 0 kg. That is how it was built (bodyweight moves have no weight).
- When you pick only a start date in All Logs, nothing is filtered until you also pick an end date.

---

## Pass 7 - The rest of the list (build `5d0eeab` + one small Home change)

| Area | Cases | Result |
|---|---|---|
| Home: tap *This week*, tap *Recent personal records*, GitHub opens in the browser | HOM-05, 11, 12 | ✅ (HOM-05 needed a fix, below) |
| Rest day card (*Next: Tomorrow ·…*), and the app follows a changed phone date ("3 days ago") | HOM-10, ROB-03 | ✅ |
| Scheduler: past dates greyed out, the preview moves, weekday changes are remembered on the plan, repeat scheduling says how many were already there | SCH-07, 08 | ✅ |
| Calendar: Quick Workout on a future date returns to the calendar; a reminder (08:00) is registered with Android | CAL-10, 05 | ✅ (firing not waited for) |
| No *Recurring Workouts* button | SCH-14 | ✅ |
| Rename a plan: upcoming sessions show the new name | WKT-10 | ✅ |
| Long-press delete of an exercise and of a day both ask first | WKT-08 | ✅ |
| Weekdays: tap again to clear; two days on one weekday; a day with none | WDY-02, 03, 05 | ✅ |
| Import: Cancel changes nothing; non-database files cannot be picked; an **old-format database** imports and a plan from it can be scheduled | BKP-03, 05, 04 | ✅ |
| Empty *Workout Plans* card | UIX-14 | ✅ |
| Light theme: Home, plans, sessions, progress, settings, workout | DRK-02 | ✅ |
| Very long plan, day and exercise names wrap, nothing runs off the screen | ROB-04 | ✅ |
| Numbers typed but not saved survive sending the app to the background | WRK-21 | ✅ |

### Fixed in this pass

- **Tapping *This week* on Home** landed on a workout screen left open in the Sessions tab, not on the calendar. It now opens the calendar.

### Notes

- A very long name is cut with "…" in the workout screen header (the full name is shown in the plan).

---

## Pass 8 - Form notes, focus areas, name, light default (build `c2105ef`)

Run on the emulator with a real key (about $0.10).

| Area | Cases | Result |
|---|---|---|
| **All** focus areas and no cap on the others | GEN-03 | ✅ |
| A 5-day plan with all focus areas: every form note is 172 to 559 characters (median 421), in the order why, setup, how to do it, what to avoid, with load advice; warm-up entries are numbered steps; no em or en dashes | GEN-17 | ✅ |
| Fresh install: starts in **light**; the first welcome page asks for a name; Home then says *Hi, <name>!* | GEN-18, UIX-02 | ✅ |

How the form-note rule is enforced: the prompt requires it for every exercise (plans and refinements), and a plan with a thin note (under 150 characters, or under 40 for a one-set warm-up or cardio entry) is rejected and asked for again with the exercise names. Em and en dashes in anything the AI writes are replaced before it is shown or saved.
