import bundled from '../data/exercise-videos.json';
import { VIDEO_LIST_URL } from '../config/videoList';
import { loadSettings, saveSettings } from './settingsStorage';

type VideoEntry = { exercise: string; aliases?: string[]; url: string };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const index = (videos: VideoEntry[]) => {
  const map = new Map<string, string>();
  for (const v of videos) {
    if (!v?.url || !/^https:\/\/(www\.)?youtube\.com\/watch\?v=/.test(v.url)) continue;
    for (const n of [v.exercise, ...(v.aliases ?? [])]) map.set(norm(n), v.url);
  }
  return map;
};

let known = index(bundled.videos);
let names: string[] = bundled.videos.map((v) => v.exercise);

const use = (videos: VideoEntry[]) => {
  known = index(videos);
  names = videos.map((v) => v.exercise);
};

// The video for an exercise name, or null when the list has none.
export const videoLinkFor = (exerciseName: string | null | undefined): string | null =>
  exerciseName ? known.get(norm(exerciseName)) ?? null : null;

// What a plan saves: the link it already has, else the list's one.
export const withVideoLink = (exerciseName: string, link?: string | null): string | null =>
  link || videoLinkFor(exerciseName);

// Exercise names the list covers, so the plan generator can prefer them.
export const videoExerciseNames = (): string[] => names;

// Uses the last downloaded copy, then tries to fetch a fresh one. Never throws: offline just keeps what it has.
export const refreshVideoList = async (): Promise<void> => {
  try {
    const saved = (await loadSettings())?.videoList;
    if (Array.isArray(saved) && saved.length) use(saved);
    if (!VIDEO_LIST_URL) return;
    const res = await fetch(VIDEO_LIST_URL, { headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) return;
    const data = await res.json();
    if (!Array.isArray(data?.videos) || data.videos.length < 5) return;
    use(data.videos);
    await saveSettings({ videoList: data.videos });
  } catch {
    // keep the copy already in use
  }
};
