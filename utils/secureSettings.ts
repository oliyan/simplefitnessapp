import * as SecureStore from 'expo-secure-store';

// The API key lives only in the device keystore - never in userSettings.json,
// which is plaintext.
const API_KEY_NAME = 'llm_api_key';

export const getApiKey = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(API_KEY_NAME);
  } catch (error) {
    console.error('Error reading API key:', error);
    return null;
  }
};

export const saveApiKey = async (key: string): Promise<void> => {
  await SecureStore.setItemAsync(API_KEY_NAME, key.trim());
};

export const deleteApiKey = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(API_KEY_NAME);
};
