import json, re, time, sys
from youtube_transcript_api import YouTubeTranscriptApi
api = YouTubeTranscriptApi()
short = json.load(open('shortlist.json', encoding='utf-8'))
try:
    out = json.load(open('verified.json', encoding='utf-8'))
except Exception:
    out = {}
blocked = 0
for name, cs in short.items():
    for c in cs:
        if c['id'] in out and out[c['id']].get('text') is not None:
            continue
        try:
            t = api.fetch(c['id'], languages=['en', 'en-US', 'en-GB'])
            text = ' '.join(s.text for s in t)
            blocked = 0
        except Exception as e:
            text = None
            if 'Blocked' in type(e).__name__ or '429' in str(e):
                blocked += 1
        out[c['id']] = {'text': text[:1500] if text else None, 'words': len(text.split()) if text else 0}
        print(name, c['id'], 'ok' if text else 'none', flush=True)
        json.dump(out, open('verified.json', 'w', encoding='utf-8'), ensure_ascii=False)
        if blocked >= 3:
            print('BLOCKED, stopping'); sys.exit(1)
        time.sleep(3.5)
print('DONE')
