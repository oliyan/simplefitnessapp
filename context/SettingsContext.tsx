import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { loadSettings, saveSettings } from '../utils/settingsStorage';
import * as Localization from 'expo-localization';
import { requestNotificationPermissions } from '../utils/notificationUtils';

// Date, time and week-start formats are fixed (not user settings): dd/mm/yyyy,
// 12-hour clock with AM/PM, weeks start on Monday. They stay in the context so the
// screens that format dates keep reading them from one place.
const DATE_FORMAT = 'dd-mm-yyyy';
const TIME_FORMAT: '24h' | 'AM/PM' = 'AM/PM';
const FIRST_WEEKDAY: 'Sunday' | 'Monday' = 'Monday';

// Get device's preferred measurement system for weight
const getDeviceWeightFormat = (): 'lbs' | 'kg' => {
  const locale = Localization.getLocales()[0];
  // 'us' measurement system means pounds
  if (locale?.measurementSystem === 'us') {
    return 'lbs';
  }
  return 'kg';
};

type SettingsContextType = {
  dateFormat: string;
  timeFormat: '24h' | 'AM/PM';
  firstWeekday: 'Sunday' | 'Monday';
  weightFormat: string;
  setWeightFormat: (fmt: string) => void;
  notificationPermissionGranted: boolean;
  setNotificationPermissionGranted: (granted: boolean) => void;
  requestNotificationPermission: () => Promise<boolean>;
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  const [weightFormat, setWeightFormat] = useState('kg');
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
      setWeightFormat(savedSettings?.weightFormat || getDeviceWeightFormat());
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
    saveSettings({ weightFormat, notificationPermissionGranted });
  }, [weightFormat, notificationPermissionGranted, isInitialized]);

  return (
    <SettingsContext.Provider
      value={{
        dateFormat: DATE_FORMAT,
        timeFormat: TIME_FORMAT,
        firstWeekday: FIRST_WEEKDAY,
        weightFormat,
        setWeightFormat,
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
