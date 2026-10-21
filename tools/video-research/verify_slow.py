"""Gentle subtitle fetch: only the top pick of each exercise that has no subtitles yet, then the alternatives.
One request every 12 to 20 seconds; if YouTube blocks, wait 20 minutes and carry on (up to 6 times)."""
import json, time, random, sys
from youtube_transcript_api import YouTubeTranscriptApi
api = YouTubeTranscriptApi()
short = json.load(open('shortlist.json', encoding='utf-8'))
out = json.load(open('verified.json', encoding='utf-8'))
order = [c for cs in short.values() for c in cs[:1]] + [c for cs in short.values() for c in cs[1:]]
todo = [c['id'] for c in order if not (out.get(c['id']) or {}).get('text')]
waits = 0
for i in todo:
    while True:
        try:
            t = api.fetch(i, languages=['en', 'en-US', 'en-GB'])
            text = ' '.join(s.text for s in t)
            out[i] = {'text': text[:1500], 'words': len(text.split())}
            print(i, 'ok', flush=True)
            break
        except Exception as e:
            n = type(e).__name__
            if 'Blocked' in n or '429' in str(e):
                waits += 1
                print('blocked, wait 20 min', waits, flush=True)
                if waits > 6:
                    print('GIVING UP'); json.dump(out, open('verified.json', 'w', encoding='utf-8'), ensure_ascii=False); sys.exit(1)
                time.sleep(1200)
                continue
            out[i] = {'text': None, 'words': 0, 'why': n}
            print(i, 'none', n, flush=True)
            break
    json.dump(out, open('verified.json', 'w', encoding='utf-8'), ensure_ascii=False)
    time.sleep(random.uniform(12, 20))
print('DONE')
