import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadSettings, saveSettings } from '../utils/settingsStorage';
import { PERSONAL_DEFAULTS, PersonalValues, NoteKey } from '../config/personalDefaults';

// The personal touches (names, greeting, dedication, notes) and two "seen once" flags.
// Stored in the same settings file as the other preferences.
type PersonalContextType = {
  loaded: boolean;
  personal: PersonalValues;
  updatePersonal: (changes: Partial<PersonalValues>) => void;
  onboardingSeen: boolean;
  markOnboardingSeen: () => void;
  replayOnboarding: () => void;
  // Name shown for the AI coach: "Advice from <name>" when a sender is set, otherwise "AI Coach".
  coachName: string;
  // A note with {n} filled in and the sender's name appended, or '' when empty.
  noteText: (key: NoteKey, n?: number) => string;
};

const PersonalContext = createContext<PersonalContextType | undefined>(undefined);

export function PersonalProvider({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [personal, setPersonal] = useState<PersonalValues>(PERSONAL_DEFAULTS);
  const [onboardingSeen, setOnboardingSeen] = useState(true); // true until loaded: no flash

  useEffect(() => {
    (async () => {
      const saved = await loadSettings();
      if (saved?.personal) {
        setPersonal({
          ...PERSONAL_DEFAULTS,
          ...saved.personal,
          notes: { ...PERSONAL_DEFAULTS.notes, ...(saved.personal.notes ?? {}) },
        });
      }
      setOnboardingSeen(!!saved?.onboardingSeen);
      setLoaded(true);
    })();
  }, []);

  const updatePersonal = (changes: Partial<PersonalValues>) => {
    setPersonal((prev) => {
      const next = { ...prev, ...changes };
      saveSettings({ personal: next });
      return next;
    });
  };

  const markOnboardingSeen = () => {
    setOnboardingSeen(true);
    saveSettings({ onboardingSeen: true });
  };

  const replayOnboarding = () => {
    setOnboardingSeen(false);
    saveSettings({ onboardingSeen: false });
  };

  const coachName = personal.senderName.trim() ? `Advice from ${personal.senderName.trim()}` : 'AI Coach';

  const noteText = (key: NoteKey, n?: number) => {
    const raw = (personal.notes[key] ?? '').trim();
    if (!raw) return '';
    const text = raw.replace('{n}', String(n ?? ''));
    return personal.senderName.trim() ? `${text}\n— ${personal.senderName.trim()}` : text;
  };

  return (
    <PersonalContext.Provider
      value={{ loaded, personal, updatePersonal, onboardingSeen, markOnboardingSeen, replayOnboarding, coachName, noteText }}
    >
      {children}
    </PersonalContext.Provider>
  );
}

export function usePersonal() {
  const context = useContext(PersonalContext);
  if (!context) throw new Error('usePersonal must be used within a PersonalProvider');
  return context;
}
