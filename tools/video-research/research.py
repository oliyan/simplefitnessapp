import json, re, sys, time
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi

# plan name -> (search phrase, [must-have regexes, all required in title+subtitles], [avoid regexes in the title])
SPEC = {
    'Incline Dumbbell Press': ('incline dumbbell press form', [r'incline', r'dumbbell'], [r'barbell', r'smith']),
    'Pec Fly Machine': ('pec deck machine chest fly form', [r'pec|chest', r'fly|deck'], [r'dumbbell fly', r'cable']),
    'Tricep Rope Pushdown': ('tricep rope pushdown form', [r'rope', r'push ?down'], []),
    'Dumbbell Overhead Tricep Extension': ('dumbbell overhead tricep extension form', [r'overhead', r'tricep'], [r'cable', r'skull']),
    'Hip Thrust': ('hip thrust form', [r'hip thrust'], [r'band']),
    'Cable Glute Kickback': ('cable glute kickback form', [r'kick ?back', r'cable'], []),
    'Lat Pulldown': ('lat pulldown form', [r'pull ?down'], [r'reverse grip', r'straight arm']),
    'Seated Row (Cable Machine)': ('seated cable row form', [r'row', r'seated|cable'], [r'dumbbell row', r'bent']),
    'Assisted Pull-up Machine': ('assisted pull up machine how to use', [r'assist'], []),
    'Face Pulls': ('cable face pull form', [r'face ?pull'], []),
    'Back Extension': ('back extension hyperextension bench form', [r'back extension|hyperextension|45'], [r'tricep', r'leg extension']),
    'Dead Bug': ('dead bug exercise form', [r'dead ?bug'], []),
    'Goblet Squat': ('goblet squat form', [r'goblet'], []),
    'Leg Press': ('leg press form', [r'leg press'], [r'calf']),
    'Romanian Deadlift - Dumbbell': ('dumbbell romanian deadlift form', [r'romanian|rdl', r'dumbbell'], [r'barbell rdl', r'single']),
    'Leg Curl Machine': ('seated leg curl machine form', [r'leg curl'], [r'nordic']),
    'Hip Abductor Machine': ('hip abduction machine form', [r'abduct'], [r'band']),
    'Leg Extension': ('leg extension machine form', [r'leg extension'], []),
    'Seated Dumbbell Shoulder Press': ('seated dumbbell shoulder press form', [r'shoulder press|overhead press', r'dumbbell', r'seated|bench'], [r'arnold', r'standing', r'barbell']),
    'Dumbbell Lateral Raise': ('dumbbell lateral raise form', [r'lateral raise'], [r'cable', r'front raise']),
    'Reverse Pec Fly Machine': ('reverse pec deck rear delt fly machine form', [r'rear|reverse', r'fly|deck'], [r'dumbbell']),
    'Plank': ('plank form', [r'plank'], [r'side plank', r'challenge', r'push']),
    'Side Plank': ('side plank form', [r'side plank'], []),
    'Bicycle Crunch': ('bicycle crunch form', [r'bicycle'], []),
    'Dumbbell Bicep Curl': ('dumbbell bicep curl form', [r'curl', r'dumbbell'], [r'hammer', r'preacher', r'incline', r'concentration']),
    'Hammer Curl': ('dumbbell hammer curl form', [r'hammer'], []),
    'Bench Dips': ('bench dips form', [r'dip', r'bench'], [r'parallel bar']),
    'Dumbbell Step-up': ('dumbbell step up form', [r'step[ -]?up'], []),
    'Dumbbell Reverse Lunge': ('dumbbell reverse lunge form', [r'reverse lunge'], [r'walking']),
    'Cool-down Stretches': ('full body stretching after workout', [r'stretch'], []),
    'Cooldown D1 chest triceps glutes': ('chest doorway stretch tricep stretch figure 4 glute stretch', [r'stretch', r'chest|tricep|glute|figure'], []),
    'Cooldown D2 back posture': ('childs pose lat stretch cat cow back stretch after workout', [r'stretch|child|cat', r'back|lat|cow|child'], []),
    'Cooldown D3 legs': ('hip flexor hamstring glute stretch after leg day', [r'stretch', r'hip flexor|hamstring|glute|leg'], []),
    'Cooldown D4 shoulders core': ('shoulder stretch chest opener childs pose after workout', [r'stretch', r'shoulder|chest|child'], []),
    'Cooldown D5 arms glutes legs': ('bicep stretch hip flexor figure 4 glute stretch cool down', [r'stretch', r'bicep|hip flexor|glute|figure'], []),
}


def search(ydl, query, n=20):
    try:
        r = ydl.extract_info(f'ytsearch{n}:{query}', download=False)
    except Exception as e:
        print('search failed', query, e, file=sys.stderr)
        return []
    return r.get('entries', [])


def transcript(vid, api):
    try:
        t = api.fetch(vid, languages=['en', 'en-US', 'en-GB'])
        return ' '.join(s.text for s in t)
    except Exception:
        return None


def main(names):
    ydl = yt_dlp.YoutubeDL({'quiet': True, 'extract_flat': True, 'skip_download': True, 'no_warnings': True})
    api = YouTubeTranscriptApi()
    out = {}
    for name in names:
        query, must, avoid = SPEC[name]
        cands = {}
        for q in (query + ' #shorts', query + ' short', query):
            for e in search(ydl, q):
                vid = e.get('id')
                dur = e.get('duration') or 0
                if not vid or vid in cands:
                    continue
                if not (8 <= dur <= 120):
                    continue
                cands[vid] = {
                    'id': vid,
                    'url': f'https://www.youtube.com/shorts/{vid}' if dur <= 75 else f'https://www.youtube.com/watch?v={vid}',
                    'title': e.get('title') or '',
                    'channel': e.get('channel') or e.get('uploader') or '',
                    'views': e.get('view_count') or 0,
                    'duration': dur,
                }
        ranked = sorted(cands.values(), key=lambda c: -c['views'])[:10]
        for c in ranked:
            text = transcript(c['id'], api)
            c['has_transcript'] = text is not None
            hay = (c['title'] + ' ' + (text or '')).lower()
            c['must_hits'] = sum(bool(re.search(m, hay)) for m in must)
            c['must_total'] = len(must)
            c['avoid_hit'] = any(re.search(a, c['title'].lower()) for a in avoid)
            c['transcript'] = (text or '')[:420]
            time.sleep(0.4)
        out[name] = ranked
        print(f'{name}: {len(cands)} short candidates, {len(ranked)} checked', flush=True)
        json.dump(out, open(sys.argv[1], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main(sys.argv[2:] or list(SPEC))
