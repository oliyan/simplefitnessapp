import json, time, sys
import yt_dlp
res = json.load(open('all.json', encoding='utf-8'))
ydl = yt_dlp.YoutubeDL({'quiet': True, 'skip_download': True, 'no_warnings': True})
info = {}
try:
    info = json.load(open('info.json', encoding='utf-8'))
except Exception:
    pass
for name, cs in res.items():
    cands = [c for c in cs if not c['avoid_hit']][:6]
    for c in cands:
        vid = c['id']
        if vid in info:
            continue
        try:
            i = ydl.extract_info('https://www.youtube.com/watch?v=' + vid, download=False)
            info[vid] = {
                'w': i.get('width'), 'h': i.get('height'),
                'desc': (i.get('description') or '')[:400],
                'date': i.get('upload_date'), 'followers': i.get('channel_follower_count'),
                'likes': i.get('like_count'), 'tags': (i.get('tags') or [])[:12],
                'embeddable': i.get('playable_in_embed'), 'avail': i.get('availability'),
            }
        except Exception as e:
            info[vid] = {'error': str(e)[:120]}
        time.sleep(1.0)
    json.dump(info, open('info.json', 'w', encoding='utf-8'), ensure_ascii=False)
    print(name, len(info), flush=True)
