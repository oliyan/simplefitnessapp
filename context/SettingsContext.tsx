import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { loadSettings, saveSettings } from '../utils/settingsStorage';
import { requestNotificationPermissions } from '../utils/notificationUtils';
import { WEIGHT_UNIT } from '../utils/weightUnit';

// Date, time, week-start and weight formats are fixed (not user settings): dd/mm/yyyy,
// 12-hour clock with AM/PM, weeks start on Monday, weights in kg. They stay in the context so
// the screens that format them keep reading them from one place.
const DATE_FORMAT = 'dd-mm-yyyy';
const TIME_FORMAT: '24h' | 'AM/PM' = 'AM/PM';
const FIRST_WEEKDAY: 'Sunday' | 'Monday' = 'Monday';

type SettingsContextType = {
  dateFormat: string;
  timeFormat: '24h' | 'AM/PM';
  firstWeekday: 'Sunday' | 'Monday';
  weightFormat: string;
  notificationPermissionGranted: boolean;
  setNotificationPermissionGranted: (granted: boolean) => void;
  requestNotificationPermission: () => Promise<boolean>;
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  const [notificationPermissionGranted, setNotificationPermissionGranted] =
    useState(false);

  // Function to request notification permission
  const requestNotificationPermission = async (): Promise<boolean> => {
    const granted = await requestNotificationPermissions();
    setNotificationPermissionGranted(granted);
    return granted;
  };

  // Load settings on mount
  useEffect(() => {
    const initializeSettings = async () => {
      const savedSettings = await loadSettings();
      setNotificationPermissionGranted(
        savedSettings?.notificationPermissionGranted || false,
      );
      setIsInitialized(true);
    };
    initializeSettings();
  }, []);

  // Save settings only after initial load
  useEffect(() => {
    if (!isInitialized) return;
    saveSettings({ notificationPermissionGranted });
  }, [notificationPermissionGranted, isInitialized]);

  return (
    <SettingsContext.Provider
      value={{
        dateFormat: DATE_FORMAT,
        timeFormat: TIME_FORMAT,
        firstWeekday: FIRST_WEEKDAY,
        weightFormat: WEIGHT_UNIT,
        notificationPermissionGranted,
        setNotificationPermissionGranted,
        requestNotificationPermission,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

// Export a custom hook so consumers can read from our SettingsContext
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
