import * as FileSystem from 'expo-file-system';

// Make sure to use backticks here:
const SETTINGS_FILE = `${FileSystem.documentDirectory}userSettings.json`;

// Merges onto whatever is already on disk, so callers that only know about a
// subset of the settings (e.g. SettingsContext's autosave) can't wipe the rest.
export const saveSettings = async (settings: object) => {
  try {
    const existing = (await loadSettings()) ?? {};
    await FileSystem.writeAsStringAsync(
      SETTINGS_FILE,
      JSON.stringify({ ...existing, ...settings }),
    );
    console.log('Settings saved successfully.');
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

export const loadSettings = async () => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(SETTINGS_FILE);
    if (!fileInfo.exists) {
      console.log("Settings file doesn't exist, using default settings.");
      return null;
    }

    const settings = await FileSystem.readAsStringAsync(SETTINGS_FILE);
    return JSON.parse(settings);
  } catch (error) {
    console.error('Error loading settings:', error);
    return null;
  }
};
