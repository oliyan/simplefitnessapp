// Defaults for the "Personalise" settings. They are empty on purpose: the open-source app has no
// name or greeting. A gift build can fill these in before building; nothing here is required.
export type NoteKey = 'welcomeBack' | 'finish' | 'firstWorkout' | 'streak' | 'pr' | 'restDay';

export interface PersonalValues {
  userName: string; // who the app is for, e.g. a first name
  senderName: string; // who it is from, e.g. a first name
  greeting: string; // the line on Home
  dedication: string; // shown once on the first launch
  notes: Record<NoteKey, string>; // short messages shown at nice moments; {n} is a number
}

export const NOTE_LABELS: Record<NoteKey, string> = {
  welcomeBack: 'On Home, when a workout is planned for today',
  finish: 'After finishing a workout',
  firstWorkout: 'After the very first workout',
  streak: 'On a streak (use {n} for the number of weeks, {name} for your name)',
  pr: 'After a new personal record',
  restDay: 'On a rest day',
};

export const GENERIC_NOTES: Record<NoteKey, string> = {
  welcomeBack: 'Today is a good day to train, {name}. One set at a time.',
  finish: 'Another one in the bank. Well done, {name}.',
  firstWorkout: 'First workout done. The hardest part is starting, and you did it, {name}.',
  streak: '{n} weeks in a row, {name}. This is who you are now.',
  pr: 'A new personal best, {name}. Look at you!',
  restDay: 'Rest is part of the plan, {name}. Recover well.',
};

// The welcome pages. A private build can word these its own way.
export const ONBOARDING_TEXT = {
  dedicationTitle: '', // empty: "For <name>" or "Welcome"
  planBody: 'Build a workout plan, or let the coach write one for you. Put it on your calendar and it shows up on Home each day.',
  coachBody: 'Optional: add your Anthropic key in Settings and get a short note before each workout, and plans made for you. Everything stays on your phone.',
};

export const PERSONAL_DEFAULTS: PersonalValues = {
  userName: '',
  senderName: '',
  greeting: '',
  dedication: '',
  notes: { ...GENERIC_NOTES },
};
