import { loadSettings, saveSettings } from './settingsStorage';

export const EQUIPMENT_OPTIONS = [
  'Full gym', 'Barbell', 'Dumbbells', 'Bench', 'Cable machine',
  'Pull-up bar', 'Resistance bands', 'Bodyweight only',
];

export interface CoachProfile {
  equipment: string[];
  standingConstraints: string; // injuries and other lasting constraints, in the user's words
}

// Stored as flat keys in userSettings.json; saveSettings merges, so the existing
// settings are untouched.
export const loadCoachProfile = async (): Promise<CoachProfile> => {
  const settings = await loadSettings();
  return {
    equipment: Array.isArray(settings?.equipmentList) ? settings.equipmentList : ['Full gym'],
    standingConstraints: typeof settings?.standingConstraints === 'string' ? settings.standingConstraints : '',
  };
};

export const saveEquipment = (equipment: string[]) => saveSettings({ equipmentList: equipment });

export const saveStandingConstraints = (text: string) => saveSettings({ standingConstraints: text.trim() });
