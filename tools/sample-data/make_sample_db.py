"""Builds a SimpleDB.db with about 12 weeks of believable workout history, for trying the Progress screens.

    python make_sample_db.py out.db [days_back_for_last_session]

Copy the file to the phone or emulator (adb push out.db /sdcard/Download/SimpleDB.db) and use
Settings > Import data. It replaces everything in the app, so use a test install.
"""
import sqlite3, sys, random, datetime


OUT = sys.argv[1] if len(sys.argv) > 1 else 'sample.db'
LAST = int(sys.argv[2]) if len(sys.argv) > 2 else 0          # 0 = the newest session is today
TZ = datetime.timezone(datetime.timedelta(hours=5, minutes=30))   # the test emulator's zone (India, no DST); change to yours
random.seed(7)

PLAN = 'Push Pull Legs'
DAYS = {
    'Push': [('Bench Press', 4, 8, 'chest', 40, 2.5), ('Overhead Press', 3, 8, 'shoulders', 25, 1.25),
             ('Incline Dumbbell Press', 3, 10, 'chest', 14, 1), ('Lateral Raise', 3, 15, 'shoulders', 6, 0.5),
             ('Tricep Rope Pushdown', 3, 12, 'triceps', 20, 1.25)],
    'Pull': [('Deadlift', 3, 5, 'back', 60, 5), ('Lat Pulldown', 3, 10, 'back', 40, 2.5),
             ('Seated Cable Row', 3, 10, 'back', 35, 2.5), ('Face Pulls', 3, 15, 'shoulders', 15, 1.25),
             ('Dumbbell Bicep Curl', 3, 12, 'biceps', 8, 0.5)],
    'Legs': [('Squat', 4, 6, 'quads', 50, 2.5), ('Romanian Deadlift', 3, 10, 'hamstrings', 40, 2.5),
             ('Leg Press', 3, 12, 'quads', 90, 5), ('Leg Curl Machine', 3, 12, 'hamstrings', 25, 2.5),
             ('Plank', 3, 1, 'abs', 0, 0)],
}
ORDER = ['Push', 'Pull', 'Legs']

db = sqlite3.connect(OUT)
db.executescript("""
PRAGMA foreign_keys = OFF;
CREATE TABLE Workouts (workout_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, workout_name TEXT NOT NULL UNIQUE);
CREATE TABLE Days (day_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, workout_id INTEGER NOT NULL, day_name TEXT NOT NULL, weekday INTEGER,
  UNIQUE(workout_id, day_name));
CREATE TABLE Exercises (exercise_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, day_id INTEGER NOT NULL, exercise_name TEXT NOT NULL,
  sets INTEGER NOT NULL, reps INTEGER NOT NULL, web_link TEXT, muscle_group TEXT, exercise_notes TEXT, difficulty TEXT, suggested_weight TEXT, comments TEXT);
CREATE TABLE Workout_Log (workout_log_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, workout_name TEXT NOT NULL, day_name TEXT NOT NULL,
  workout_date INTEGER NOT NULL, notification_id TEXT, completion_time INTEGER, in_progress INTEGER DEFAULT 0, UNIQUE (workout_date, day_name, workout_name));
CREATE TABLE Logged_Exercises (logged_exercise_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, workout_log_id INTEGER NOT NULL,
  exercise_name TEXT NOT NULL, sets INTEGER NOT NULL, reps INTEGER NOT NULL, web_link TEXT, muscle_group TEXT, exercise_notes TEXT,
  difficulty TEXT, suggested_weight TEXT, comments TEXT);
CREATE TABLE Weight_Log (weight_log_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, workout_log_id INTEGER NOT NULL,
  logged_exercise_id INTEGER NOT NULL, exercise_name TEXT NOT NULL, set_number INTEGER NOT NULL, weight_logged REAL NOT NULL,
  reps_logged INTEGER NOT NULL, muscle_group TEXT, difficulty TEXT, comments TEXT, completion_time INTEGER,
  UNIQUE (workout_log_id, logged_exercise_id, set_number));
""")
db.execute('INSERT INTO Workouts (workout_name) VALUES (?)', (PLAN,))
for i, (day, exs) in enumerate(DAYS.items()):
    db.execute('INSERT INTO Days (workout_id, day_name, weekday) VALUES (1, ?, ?)', (day, [1, 3, 5][i]))
    for e in exs:
        db.execute('INSERT INTO Exercises (day_id, exercise_name, sets, reps, muscle_group) VALUES (?, ?, ?, ?, ?)', (i + 1, e[0], e[1], e[2], e[3]))

today = datetime.datetime.now(TZ).date() - datetime.timedelta(days=LAST)
# Mon, Wed, Fri for 12 weeks ending this week; week 7 skipped, week 3 only one session.
monday = today - datetime.timedelta(days=today.weekday())
sessions = []
for w in range(12):
    start = monday - datetime.timedelta(weeks=11 - w)
    if w == 6:
        continue
    offs = [0, 2, 4] if w != 2 else [2]
    for o in offs:
        d = start + datetime.timedelta(days=o)
        if d <= today:
            sessions.append(d)
n = 0
for idx, d in enumerate(sessions):
    day = ORDER[idx % 3]
    mid = int(datetime.datetime(d.year, d.month, d.day, tzinfo=TZ).timestamp())
    cur = db.execute('INSERT INTO Workout_Log (workout_name, day_name, workout_date, completion_time) VALUES (?, ?, ?, ?)',
                     (PLAN, day, mid, random.randint(2700, 4200)))
    lid = cur.lastrowid
    prog = idx // 3
    for ename, sets, reps, mg, w0, step in DAYS[day]:
        c = db.execute('INSERT INTO Logged_Exercises (workout_log_id, exercise_name, sets, reps, muscle_group) VALUES (?, ?, ?, ?, ?)',
                       (lid, ename, sets, reps, mg))
        lex = c.lastrowid
        for s in range(1, sets + 1):
            wt = w0 + step * (prog // 2) if w0 else 0
            r = reps if w0 else 30 + 5 * (prog // 3)
            if w0 and s == sets: r = max(reps - 2, 5)
            db.execute('INSERT INTO Weight_Log (workout_log_id, logged_exercise_id, exercise_name, set_number, weight_logged, reps_logged, muscle_group) '
                       'VALUES (?, ?, ?, ?, ?, ?, ?)', (lid, lex, ename, s, wt, r, mg))
            n += 1
db.execute('PRAGMA user_version = 1')
db.commit()
print(len(sessions), 'sessions,', n, 'sets ->', OUT)
