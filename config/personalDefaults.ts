// Defaults for the "Personalise" settings. They are empty on purpose: the open-source app has no
// name or greeting. A gift build can fill these in before building; nothing here is required.
export type NoteKey = 'welcomeBack' | 'finish' | 'firstWorkout' | 'streak' | 'pr' | 'restDay';

export interface PersonalValues {
  userName: string; // who the app is for, e.g. "Anu"
  senderName: string; // who it is from, e.g. "Sankar"
  greeting: string; // the line on Home
  dedication: string; // shown once on the first launch
  notes: Record<NoteKey, string>; // short messages shown at nice moments; {n} is a number
}

export const NOTE_LABELS: Record<NoteKey, string> = {
  welcomeBack: 'On Home, when a workout is planned for today',
  finish: 'After finishing a workout',
  firstWorkout: 'After the very first workout',
  streak: 'On a streak (use {n} for the number of weeks)',
  pr: 'After a new personal record',
  restDay: 'On a rest day',
};

export const GENERIC_NOTES: Record<NoteKey, string> = {
  welcomeBack: 'Today is a good day to train. One set at a time.',
  finish: 'Another one in the bank. Well done.',
  firstWorkout: 'First workout done. The hardest part is starting, and you did.',
  streak: '{n} weeks in a row. This is who you are now.',
  pr: 'A new personal best. Look at you!',
  restDay: 'Rest is part of the plan. Recover well.',
};

export const PERSONAL_DEFAULTS: PersonalValues = {
  userName: '',
  senderName: '',
  greeting: '',
  dedication: '',
  notes: { ...GENERIC_NOTES },
};
